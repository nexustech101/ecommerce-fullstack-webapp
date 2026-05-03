from __future__ import annotations

import os
import sys
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB_PATH = PROJECT_ROOT / ".test-data" / "pytest-ecommerce.db"
TEST_DB_PATH.parent.mkdir(exist_ok=True)

os.environ["CUSTOMER_DATABASE"] = str(TEST_DB_PATH)
os.environ["STRIPE_ENABLED"] = "true"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_example"
os.environ["STRIPE_PUBLISHABLE_KEY"] = "pk_test_example"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_example"
os.environ["PAYPAL_ENABLED"] = "true"
os.environ["PAYPAL_CLIENT_ID"] = "paypal_client_test"
os.environ["PAYPAL_CLIENT_SECRET"] = "paypal_secret_test"
os.environ["PAYPAL_WEBHOOK_ID"] = "paypal_webhook_test"

from app.main import app
from app.models import (
    Address,
    BillingCheckoutSession,
    Category,
    Customer,
    CustomerSubscription,
    Order,
    OrderItem,
    OrderPayment,
    PayPalOrder,
    PaymentMethod,
    Product,
    ProductCategory,
    ProductTag,
    Review,
    StripeCustomer,
    SubscriptionPlan,
    Tag,
)
from app.services.common import utc_now


DEPENDENT_MODELS = (
    CustomerSubscription,
    PayPalOrder,
    BillingCheckoutSession,
    OrderPayment,
    OrderItem,
    Order,
    Review,
    ProductTag,
    ProductCategory,
    PaymentMethod,
    Address,
    StripeCustomer,
    SubscriptionPlan,
    Tag,
    Category,
    Product,
    Customer,
)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clean_database():
    for model in DEPENDENT_MODELS:
        model.truncate()
    yield
    for model in DEPENDENT_MODELS:
        model.truncate()


@pytest.fixture()
def sample_data():
    now = utc_now()
    suffix = uuid4().hex
    customer = Customer.objects.create(
        name="Ada Buyer",
        email=f"ada-{suffix}@example.com",
        passwd_hash="hashed",
        created_at=now,
        updated_at=now,
    )
    address = Address.objects.create(
        customer_id=customer.id,
        street="100 Main St",
        city="Baltimore",
        state="MD",
        country="US",
        zip_code="21201",
        is_default=True,
        created_at=now,
        updated_at=now,
    )
    payment_method = PaymentMethod.objects.create(
        customer_id=customer.id,
        method_name="Test Card",
        details="pm_test",
        created_at=now,
        updated_at=now,
    )
    product = Product.objects.create(
        name=f"Canvas Tote {suffix}",
        description="Heavy cotton tote",
        price=18.5,
        stock=8,
        created_at=now,
        updated_at=now,
    )
    category = Category.objects.create(
        name=f"Bags {suffix}",
        parent_category_id=None,
        created_at=now,
        updated_at=now,
    )
    tag = Tag.objects.create(
        name=f"cotton-{suffix}",
        created_at=now,
        updated_at=now,
    )
    plan = SubscriptionPlan.objects.create(
        name="Monthly Essentials",
        description="Recurring essentials box",
        stripe_price_id=f"price_{suffix}",
        active=True,
        created_at=now,
        updated_at=now,
    )
    return SimpleNamespace(
        customer=customer,
        address=address,
        payment_method=payment_method,
        product=product,
        category=category,
        tag=tag,
        plan=plan,
    )
