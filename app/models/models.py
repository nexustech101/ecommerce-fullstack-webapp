from __future__ import annotations

from pydantic import BaseModel
from registers.db import DatabaseRegistry

from app.core.config import settings

db = DatabaseRegistry()

@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="customers",
    key_field="id",
    autoincrement=True,
    unique_fields=["email"],
)
class Customer(BaseModel):
    id: int | None = None
    name: str
    email: str
    passwd_hash: str
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="addresses",
    key_field="id",
    autoincrement=True,
)
class Address(BaseModel):
    id: int | None = None
    customer_id: int | None = None
    street: str
    city: str
    state: str
    country: str
    zip_code: str
    is_default: bool
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="products",
    key_field="id",
    autoincrement=True,
)
class Product(BaseModel):
    id: int | None = None
    name: str
    description: str
    image_url: str | None = None
    price: float
    stock: int
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="payment_methods",
    key_field="id",
    autoincrement=True,
)
class PaymentMethod(BaseModel):
    id: int | None = None
    customer_id: int | None = None
    method_name: str
    details: str
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="categories",
    key_field="id",
    autoincrement=True,
)
class Category(BaseModel):
    id: int | None = None
    name: str
    parent_category_id: int | None = None
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="tags",
    key_field="id",
    autoincrement=True,
    unique_fields=["name"],
)
class Tag(BaseModel):
    id: int | None = None
    name: str
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="product_categories",
    key_field="id",
    autoincrement=True,
)
class ProductCategory(BaseModel):
    id: int | None = None
    product_id: int
    category_id: int
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="product_tags",
    key_field="id",
    autoincrement=True,
)
class ProductTag(BaseModel):
    id: int | None = None
    product_id: int
    tag_id: int
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="reviews",
    key_field="id",
    autoincrement=True,
)
class Review(BaseModel):
    id: int | None = None
    product_id: int
    customer_id: int
    rating: int
    comment: str
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="orders",
    key_field="id",
    autoincrement=True,
)
class Order(BaseModel):
    id: int | None = None
    customer_id: int | None = None
    address_id: int | None = None
    payment_method_id: int | None = None
    total_amount: float
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="order_items",
    key_field="id",
    autoincrement=True,
)
class OrderItem(BaseModel):
    id: int | None = None
    order_id: int
    product_id: int
    quantity: int
    price: float
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="order_payments",
    key_field="id",
    autoincrement=True,
)
class OrderPayment(BaseModel):
    id: int | None = None
    order_id: int
    payment_method_id: int | None = None
    amount: float
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="stripe_customers",
    key_field="id",
    autoincrement=True,
    unique_fields=["stripe_customer_id"],
)
class StripeCustomer(BaseModel):
    id: int | None = None
    customer_id: int | None = None
    guest_name: str | None = None
    guest_email: str | None = None
    stripe_customer_id: str
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="billing_checkout_sessions",
    key_field="id",
    autoincrement=True,
    unique_fields=["stripe_session_id"],
)
class BillingCheckoutSession(BaseModel):
    id: int | None = None
    stripe_session_id: str
    client_secret: str
    mode: str
    status: str
    payment_status: str | None = None
    customer_id: int | None = None
    stripe_customer_id: str | None = None
    guest_name: str | None = None
    guest_email: str | None = None
    cart_snapshot: str
    order_id: int | None = None
    subscription_id: str | None = None
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="subscription_plans",
    key_field="id",
    autoincrement=True,
    unique_fields=["stripe_price_id"],
)
class SubscriptionPlan(BaseModel):
    id: int | None = None
    name: str
    description: str
    stripe_price_id: str
    active: bool
    created_at: str
    updated_at: str


@db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="customer_subscriptions",
    key_field="id",
    autoincrement=True,
    unique_fields=["stripe_subscription_id"],
)
class CustomerSubscription(BaseModel):
    id: int | None = None
    stripe_subscription_id: str
    stripe_customer_id: str
    customer_id: int | None = None
    status: str
    current_period_start: str | None = None
    current_period_end: str | None = None
    cancel_at_period_end: bool
    canceled_at: str | None = None
    created_at: str
    updated_at: str
