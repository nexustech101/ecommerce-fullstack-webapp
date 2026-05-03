from __future__ import annotations

import stripe
from fastapi import APIRouter, HTTPException, Request

from app.core.config import settings
from app.models import BillingCheckoutSession, CustomerSubscription, SubscriptionPlan
from app.schemas import (
    BillingConfigOut,
    CheckoutSessionCreateOut,
    CheckoutSessionStatusOut,
    CreateCheckoutSession,
    CustomerSubscriptionOut,
    PortalSessionCreate,
    PortalSessionOut,
    SubscriptionPlanOut,
)
from app.services.billing import (
    create_checkout_session,
    create_portal_session,
    find_one,
    handle_stripe_event,
    reconcile_checkout_session,
)

router = APIRouter(prefix="/billing")


@router.get("/config", response_model=BillingConfigOut)
def billing_config():
    return BillingConfigOut(
        publishable_key=settings.stripe_publishable_key or "",
        embedded_checkout_enabled=True,
    )


@router.post("/checkout-sessions", response_model=CheckoutSessionCreateOut, status_code=201)
def create_billing_checkout_session(payload: CreateCheckoutSession):
    try:
        session = create_checkout_session(payload)
    except stripe.error.AuthenticationError as exc:
        raise HTTPException(
            status_code=503,
            detail="Stripe authentication failed. Check STRIPE_SECRET_KEY.",
        ) from exc
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=502, detail="Stripe checkout request failed") from exc
    return CheckoutSessionCreateOut(
        session_id=session.stripe_session_id,
        client_secret=session.client_secret,
    )


@router.get("/checkout-sessions/{session_id}", response_model=CheckoutSessionStatusOut)
def get_checkout_session(session_id: str):
    session = reconcile_checkout_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Checkout session not found")
    return CheckoutSessionStatusOut(
        session_id=session.stripe_session_id,
        status=session.status,
        payment_status=session.payment_status,
        mode=session.mode,
        order_id=session.order_id,
        subscription_id=session.subscription_id,
    )


@router.post("/portal-sessions", response_model=PortalSessionOut)
def create_billing_portal_session(payload: PortalSessionCreate):
    try:
        return PortalSessionOut(url=create_portal_session(payload))
    except stripe.error.AuthenticationError as exc:
        raise HTTPException(
            status_code=503,
            detail="Stripe authentication failed. Check STRIPE_SECRET_KEY.",
        ) from exc
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=502, detail="Stripe portal request failed") from exc


@router.get("/subscription-plans", response_model=list[SubscriptionPlanOut])
def list_subscription_plans():
    rows = SubscriptionPlan.objects.filter(active=True, order_by="-id")
    return [SubscriptionPlanOut(**row.model_dump()) for row in rows]


@router.get(
    "/customers/{customer_id}/subscriptions",
    response_model=list[CustomerSubscriptionOut],
)
def list_customer_subscriptions(customer_id: int):
    rows = CustomerSubscription.objects.filter(customer_id=customer_id, order_by="-id")
    return [CustomerSubscriptionOut(**row.model_dump()) for row in rows]


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Stripe webhook secret is not configured")
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=settings.stripe_webhook_secret,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature") from exc

    handle_stripe_event(event)
    return {"received": True}
