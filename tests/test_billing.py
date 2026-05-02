from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4


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


def test_billing_config_and_plan_routes(client, sample_data):
    from app.models import CustomerSubscription
    from app.services.common import utc_now

    now = utc_now()
    CustomerSubscription.objects.create(
        stripe_subscription_id="sub_visible",
        stripe_customer_id="cus_visible",
        customer_id=sample_data.customer.id,
        status="active",
        current_period_start=None,
        current_period_end=None,
        cancel_at_period_end=False,
        canceled_at=None,
        created_at=now,
        updated_at=now,
    )

    config = client.get("/api/v1/billing/config")
    plans = client.get("/api/v1/billing/subscription-plans")
    subscriptions = client.get(f"/api/v1/billing/customers/{sample_data.customer.id}/subscriptions")

    assert config.status_code == 200
    assert config.json()["publishable_key"] == "pk_test_example"
    assert plans.status_code == 200
    assert plans.json()[0]["id"] == sample_data.plan.id
    assert subscriptions.status_code == 200
    assert subscriptions.json()[0]["stripe_subscription_id"] == "sub_visible"


def test_guest_payment_checkout_session_returns_client_secret(client, sample_data, monkeypatch):
    patch_stripe(monkeypatch)

    response = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "guest": {"name": "Guest Buyer", "email": "guest@example.com"},
            "items": [{"product_id": sample_data.product.id, "quantity": 2}],
        },
    )

    assert response.status_code == 201
    assert response.json()["session_id"].startswith("cs_payment_")
    assert response.json()["client_secret"] == "secret_payment"

    status = client.get(f"/api/v1/billing/checkout-sessions/{response.json()['session_id']}")
    missing = client.get("/api/v1/billing/checkout-sessions/cs_missing")

    assert status.status_code == 200
    assert status.json()["mode"] == "payment"
    assert missing.status_code == 404


def test_registered_customer_payment_checkout_session_returns_client_secret(client, sample_data, monkeypatch):
    patch_stripe(monkeypatch)

    response = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "customer_id": sample_data.customer.id,
            "items": [{"product_id": sample_data.product.id, "quantity": 1}],
        },
    )

    assert response.status_code == 201
    assert response.json()["client_secret"] == "secret_payment"


def test_subscription_checkout_session_uses_plan_price(client, sample_data, monkeypatch):
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
            "customer_id": sample_data.customer.id,
            "plan_id": sample_data.plan.id,
        },
    )

    assert response.status_code == 201
    assert captured["mode"] == "subscription"
    assert captured["line_items"] == [{"price": sample_data.plan.stripe_price_id, "quantity": 1}]


def test_portal_session_route_uses_registered_or_explicit_stripe_customer(client, sample_data, monkeypatch):
    from app.models import StripeCustomer
    from app.services.common import utc_now
    from app.services import billing

    captured = {}
    now = utc_now()
    StripeCustomer.objects.create(
        customer_id=sample_data.customer.id,
        guest_name=None,
        guest_email=None,
        stripe_customer_id="cus_portal",
        created_at=now,
        updated_at=now,
    )

    def fake_create(**kwargs):
        captured.update(kwargs)
        return SimpleNamespace(url="https://billing.stripe.test/session")

    monkeypatch.setattr(billing.stripe.billing_portal.Session, "create", fake_create)

    registered = client.post(
        "/api/v1/billing/portal-sessions",
        json={"customer_id": sample_data.customer.id, "return_url": "http://localhost:5173/account"},
    )
    explicit = client.post(
        "/api/v1/billing/portal-sessions",
        json={"stripe_customer_id": "cus_explicit"},
    )
    invalid = client.post("/api/v1/billing/portal-sessions", json={})
    missing = client.post("/api/v1/billing/portal-sessions", json={"customer_id": 999999})

    assert registered.status_code == 200
    assert registered.json()["url"] == "https://billing.stripe.test/session"
    assert captured["customer"] == "cus_explicit"
    assert explicit.status_code == 200
    assert invalid.status_code == 422
    assert missing.status_code == 404


def test_checkout_requires_customer_or_guest(client, sample_data):
    response = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "items": [{"product_id": sample_data.product.id, "quantity": 1}],
        },
    )

    assert response.status_code == 422


def test_insufficient_stock_fails_cleanly(client, sample_data, monkeypatch):
    patch_stripe(monkeypatch)

    response = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "guest": {"name": "Guest Buyer", "email": "stock@example.com"},
            "items": [{"product_id": sample_data.product.id, "quantity": 99}],
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


def test_checkout_completed_webhook_is_idempotent(client, sample_data, monkeypatch):
    patch_stripe(monkeypatch)
    created = client.post(
        "/api/v1/billing/checkout-sessions",
        json={
            "mode": "payment",
            "guest": {"name": "Guest Buyer", "email": "idem@example.com"},
            "items": [{"product_id": sample_data.product.id, "quantity": 1}],
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
