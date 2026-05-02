from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))


@pytest.fixture()
def client(monkeypatch, tmp_path):
    db_path = tmp_path / "billing-test.db"
    monkeypatch.setenv("CUSTOMER_DATABASE", str(db_path))
    monkeypatch.setenv("STRIPE_ENABLED", "true")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_example")
    monkeypatch.setenv("STRIPE_PUBLISHABLE_KEY", "pk_test_example")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_example")

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def models():
    from app.models import Customer, Product, SubscriptionPlan
    from app.services.common import utc_now

    suffix = uuid4().hex
    now = utc_now()
    product = Product.objects.create(
        name=f"Test Shirt {suffix}",
        description="Cotton shirt",
        price=25.0,
        stock=5,
        created_at=now,
        updated_at=now,
    )
    customer = Customer.objects.create(
        name="Test Customer",
        email=f"customer-{suffix}@example.com",
        passwd_hash="hashed",
        created_at=now,
        updated_at=now,
    )
    plan = SubscriptionPlan.objects.create(
        name="Monthly Club",
        description="Recurring membership",
        stripe_price_id=f"price_{suffix}",
        active=True,
        created_at=now,
        updated_at=now,
    )
    return SimpleNamespace(product=product, customer=customer, plan=plan)


def patch_stripe(monkeypatch):
    from app.services import billing

    suffix = uuid4().hex
    monkeypatch.setattr(
        billing.stripe.Customer,
        "create",
        lambda **_kwargs: SimpleNamespace(id=f"cus_{suffix}"),
    )
    monkeypatch.setattr(
        billing.stripe.checkout.Session,
        "create",
        lambda **kwargs: SimpleNamespace(
            id=f"cs_{kwargs['mode']}_{suffix}",
            client_secret=f"secret_{kwargs['mode']}",
            status="open",
            payment_status="unpaid",
            subscription="sub_test" if kwargs["mode"] == "subscription" else None,
        ),
    )
    monkeypatch.setattr(
        billing.stripe.Subscription,
        "retrieve",
        lambda _subscription_id: {
            "id": "sub_test",
            "customer": "cus_test",
            "status": "active",
            "current_period_start": None,
            "current_period_end": None,
            "cancel_at_period_end": False,
            "canceled_at": None,
        },
    )


def test_guest_payment_checkout_session_returns_client_secret(client, models, monkeypatch):
    patch_stripe(monkeypatch)

    response = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "guest": {"name": "Guest Buyer", "email": "guest@example.com"},
            "items": [{"product_id": models.product.id, "quantity": 2}],
        },
    )

    assert response.status_code == 201
    assert response.json()["session_id"].startswith("cs_payment_")
    assert response.json()["client_secret"] == "secret_payment"


def test_registered_customer_payment_checkout_session_returns_client_secret(client, models, monkeypatch):
    patch_stripe(monkeypatch)

    response = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "customer_id": models.customer.id,
            "items": [{"product_id": models.product.id, "quantity": 1}],
        },
    )

    assert response.status_code == 201
    assert response.json()["client_secret"] == "secret_payment"


def test_subscription_checkout_session_uses_plan_price(client, models, monkeypatch):
    captured = {}

    from app.services import billing

    suffix = uuid4().hex
    monkeypatch.setattr(
        billing.stripe.Customer,
        "create",
        lambda **_kwargs: SimpleNamespace(id=f"cus_{suffix}"),
    )

    def fake_create(**kwargs):
        captured.update(kwargs)
        return SimpleNamespace(
            id="cs_subscription",
            client_secret="secret_subscription",
            status="open",
            payment_status="unpaid",
            subscription="sub_test",
        )

    monkeypatch.setattr(billing.stripe.checkout.Session, "create", fake_create)

    response = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "subscription",
            "customer_id": models.customer.id,
            "plan_id": models.plan.id,
        },
    )

    assert response.status_code == 201
    assert captured["mode"] == "subscription"
    assert captured["line_items"] == [{"price": models.plan.stripe_price_id, "quantity": 1}]


def test_checkout_requires_customer_or_guest(client, models):
    response = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "items": [{"product_id": models.product.id, "quantity": 1}],
        },
    )

    assert response.status_code == 422


def test_insufficient_stock_fails_cleanly(client, models, monkeypatch):
    patch_stripe(monkeypatch)

    response = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "guest": {"name": "Guest Buyer", "email": "stock@example.com"},
            "items": [{"product_id": models.product.id, "quantity": 99}],
        },
    )

    assert response.status_code == 409


def test_webhook_signature_failure_returns_400(client, monkeypatch):
    from app.api.v1.routes import billing as route

    def raise_signature_error(**_kwargs):
        raise route.stripe.error.SignatureVerificationError("bad signature", "sig")

    monkeypatch.setattr(route.stripe.Webhook, "construct_event", raise_signature_error)

    response = client.post(
        "/api/v1/billing/webhooks/stripe",
        content=b"{}",
        headers={"stripe-signature": "bad"},
    )

    assert response.status_code == 400


def test_checkout_completed_webhook_is_idempotent(client, models, monkeypatch):
    patch_stripe(monkeypatch)
    created = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "guest": {"name": "Guest Buyer", "email": "idem@example.com"},
            "items": [{"product_id": models.product.id, "quantity": 1}],
        },
    )
    assert created.status_code == 201
    session_id = created.json()["session_id"]

    from app.api.v1.routes import billing as route
    from app.models import Order

    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": session_id,
                "mode": "payment",
                "status": "complete",
                "payment_status": "paid",
            }
        },
    }
    monkeypatch.setattr(route.stripe.Webhook, "construct_event", lambda **_kwargs: event)

    first = client.post(
        "/api/v1/billing/webhooks/stripe",
        content=b"{}",
        headers={"stripe-signature": "ok"},
    )
    second = client.post(
        "/api/v1/billing/webhooks/stripe",
        content=b"{}",
        headers={"stripe-signature": "ok"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert len(Order.objects.all()) == 1


def test_subscription_webhook_updates_status(client, monkeypatch):
    from app.api.v1.routes import billing as route
    from app.models import CustomerSubscription

    event = {
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_status",
                "customer": "cus_status",
                "status": "past_due",
                "current_period_start": None,
                "current_period_end": None,
                "cancel_at_period_end": True,
                "canceled_at": None,
            }
        },
    }
    monkeypatch.setattr(route.stripe.Webhook, "construct_event", lambda **_kwargs: event)

    response = client.post(
        "/api/v1/billing/webhooks/stripe",
        content=b"{}",
        headers={"stripe-signature": "ok"},
    )

    rows = CustomerSubscription.objects.filter(stripe_subscription_id="sub_status")
    assert response.status_code == 200
    assert rows[0].status == "past_due"
    assert rows[0].cancel_at_period_end is True
