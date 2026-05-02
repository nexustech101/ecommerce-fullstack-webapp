from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

import stripe
from fastapi import HTTPException

from app.core.config import settings
from app.models import (
    BillingCheckoutSession,
    Customer,
    CustomerSubscription,
    Order,
    OrderItem,
    OrderPayment,
    Product,
    StripeCustomer,
    SubscriptionPlan,
)
from app.schemas import CreateCheckoutSession, PortalSessionCreate
from app.services.common import require_model, utc_now

stripe.api_key = settings.stripe_secret_key
stripe.api_version = settings.stripe_api_version


def require_stripe_enabled() -> None:
    if not settings.stripe_enabled or not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Stripe billing is not configured")


def money_to_cents(amount: float) -> int:
    return int(round(amount * 100))


def epoch_to_iso(value: int | None) -> str | None:
    if value is None:
        return None
    return datetime.fromtimestamp(value, timezone.utc).isoformat()


def find_one(model_cls, **filters):
    rows = model_cls.objects.filter(**filters)
    return rows[0] if rows else None


def get_or_create_stripe_customer(payload: CreateCheckoutSession) -> tuple[str, int | None, str | None, str | None]:
    now = utc_now()
    if payload.customer_id is not None:
        customer = require_model(Customer, payload.customer_id)
        existing = find_one(StripeCustomer, customer_id=customer.id)
        if existing is not None:
            return existing.stripe_customer_id, customer.id, None, None

        stripe_customer = stripe.Customer.create(
            name=customer.name,
            email=customer.email,
            metadata={"customer_id": str(customer.id)},
        )
        StripeCustomer.objects.create(
            customer_id=customer.id,
            guest_name=None,
            guest_email=None,
            stripe_customer_id=stripe_customer.id,
            created_at=now,
            updated_at=now,
        )
        return stripe_customer.id, customer.id, None, None

    assert payload.guest is not None
    existing = find_one(StripeCustomer, guest_email=payload.guest.email)
    if existing is not None:
        return existing.stripe_customer_id, None, existing.guest_name, existing.guest_email

    stripe_customer = stripe.Customer.create(
        name=payload.guest.name,
        email=payload.guest.email,
        metadata={"guest": "true"},
    )
    StripeCustomer.objects.create(
        customer_id=None,
        guest_name=payload.guest.name,
        guest_email=payload.guest.email,
        stripe_customer_id=stripe_customer.id,
        created_at=now,
        updated_at=now,
    )
    return stripe_customer.id, None, payload.guest.name, payload.guest.email


def build_payment_line_items(payload: CreateCheckoutSession) -> tuple[list[dict[str, Any]], list[dict[str, Any]], float]:
    assert payload.items is not None
    line_items: list[dict[str, Any]] = []
    cart_snapshot: list[dict[str, Any]] = []
    total = 0.0

    for item in payload.items:
        product = require_model(Product, item.product_id)
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Insufficient stock for product {product.id}",
            )

        unit_amount = money_to_cents(product.price)
        line_items.append(
            {
                "price_data": {
                    "currency": settings.stripe_currency,
                    "unit_amount": unit_amount,
                    "product_data": {
                        "name": product.name,
                        "description": product.description,
                        "metadata": {"product_id": str(product.id)},
                    },
                },
                "quantity": item.quantity,
            }
        )
        cart_snapshot.append(
            {
                "product_id": product.id,
                "name": product.name,
                "quantity": item.quantity,
                "unit_price": product.price,
                "unit_amount": unit_amount,
            }
        )
        total += product.price * item.quantity

    return line_items, cart_snapshot, round(total, 2)


def build_subscription_line_items(payload: CreateCheckoutSession) -> tuple[list[dict[str, Any]], SubscriptionPlan]:
    plan = require_model(SubscriptionPlan, payload.plan_id)
    if not plan.active:
        raise HTTPException(status_code=400, detail="Subscription plan is inactive")
    return [{"price": plan.stripe_price_id, "quantity": 1}], plan


def create_checkout_session(payload: CreateCheckoutSession) -> BillingCheckoutSession:
    require_stripe_enabled()
    stripe_customer_id, customer_id, guest_name, guest_email = get_or_create_stripe_customer(payload)

    if payload.mode == "payment":
        line_items, cart_snapshot, _total = build_payment_line_items(payload)
        metadata = {"checkout_mode": "payment"}
    else:
        line_items, plan = build_subscription_line_items(payload)
        cart_snapshot = [{"plan_id": plan.id, "stripe_price_id": plan.stripe_price_id, "name": plan.name}]
        metadata = {"checkout_mode": "subscription", "plan_id": str(plan.id)}

    session = stripe.checkout.Session.create(
        customer=stripe_customer_id,
        line_items=line_items,
        mode=payload.mode,
        ui_mode="embedded",
        return_url=settings.stripe_return_url,
        metadata=metadata,
    )

    now = utc_now()
    return BillingCheckoutSession.objects.create(
        stripe_session_id=session.id,
        client_secret=session.client_secret,
        mode=payload.mode,
        status=session.status or "open",
        payment_status=getattr(session, "payment_status", None),
        customer_id=customer_id,
        stripe_customer_id=stripe_customer_id,
        guest_name=guest_name,
        guest_email=guest_email,
        cart_snapshot=json.dumps(cart_snapshot),
        order_id=None,
        subscription_id=getattr(session, "subscription", None),
        created_at=now,
        updated_at=now,
    )


def create_portal_session(payload: PortalSessionCreate) -> str:
    require_stripe_enabled()
    stripe_customer_id = payload.stripe_customer_id
    if payload.customer_id is not None:
        customer = find_one(StripeCustomer, customer_id=payload.customer_id)
        if customer is None:
            raise HTTPException(status_code=404, detail="Stripe customer not found")
        stripe_customer_id = customer.stripe_customer_id

    portal_session = stripe.billing_portal.Session.create(
        customer=stripe_customer_id,
        return_url=payload.return_url or settings.stripe_portal_return_url,
    )
    return portal_session.url


def mark_checkout_session(session: dict[str, Any], status: str) -> None:
    local_session = find_one(BillingCheckoutSession, stripe_session_id=session["id"])
    if local_session is None:
        return
    local_session.status = status
    local_session.payment_status = session.get("payment_status")
    local_session.updated_at = utc_now()
    local_session.save()


def fulfill_payment_checkout(session: dict[str, Any]) -> None:
    local_session = find_one(BillingCheckoutSession, stripe_session_id=session["id"])
    if local_session is None or local_session.order_id is not None:
        return

    cart = json.loads(local_session.cart_snapshot)
    now = utc_now()
    total = round(sum(item["unit_price"] * item["quantity"] for item in cart), 2)
    order = Order.objects.create(
        customer_id=local_session.customer_id,
        address_id=None,
        payment_method_id=None,
        total_amount=total,
        created_at=now,
        updated_at=now,
    )

    for item in cart:
        product = require_model(Product, item["product_id"])
        OrderItem.objects.create(
            order_id=order.id,
            product_id=product.id,
            quantity=item["quantity"],
            price=item["unit_price"],
            created_at=now,
            updated_at=now,
        )
        Product.objects.update_where(
            {"id": product.id},
            stock=max(product.stock - item["quantity"], 0),
        )

    OrderPayment.objects.create(
        order_id=order.id,
        payment_method_id=None,
        amount=total,
        created_at=now,
        updated_at=now,
    )
    local_session.order_id = order.id
    local_session.status = session.get("status", "complete")
    local_session.payment_status = session.get("payment_status")
    local_session.updated_at = now
    local_session.save()


def upsert_subscription(subscription: dict[str, Any], *, customer_id: int | None = None) -> CustomerSubscription:
    now = utc_now()
    existing = find_one(CustomerSubscription, stripe_subscription_id=subscription["id"])
    if existing is None:
        return CustomerSubscription.objects.create(
            stripe_subscription_id=subscription["id"],
            stripe_customer_id=subscription["customer"],
            customer_id=customer_id,
            status=subscription["status"],
            current_period_start=epoch_to_iso(subscription.get("current_period_start")),
            current_period_end=epoch_to_iso(subscription.get("current_period_end")),
            cancel_at_period_end=bool(subscription.get("cancel_at_period_end", False)),
            canceled_at=epoch_to_iso(subscription.get("canceled_at")),
            created_at=now,
            updated_at=now,
        )

    existing.status = subscription["status"]
    existing.current_period_start = epoch_to_iso(subscription.get("current_period_start"))
    existing.current_period_end = epoch_to_iso(subscription.get("current_period_end"))
    existing.cancel_at_period_end = bool(subscription.get("cancel_at_period_end", False))
    existing.canceled_at = epoch_to_iso(subscription.get("canceled_at"))
    existing.updated_at = now
    existing.save()
    return existing


def fulfill_subscription_checkout(session: dict[str, Any]) -> None:
    local_session = find_one(BillingCheckoutSession, stripe_session_id=session["id"])
    if local_session is None:
        return
    subscription_id = session.get("subscription")
    if not subscription_id:
        return

    subscription = stripe.Subscription.retrieve(subscription_id)
    local_subscription = upsert_subscription(subscription, customer_id=local_session.customer_id)
    local_session.status = session.get("status", "complete")
    local_session.payment_status = session.get("payment_status")
    local_session.subscription_id = local_subscription.stripe_subscription_id
    local_session.updated_at = utc_now()
    local_session.save()


def handle_checkout_completed(session: dict[str, Any]) -> None:
    if session.get("mode") == "subscription":
        fulfill_subscription_checkout(session)
    else:
        fulfill_payment_checkout(session)


def handle_stripe_event(event: dict[str, Any]) -> None:
    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        handle_checkout_completed(obj)
    elif event_type in {"checkout.session.async_payment_failed", "checkout.session.expired"}:
        mark_checkout_session(obj, obj.get("status", "failed"))
    elif event_type in {
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    }:
        upsert_subscription(obj)
