from __future__ import annotations


def patch_paypal(monkeypatch):
    from app.services import paypal

    calls: list[tuple[str, str, dict | None]] = []

    def fake_paypal_request(method, path, *, json_payload=None, request_id=None):
        calls.append((method, path, json_payload))
        if path == "/v2/checkout/orders":
            return {
                "id": "PAYPAL-ORDER-1",
                "status": "CREATED",
                "links": [
                    {
                        "rel": "approve",
                        "href": "https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-1",
                    }
                ],
            }
        if path == "/v2/checkout/orders/PAYPAL-ORDER-1/capture":
            return {
                "id": "PAYPAL-ORDER-1",
                "status": "COMPLETED",
                "payer": {"payer_id": "PAYER-1"},
                "purchase_units": [
                    {
                        "payments": {
                            "captures": [
                                {
                                    "id": "CAPTURE-1",
                                    "status": "COMPLETED",
                                }
                            ]
                        }
                    }
                ],
            }
        if path == "/v1/notifications/verify-webhook-signature":
            return {"verification_status": "SUCCESS"}
        raise AssertionError(f"Unexpected PayPal request {method} {path}")

    monkeypatch.setattr(paypal, "paypal_request", fake_paypal_request)
    return calls


def test_guest_paypal_order_creation_returns_approval_url(client, sample_data, monkeypatch):
    calls = patch_paypal(monkeypatch)

    response = client.post(
        "/api/v1/payments/paypal/orders",
        json={
            "guest": {"name": "Guest Buyer", "email": "guest-paypal@example.com"},
            "items": [{"product_id": sample_data.product.id, "quantity": 2}],
        },
    )

    assert response.status_code == 201
    assert response.json() == {
        "paypal_order_id": "PAYPAL-ORDER-1",
        "status": "CREATED",
        "approval_url": "https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-1",
    }
    assert calls[0][0] == "POST"
    assert calls[0][1] == "/v2/checkout/orders"
    assert calls[0][2]["intent"] == "CAPTURE"
    assert calls[0][2]["purchase_units"][0]["amount"]["value"] == "37.00"


def test_registered_customer_paypal_order_creation(client, sample_data, monkeypatch):
    patch_paypal(monkeypatch)

    response = client.post(
        "/api/v1/payments/paypal/orders",
        json={
            "customer_id": sample_data.customer.id,
            "items": [{"product_id": sample_data.product.id, "quantity": 1}],
        },
    )

    assert response.status_code == 201
    assert response.json()["paypal_order_id"] == "PAYPAL-ORDER-1"


def test_paypal_order_requires_identity(client, sample_data):
    response = client.post(
        "/api/v1/payments/paypal/orders",
        json={"items": [{"product_id": sample_data.product.id, "quantity": 1}]},
    )

    assert response.status_code == 422


def test_paypal_order_rejects_invalid_quantity_and_insufficient_stock(client, sample_data, monkeypatch):
    patch_paypal(monkeypatch)

    zero = client.post(
        "/api/v1/payments/paypal/orders",
        json={
            "guest": {"name": "Guest Buyer", "email": "zero-paypal@example.com"},
            "items": [{"product_id": sample_data.product.id, "quantity": 0}],
        },
    )
    insufficient = client.post(
        "/api/v1/payments/paypal/orders",
        json={
            "guest": {"name": "Guest Buyer", "email": "stock-paypal@example.com"},
            "items": [{"product_id": sample_data.product.id, "quantity": 99}],
        },
    )

    assert zero.status_code == 422
    assert insufficient.status_code == 409


def test_paypal_capture_creates_local_order_idempotently(client, sample_data, monkeypatch):
    from app.models import Order, Product

    patch_paypal(monkeypatch)
    created = client.post(
        "/api/v1/payments/paypal/orders",
        json={
            "guest": {"name": "Guest Buyer", "email": "capture-paypal@example.com"},
            "items": [{"product_id": sample_data.product.id, "quantity": 2}],
        },
    )
    assert created.status_code == 201

    first = client.post("/api/v1/payments/paypal/orders/PAYPAL-ORDER-1/capture")
    second = client.post("/api/v1/payments/paypal/orders/PAYPAL-ORDER-1/capture")
    status = client.get("/api/v1/payments/paypal/orders/PAYPAL-ORDER-1")
    product = Product.objects.require(sample_data.product.id)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["status"] == "COMPLETED"
    assert first.json()["order_id"] == second.json()["order_id"]
    assert status.json()["capture_id"] == "CAPTURE-1"
    assert Order.objects.count() == 1
    assert product.stock == sample_data.product.stock - 2


def test_paypal_disabled_or_placeholder_credentials_return_503(client, sample_data, monkeypatch):
    from app.services import paypal

    monkeypatch.setattr(paypal.settings, "paypal_enabled", True)
    monkeypatch.setattr(paypal.settings, "paypal_client_id", "paypal_replace_me")

    response = client.post(
        "/api/v1/payments/paypal/orders",
        json={
            "guest": {"name": "Guest Buyer", "email": "disabled-paypal@example.com"},
            "items": [{"product_id": sample_data.product.id, "quantity": 1}],
        },
    )

    assert response.status_code == 503
    assert "PayPal credentials are not configured" in response.json()["detail"]


def test_paypal_webhook_invalid_signature_returns_400(client, monkeypatch):
    from app.api.v1.routes import paypal as paypal_route

    monkeypatch.setattr(paypal_route, "verify_paypal_webhook", lambda _headers, _event: False)

    response = client.post(
        "/api/v1/payments/paypal/webhooks",
        json={"event_type": "PAYMENT.CAPTURE.COMPLETED", "resource": {}},
    )

    assert response.status_code == 400


def test_paypal_webhook_completed_capture_fulfills_once(client, sample_data, monkeypatch):
    from app.models import Order

    patch_paypal(monkeypatch)
    created = client.post(
        "/api/v1/payments/paypal/orders",
        json={
            "guest": {"name": "Guest Buyer", "email": "webhook-paypal@example.com"},
            "items": [{"product_id": sample_data.product.id, "quantity": 1}],
        },
    )
    assert created.status_code == 201

    event = {
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "resource": {
            "id": "CAPTURE-WEBHOOK-1",
            "status": "COMPLETED",
            "supplementary_data": {"related_ids": {"order_id": "PAYPAL-ORDER-1"}},
        },
    }

    first = client.post("/api/v1/payments/paypal/webhooks", json=event)
    second = client.post("/api/v1/payments/paypal/webhooks", json=event)

    assert first.status_code == 200
    assert second.status_code == 200
    assert Order.objects.count() == 1
