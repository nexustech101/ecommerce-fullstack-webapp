from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Request

from app.models import PayPalOrder
from app.schemas import (
    CreatePayPalOrder,
    PayPalCaptureOut,
    PayPalOrderCreateOut,
    PayPalOrderStatusOut,
)
from app.services.paypal import (
    capture_paypal_order,
    create_paypal_order,
    find_one,
    handle_paypal_event,
    verify_paypal_webhook,
)

router = APIRouter(prefix="/payments/paypal")


def to_paypal_status_out(order: PayPalOrder) -> PayPalOrderStatusOut:
    return PayPalOrderStatusOut(
        paypal_order_id=order.paypal_order_id,
        status=order.status,
        amount=order.amount,
        currency=order.currency,
        order_id=order.order_id,
        capture_id=order.capture_id,
        approval_url=order.approval_url,
    )


@router.post("/orders", response_model=PayPalOrderCreateOut, status_code=201)
def create_order(payload: CreatePayPalOrder):
    order = create_paypal_order(payload)
    return PayPalOrderCreateOut(
        paypal_order_id=order.paypal_order_id,
        status=order.status,
        approval_url=order.approval_url,
    )


@router.get("/orders/{paypal_order_id}", response_model=PayPalOrderStatusOut)
def get_order(paypal_order_id: str):
    order = find_one(PayPalOrder, paypal_order_id=paypal_order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="PayPal order not found")
    return to_paypal_status_out(order)


@router.post("/orders/{paypal_order_id}/capture", response_model=PayPalCaptureOut)
def capture_order(paypal_order_id: str):
    order = capture_paypal_order(paypal_order_id)
    return PayPalCaptureOut(
        paypal_order_id=order.paypal_order_id,
        status=order.status,
        order_id=order.order_id,
        capture_id=order.capture_id,
    )


@router.post("/webhooks")
async def paypal_webhook(request: Request):
    raw_body = await request.body()
    try:
        event = json.loads(raw_body.decode("utf-8"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid PayPal webhook payload") from exc

    headers = {key.lower(): value for key, value in request.headers.items()}
    if not verify_paypal_webhook(headers, event):
        raise HTTPException(status_code=400, detail="Invalid PayPal webhook signature")

    handle_paypal_event(event)
    return {"received": True}
