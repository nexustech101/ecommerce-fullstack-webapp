from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

import httpx
from fastapi import HTTPException

from app.core.config import settings
from app.models import Customer, Order, OrderItem, OrderPayment, PayPalOrder, Product
from app.schemas import CreatePayPalOrder
from app.services.common import require_model, utc_now


def is_placeholder_paypal_secret(value: str | None) -> bool:
    if not value:
        return True
    normalized = value.strip().lower()
    return "replace_me" in normalized or normalized in {"client_id", "client_secret"}


def require_paypal_enabled() -> None:
    if not settings.paypal_enabled:
        raise HTTPException(status_code=503, detail="PayPal checkout is not configured")
    if is_placeholder_paypal_secret(settings.paypal_client_id) or is_placeholder_paypal_secret(
        settings.paypal_client_secret
    ):
        raise HTTPException(
            status_code=503,
            detail="PayPal credentials are not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.",
        )


def paypal_base_url() -> str:
    if settings.paypal_environment.lower() == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


def find_one(model_cls, **filters):
    rows = model_cls.objects.filter(**filters)
    return rows[0] if rows else None


def get_access_token() -> str:
    require_paypal_enabled()
    with httpx.Client(timeout=15) as client:
        response = client.post(
            f"{paypal_base_url()}/v1/oauth2/token",
            auth=(settings.paypal_client_id, settings.paypal_client_secret),
            data={"grant_type": "client_credentials"},
            headers={"Accept": "application/json", "Accept-Language": "en_US"},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="PayPal access token request failed")
    token = response.json().get("access_token")
    if not token:
        raise HTTPException(status_code=502, detail="PayPal access token response was invalid")
    return token


def paypal_request(
    method: str,
    path: str,
    *,
    json_payload: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> dict[str, Any]:
    token = get_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if request_id:
        headers["PayPal-Request-Id"] = request_id

    with httpx.Client(timeout=20) as client:
        response = client.request(
            method,
            f"{paypal_base_url()}{path}",
            headers=headers,
            json=json_payload,
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="PayPal API request failed")
    return response.json() if response.content else {}


def money(value: float) -> str:
    return f"{round(value, 2):.2f}"


def validate_identity(payload: CreatePayPalOrder) -> tuple[int | None, str | None, str | None]:
    if payload.customer_id is not None:
        customer = require_model(Customer, payload.customer_id)
        return customer.id, None, None
    assert payload.guest is not None
    return None, payload.guest.name, str(payload.guest.email)


def build_cart(payload: CreatePayPalOrder) -> tuple[list[dict[str, Any]], list[dict[str, Any]], float]:
    paypal_items: list[dict[str, Any]] = []
    cart_snapshot: list[dict[str, Any]] = []
    total = 0.0
    currency = settings.paypal_currency.upper()

    for item in payload.items:
        product = require_model(Product, item.product_id)
        if product.stock < item.quantity:
            raise HTTPException(status_code=409, detail=f"Insufficient stock for product {product.id}")

        paypal_items.append(
            {
                "name": product.name[:127],
                "description": product.description[:127],
                "quantity": str(item.quantity),
                "unit_amount": {"currency_code": currency, "value": money(product.price)},
                "category": "PHYSICAL_GOODS",
            }
        )
        cart_snapshot.append(
            {
                "product_id": product.id,
                "name": product.name,
                "quantity": item.quantity,
                "unit_price": product.price,
            }
        )
        total += product.price * item.quantity

    return paypal_items, cart_snapshot, round(total, 2)


def approval_url(response: dict[str, Any]) -> str | None:
    for link in response.get("links", []):
        if link.get("rel") == "approve":
            return link.get("href")
    return None


def create_paypal_order(payload: CreatePayPalOrder) -> PayPalOrder:
    require_paypal_enabled()
    customer_id, guest_name, guest_email = validate_identity(payload)
    paypal_items, cart_snapshot, total = build_cart(payload)
    currency = settings.paypal_currency.upper()

    response = paypal_request(
        "POST",
        "/v2/checkout/orders",
        request_id=f"create-{uuid4()}",
        json_payload={
            "intent": "CAPTURE",
            "purchase_units": [
                {
                    "amount": {
                        "currency_code": currency,
                        "value": money(total),
                        "breakdown": {
                            "item_total": {
                                "currency_code": currency,
                                "value": money(total),
                            }
                        },
                    },
                    "items": paypal_items,
                }
            ],
            "application_context": {
                "return_url": settings.paypal_return_url,
                "cancel_url": settings.paypal_cancel_url,
                "shipping_preference": "NO_SHIPPING",
                "user_action": "PAY_NOW",
            },
        },
    )
    paypal_order_id = response.get("id")
    if not paypal_order_id:
        raise HTTPException(status_code=502, detail="PayPal create order response was invalid")

    now = utc_now()
    return PayPalOrder.objects.create(
        paypal_order_id=paypal_order_id,
        status=response.get("status", "CREATED"),
        intent="CAPTURE",
        customer_id=customer_id,
        guest_name=guest_name,
        guest_email=guest_email,
        cart_snapshot=json.dumps(cart_snapshot),
        amount=total,
        currency=currency,
        approval_url=approval_url(response),
        order_id=None,
        capture_id=None,
        payer_id=None,
        raw_response=json.dumps(response),
        created_at=now,
        updated_at=now,
    )


def extract_capture_id(response: dict[str, Any]) -> str | None:
    purchase_units = response.get("purchase_units") or []
    if not purchase_units:
        return None
    captures = ((purchase_units[0].get("payments") or {}).get("captures")) or []
    if not captures:
        return None
    return captures[0].get("id")


def ensure_stock_available(paypal_order: PayPalOrder) -> list[dict[str, Any]]:
    cart = json.loads(paypal_order.cart_snapshot)
    for item in cart:
        product = require_model(Product, item["product_id"])
        if product.stock < item["quantity"]:
            raise HTTPException(status_code=409, detail=f"Insufficient stock for product {product.id}")
    return cart


def fulfill_local_order(
    paypal_order: PayPalOrder,
    *,
    status: str,
    capture_id: str | None,
    payer_id: str | None,
    raw_response: dict[str, Any],
) -> PayPalOrder:
    if paypal_order.order_id is not None:
        paypal_order.status = status
        paypal_order.capture_id = paypal_order.capture_id or capture_id
        paypal_order.payer_id = paypal_order.payer_id or payer_id
        paypal_order.raw_response = json.dumps(raw_response)
        paypal_order.updated_at = utc_now()
        paypal_order.save()
        return paypal_order

    cart = ensure_stock_available(paypal_order)
    now = utc_now()
    created_order: Order | None = None
    product_snapshots: dict[int, Product] = {}
    try:
        created_order = Order.objects.create(
            customer_id=paypal_order.customer_id,
            address_id=None,
            payment_method_id=None,
            total_amount=paypal_order.amount,
            created_at=now,
            updated_at=now,
        )
        for item in cart:
            product = require_model(Product, item["product_id"])
            product_snapshots[product.id] = product
            OrderItem.objects.create(
                order_id=created_order.id,
                product_id=product.id,
                quantity=item["quantity"],
                price=item["unit_price"],
                created_at=now,
                updated_at=now,
            )
            Product.objects.update_where({"id": product.id}, stock=product.stock - item["quantity"])

        OrderPayment.objects.create(
            order_id=created_order.id,
            payment_method_id=None,
            amount=paypal_order.amount,
            created_at=now,
            updated_at=now,
        )
    except Exception as exc:
        if created_order is not None:
            OrderPayment.objects.delete_where(order_id=created_order.id)
            OrderItem.objects.delete_where(order_id=created_order.id)
            Order.objects.delete(created_order.id)
        for product_id, snapshot in product_snapshots.items():
            Product.objects.update_where({"id": product_id}, stock=snapshot.stock)
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    paypal_order.status = status
    paypal_order.capture_id = capture_id
    paypal_order.payer_id = payer_id
    paypal_order.raw_response = json.dumps(raw_response)
    paypal_order.order_id = created_order.id
    paypal_order.updated_at = now
    paypal_order.save()
    return paypal_order


def capture_paypal_order(paypal_order_id: str) -> PayPalOrder:
    local_order = find_one(PayPalOrder, paypal_order_id=paypal_order_id)
    if local_order is None:
        raise HTTPException(status_code=404, detail="PayPal order not found")
    if local_order.order_id is not None:
        return local_order

    ensure_stock_available(local_order)
    response = paypal_request(
        "POST",
        f"/v2/checkout/orders/{paypal_order_id}/capture",
        request_id=f"capture-{paypal_order_id}",
    )
    status = response.get("status", "UNKNOWN")
    capture_id = extract_capture_id(response)
    payer_id = (response.get("payer") or {}).get("payer_id")

    if status == "COMPLETED":
        return fulfill_local_order(
            local_order,
            status=status,
            capture_id=capture_id,
            payer_id=payer_id,
            raw_response=response,
        )

    local_order.status = status
    local_order.capture_id = capture_id
    local_order.payer_id = payer_id
    local_order.raw_response = json.dumps(response)
    local_order.updated_at = utc_now()
    local_order.save()
    return local_order


def verify_paypal_webhook(headers: dict[str, str], event: dict[str, Any]) -> bool:
    if not settings.paypal_webhook_id:
        raise HTTPException(status_code=503, detail="PayPal webhook ID is not configured")
    response = paypal_request(
        "POST",
        "/v1/notifications/verify-webhook-signature",
        json_payload={
            "transmission_id": headers.get("paypal-transmission-id"),
            "transmission_time": headers.get("paypal-transmission-time"),
            "cert_url": headers.get("paypal-cert-url"),
            "auth_algo": headers.get("paypal-auth-algo"),
            "transmission_sig": headers.get("paypal-transmission-sig"),
            "webhook_id": settings.paypal_webhook_id,
            "webhook_event": event,
        },
    )
    return response.get("verification_status") == "SUCCESS"


def handle_paypal_event(event: dict[str, Any]) -> None:
    event_type = event.get("event_type")
    resource = event.get("resource") or {}
    if event_type in {"PAYMENT.CAPTURE.COMPLETED", "CHECKOUT.ORDER.COMPLETED"}:
        related = ((resource.get("supplementary_data") or {}).get("related_ids")) or {}
        paypal_order_id = related.get("order_id") or resource.get("id")
        paypal_order = find_one(PayPalOrder, paypal_order_id=paypal_order_id)
        if paypal_order is None:
            return
        fulfill_local_order(
            paypal_order,
            status="COMPLETED",
            capture_id=resource.get("id"),
            payer_id=None,
            raw_response=event,
        )
    elif event_type in {"PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REFUNDED", "CHECKOUT.ORDER.VOIDED"}:
        related = ((resource.get("supplementary_data") or {}).get("related_ids")) or {}
        paypal_order_id = related.get("order_id") or resource.get("id")
        paypal_order = find_one(PayPalOrder, paypal_order_id=paypal_order_id)
        if paypal_order is None:
            return
        paypal_order.status = resource.get("status", event_type)
        paypal_order.raw_response = json.dumps(event)
        paypal_order.updated_at = utc_now()
        paypal_order.save()
