from __future__ import annotations

from uuid import uuid4

import pytest

from app.models import (
    Address,
    Customer,
    Order,
    OrderItem,
    OrderPayment,
    PaymentMethod,
    Product,
    ProductCategory,
    ProductTag,
    Review,
)
from app.services.common import utc_now


def test_health_route(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_customer_crud_and_validation_edges(client):
    suffix = uuid4().hex
    payload = {
        "name": "Grace Hopper",
        "email": f"grace-{suffix}@example.com",
        "password": "correct-horse",
    }

    created = client.post("/api/v1/customers", json=payload)
    duplicate = client.post("/api/v1/customers", json=payload)
    weak_password = client.post(
        "/api/v1/customers",
        json={"name": "Weak", "email": f"weak-{suffix}@example.com", "password": "short"},
    )
    customer_id = created.json()["id"]
    listed = client.get("/api/v1/customers", params={"limit": 1, "offset": 0})
    invalid_list = client.get("/api/v1/customers", params={"limit": 0})
    fetched = client.get(f"/api/v1/customers/{customer_id}")
    patched = client.patch(f"/api/v1/customers/{customer_id}", json={"name": "Rear Admiral Hopper"})
    missing_patch = client.patch("/api/v1/customers/999999", json={"name": "Nobody"})
    deleted = client.delete(f"/api/v1/customers/{customer_id}")
    missing_after_delete = client.get(f"/api/v1/customers/{customer_id}")

    assert created.status_code == 201
    assert "password" not in created.json()
    assert duplicate.status_code == 409
    assert weak_password.status_code == 422
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert invalid_list.status_code == 422
    assert fetched.status_code == 200
    assert patched.status_code == 200
    assert patched.json()["name"] == "Rear Admiral Hopper"
    assert missing_patch.status_code == 404
    assert deleted.status_code == 200
    assert deleted.json() == {"ok": True}
    assert missing_after_delete.status_code == 404


def test_address_routes_default_toggle_and_ownership_validation(client, sample_data):
    customer_id = sample_data.customer.id
    first = sample_data.address

    created = client.post(
        "/api/v1/addresses",
        json={
            "customer_id": customer_id,
            "street": "200 Market St",
            "city": "Baltimore",
            "state": "MD",
            "country": "US",
            "zip_code": "21202",
            "is_default": True,
        },
    )
    first = Address.objects.require(first.id)
    listed = client.get(f"/api/v1/customers/{customer_id}/addresses")
    patched = client.patch(
        f"/api/v1/addresses/{created.json()['id']}",
        json={"city": "Annapolis", "is_default": False},
    )
    missing_customer = client.post(
        "/api/v1/addresses",
        json={
            "customer_id": 999999,
            "street": "404 Missing",
            "city": "Nowhere",
            "state": "NA",
            "country": "US",
            "zip_code": "00000",
        },
    )
    missing_list = client.get("/api/v1/customers/999999/addresses")

    assert created.status_code == 201
    assert first.is_default is False
    assert listed.status_code == 200
    assert len(listed.json()) == 2
    assert patched.status_code == 200
    assert patched.json()["city"] == "Annapolis"
    assert missing_customer.status_code == 404
    assert missing_list.status_code == 404


def test_payment_method_routes_and_missing_customer(client, sample_data):
    created = client.post(
        "/api/v1/payment-methods",
        json={"customer_id": sample_data.customer.id, "method_name": "Saved Token", "details": "pm_mock"},
    )
    listed = client.get(f"/api/v1/customers/{sample_data.customer.id}/payment-methods")
    missing_create = client.post(
        "/api/v1/payment-methods",
        json={"customer_id": 999999, "method_name": "Bad", "details": "pm_bad"},
    )
    missing_list = client.get("/api/v1/customers/999999/payment-methods")

    assert created.status_code == 201
    assert listed.status_code == 200
    assert len(listed.json()) == 2
    assert missing_create.status_code == 404
    assert missing_list.status_code == 404


def test_product_routes_filtering_update_and_validation(client, sample_data):
    created = client.post(
        "/api/v1/products",
        json={
            "name": "Copper Mug",
            "description": "Polished",
            "image_url": "https://example.com/copper-mug.jpg",
            "price": 32.25,
            "stock": 3,
        },
    )
    product_id = created.json()["id"]
    fetched = client.get(f"/api/v1/products/{product_id}")
    search = client.get("/api/v1/products", params={"search": "Copper", "min_price": 30, "max_price": 40})
    patched = client.patch(f"/api/v1/products/{product_id}", json={"stock": 7, "price": 35.0})
    invalid_price = client.post(
        "/api/v1/products",
        json={"name": "Bad", "description": "", "price": -1, "stock": 1},
    )
    invalid_range = client.get("/api/v1/products", params={"min_price": -1})
    missing = client.get("/api/v1/products/999999")

    assert created.status_code == 201
    assert created.json()["image_url"] == "https://example.com/copper-mug.jpg"
    assert fetched.status_code == 200
    assert search.status_code == 200
    assert [row["id"] for row in search.json()] == [product_id]
    assert patched.status_code == 200
    assert patched.json()["stock"] == 7
    assert invalid_price.status_code == 422
    assert invalid_range.status_code == 422
    assert missing.status_code == 404


def test_auth_signup_signin_and_invalid_credentials(client):
    suffix = uuid4().hex
    payload = {
        "name": "Optional Buyer",
        "email": f"optional-{suffix}@example.com",
        "password": "correct-horse",
    }

    signup = client.post("/api/v1/auth/signup", json=payload)
    signin = client.post(
        "/api/v1/auth/signin",
        json={"email": payload["email"], "password": payload["password"]},
    )
    bad_password = client.post(
        "/api/v1/auth/signin",
        json={"email": payload["email"], "password": "wrong"},
    )
    missing_user = client.post(
        "/api/v1/auth/signin",
        json={"email": f"missing-{suffix}@example.com", "password": payload["password"]},
    )

    assert signup.status_code == 201
    assert signup.json()["customer"]["email"] == payload["email"]
    assert signin.status_code == 200
    assert signin.json()["customer"]["id"] == signup.json()["customer"]["id"]
    assert bad_password.status_code == 401
    assert missing_user.status_code == 401


def test_category_tag_links_and_review_routes(client, sample_data):
    parent = client.post("/api/v1/categories", json={"name": f"Parent {uuid4().hex}"})
    child = client.post(
        "/api/v1/categories",
        json={"name": f"Child {uuid4().hex}", "parent_category_id": parent.json()["id"]},
    )
    bad_child = client.post("/api/v1/categories", json={"name": "Bad Child", "parent_category_id": 999999})
    categories = client.get("/api/v1/categories")

    tag = client.post("/api/v1/tags", json={"name": f"featured-{uuid4().hex}"})
    duplicate_tag = client.post("/api/v1/tags", json={"name": tag.json()["name"]})
    tags = client.get("/api/v1/tags")

    attach_category = client.post(f"/api/v1/products/{sample_data.product.id}/categories/{child.json()['id']}")
    attach_category_again = client.post(f"/api/v1/products/{sample_data.product.id}/categories/{child.json()['id']}")
    attach_tag = client.post(f"/api/v1/products/{sample_data.product.id}/tags/{tag.json()['id']}")
    attach_missing_tag = client.post(f"/api/v1/products/{sample_data.product.id}/tags/999999")

    review = client.post(
        "/api/v1/reviews",
        json={
            "product_id": sample_data.product.id,
            "customer_id": sample_data.customer.id,
            "rating": 5,
            "comment": "Excellent",
        },
    )
    invalid_review = client.post(
        "/api/v1/reviews",
        json={
            "product_id": sample_data.product.id,
            "customer_id": sample_data.customer.id,
            "rating": 9,
            "comment": "Impossible",
        },
    )
    reviews = client.get(f"/api/v1/products/{sample_data.product.id}/reviews")
    missing_reviews = client.get("/api/v1/products/999999/reviews")

    assert parent.status_code == 201
    assert child.status_code == 201
    assert bad_child.status_code == 404
    assert categories.status_code == 200
    assert tag.status_code == 201
    assert duplicate_tag.status_code == 409
    assert tags.status_code == 200
    assert attach_category.status_code == 200
    assert attach_category_again.json()["message"] == "Already attached"
    assert attach_tag.status_code == 200
    assert attach_missing_tag.status_code == 404
    assert review.status_code == 201
    assert invalid_review.status_code == 422
    assert reviews.status_code == 200
    assert len(reviews.json()) == 1
    assert missing_reviews.status_code == 404


def test_order_checkout_routes_and_compensation_edges(client, sample_data):
    checkout = client.post(
        "/api/v1/orders/checkout",
        json={
            "customer_id": sample_data.customer.id,
            "address_id": sample_data.address.id,
            "payment_method_id": sample_data.payment_method.id,
            "items": [{"product_id": sample_data.product.id, "quantity": 2}],
        },
    )
    order_id = checkout.json()["id"]
    product = Product.objects.require(sample_data.product.id)
    detail = client.get(f"/api/v1/orders/{order_id}")
    listed = client.get("/api/v1/orders", params={"customer_id": sample_data.customer.id})
    invalid_list = client.get("/api/v1/orders", params={"limit": 0})
    insufficient = client.post(
        "/api/v1/orders/checkout",
        json={
            "customer_id": sample_data.customer.id,
            "address_id": sample_data.address.id,
            "payment_method_id": sample_data.payment_method.id,
            "items": [{"product_id": sample_data.product.id, "quantity": 99}],
        },
    )

    now = utc_now()
    other = Customer.objects.create(
        name="Other",
        email=f"other-{uuid4().hex}@example.com",
        passwd_hash="hash",
        created_at=now,
        updated_at=now,
    )
    wrong_address = Address.objects.create(
        customer_id=other.id,
        street="1 Wrong Way",
        city="Elsewhere",
        state="CA",
        country="US",
        zip_code="90001",
        is_default=False,
        created_at=now,
        updated_at=now,
    )
    wrong_owner = client.post(
        "/api/v1/orders/checkout",
        json={
            "customer_id": sample_data.customer.id,
            "address_id": wrong_address.id,
            "payment_method_id": sample_data.payment_method.id,
            "items": [{"product_id": sample_data.product.id, "quantity": 1}],
        },
    )
    missing_order = client.get("/api/v1/orders/999999")

    assert checkout.status_code == 201
    assert checkout.json()["total_amount"] == 37.0
    assert product.stock == 6
    assert detail.status_code == 200
    assert len(detail.json()["items"]) == 1
    assert len(detail.json()["payments"]) == 1
    assert listed.status_code == 200
    assert listed.json()[0]["id"] == order_id
    assert invalid_list.status_code == 422
    assert insufficient.status_code == 409
    assert wrong_owner.status_code == 400
    assert missing_order.status_code == 404


def test_admin_schema_routes_truncate_in_dependency_order(client, sample_data):
    status = client.get("/api/v1/admin/schema/status")
    created = client.post("/api/v1/admin/schema/create")
    truncated = client.post("/api/v1/admin/schema/truncate")

    assert status.status_code == 200
    assert status.json()["Customer"] is True
    assert created.status_code == 200
    assert truncated.status_code == 200
    assert Customer.objects.count() == 0
    assert Product.objects.count() == 0


def test_admin_sample_catalog_seed_is_idempotent_and_adds_images(client):
    first = client.post("/api/v1/admin/seed/sample-catalog")
    second = client.post("/api/v1/admin/seed/sample-catalog")
    products = client.get("/api/v1/products", params={"limit": 20})

    assert first.status_code == 200
    assert first.json()["products"]["created"] >= 8
    assert second.status_code == 200
    assert second.json()["products"]["created"] == 0
    assert second.json()["products"]["updated"] >= 8
    assert products.status_code == 200
    assert all(row["image_url"] for row in products.json())


def test_registers_db_model_query_and_collision_edges(sample_data):
    with pytest.raises(Exception):
        Customer.objects.create(
            name="Duplicate",
            email=sample_data.customer.email,
            passwd_hash="hash",
            created_at=utc_now(),
            updated_at=utc_now(),
        )

    with pytest.raises(Exception):
        Product.objects.filter(id=[sample_data.product.id])

    with pytest.raises(Exception):
        Product.objects.filter(unknown_field="x")

    with pytest.raises(Exception):
        Product.objects.filter(limit=-1)

    rows = Product.objects.filter(id__in=[sample_data.product.id])
    assert rows[0].id == sample_data.product.id


def test_schema_lifecycle_and_registered_model_writes(sample_data):
    assert Customer.schema_exists() is True
    assert Product.schema_exists() is True
    assert Address.objects.exists(customer_id=sample_data.customer.id) is True
    assert PaymentMethod.objects.exists(customer_id=sample_data.customer.id) is True
    assert ProductCategory.objects.count() == 0
    assert ProductTag.objects.count() == 0
    assert Review.objects.count() == 0
    assert Order.objects.count() == 0
    assert OrderItem.objects.count() == 0
    assert OrderPayment.objects.count() == 0
