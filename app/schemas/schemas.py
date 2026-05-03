from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, EmailStr, Field, model_validator


class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)


class CustomerUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8)


class CustomerOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: str
    updated_at: str


class AddressCreate(BaseModel):
    customer_id: int
    street: str
    city: str
    state: str
    country: str
    zip_code: str
    is_default: bool = False


class AddressUpdate(BaseModel):
    street: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    zip_code: str | None = None
    is_default: bool | None = None


class AddressOut(BaseModel):
    id: int
    customer_id: int | None = None
    street: str
    city: str
    state: str
    country: str
    zip_code: str
    is_default: bool
    created_at: str
    updated_at: str


class PaymentMethodCreate(BaseModel):
    customer_id: int
    method_name: str
    details: str


class PaymentMethodOut(BaseModel):
    id: int
    customer_id: int | None = None
    method_name: str
    details: str
    created_at: str
    updated_at: str


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    image_url: str | None = None
    price: float = Field(ge=0)
    stock: int = Field(ge=0)


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    image_url: str | None = None
    price: float | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)


class ProductOut(BaseModel):
    id: int
    name: str
    description: str
    image_url: str | None = None
    price: float
    stock: int
    created_at: str
    updated_at: str


class SignInCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class AuthCustomerOut(BaseModel):
    customer: CustomerOut


class CategoryCreate(BaseModel):
    name: str
    parent_category_id: int | None = None


class CategoryOut(BaseModel):
    id: int
    name: str
    parent_category_id: int | None = None
    created_at: str
    updated_at: str


class TagCreate(BaseModel):
    name: str


class TagOut(BaseModel):
    id: int
    name: str
    created_at: str
    updated_at: str


class ReviewCreate(BaseModel):
    product_id: int
    customer_id: int
    rating: int = Field(ge=1, le=5)
    comment: str


class ReviewOut(BaseModel):
    id: int
    product_id: int
    customer_id: int
    rating: int
    comment: str
    created_at: str
    updated_at: str


class OrderItemInput(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)


class CheckoutCreate(BaseModel):
    customer_id: int
    address_id: int
    payment_method_id: int
    items: list[OrderItemInput] = Field(min_length=1)


class OrderOut(BaseModel):
    id: int
    customer_id: int | None = None
    address_id: int | None = None
    payment_method_id: int | None = None
    total_amount: float
    created_at: str
    updated_at: str


class OrderItemOut(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    price: float
    created_at: str
    updated_at: str


class OrderPaymentOut(BaseModel):
    id: int
    order_id: int
    payment_method_id: int | None = None
    amount: float
    created_at: str
    updated_at: str


class OrderDetailOut(BaseModel):
    order: OrderOut
    items: list[OrderItemOut]
    payments: list[OrderPaymentOut]


class BillingConfigOut(BaseModel):
    publishable_key: str
    embedded_checkout_enabled: bool = True


class GuestCheckoutCustomer(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr


class BillingLineItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)


class CreateCheckoutSession(BaseModel):
    mode: Literal["payment", "subscription"]
    customer_id: int | None = Field(default=None, ge=1)
    guest: GuestCheckoutCustomer | None = None
    items: list[BillingLineItem] | None = None
    plan_id: int | None = Field(default=None, ge=1)

    @model_validator(mode="after")
    def validate_checkout_request(self):
        if self.customer_id is None and self.guest is None:
            raise ValueError("Either customer_id or guest is required")
        if self.mode == "payment" and not self.items:
            raise ValueError("items are required for payment checkout")
        if self.mode == "subscription" and self.plan_id is None:
            raise ValueError("plan_id is required for subscription checkout")
        return self


class CheckoutSessionCreateOut(BaseModel):
    session_id: str
    client_secret: str


class CheckoutSessionStatusOut(BaseModel):
    session_id: str
    status: str
    payment_status: str | None = None
    mode: str
    order_id: int | None = None
    subscription_id: str | None = None


class PortalSessionCreate(BaseModel):
    customer_id: int | None = Field(default=None, ge=1)
    stripe_customer_id: str | None = None
    return_url: str | None = None

    @model_validator(mode="after")
    def validate_portal_request(self):
        if self.customer_id is None and self.stripe_customer_id is None:
            raise ValueError("Either customer_id or stripe_customer_id is required")
        return self


class PortalSessionOut(BaseModel):
    url: str


class SubscriptionPlanOut(BaseModel):
    id: int
    name: str
    description: str
    stripe_price_id: str
    active: bool
    created_at: str
    updated_at: str


class CustomerSubscriptionOut(BaseModel):
    id: int
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
