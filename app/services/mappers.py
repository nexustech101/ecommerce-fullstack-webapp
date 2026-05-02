from __future__ import annotations

from app.models import (
    Address,
    Category,
    Customer,
    Order,
    OrderItem,
    OrderPayment,
    PaymentMethod,
    Product,
    Review,
    Tag,
)
from app.schemas import (
    AddressOut,
    CategoryOut,
    CustomerOut,
    OrderItemOut,
    OrderOut,
    OrderPaymentOut,
    PaymentMethodOut,
    ProductOut,
    ReviewOut,
    TagOut,
)


def to_customer_out(customer: Customer) -> CustomerOut:
    return CustomerOut(
        id=customer.id,
        name=customer.name,
        email=customer.email,
        created_at=customer.created_at,
        updated_at=customer.updated_at,
    )


def to_address_out(address: Address) -> AddressOut:
    return AddressOut(**address.model_dump())


def to_payment_out(method: PaymentMethod) -> PaymentMethodOut:
    return PaymentMethodOut(**method.model_dump())


def to_product_out(product: Product) -> ProductOut:
    return ProductOut(**product.model_dump())


def to_category_out(category: Category) -> CategoryOut:
    return CategoryOut(**category.model_dump())


def to_tag_out(tag: Tag) -> TagOut:
    return TagOut(**tag.model_dump())


def to_review_out(review: Review) -> ReviewOut:
    return ReviewOut(**review.model_dump())


def to_order_out(order: Order) -> OrderOut:
    return OrderOut(**order.model_dump())


def to_order_item_out(item: OrderItem) -> OrderItemOut:
    return OrderItemOut(**item.model_dump())


def to_order_payment_out(payment: OrderPayment) -> OrderPaymentOut:
    return OrderPaymentOut(**payment.model_dump())
