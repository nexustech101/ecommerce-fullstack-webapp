from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.models import Address, Customer, Order, OrderItem, OrderPayment, PaymentMethod, Product
from app.schemas import CheckoutCreate, OrderDetailOut, OrderOut
from app.services.common import require_model, utc_now
from app.services.mappers import to_order_item_out, to_order_out, to_order_payment_out

router = APIRouter()


@router.post("/orders/checkout", response_model=OrderOut, status_code=201)
def checkout(payload: CheckoutCreate):
    customer = require_model(Customer, payload.customer_id)
    address = require_model(Address, payload.address_id)
    payment_method = require_model(PaymentMethod, payload.payment_method_id)

    if address.customer_id not in (None, customer.id):
        raise HTTPException(status_code=400, detail="Address does not belong to customer")
    if payment_method.customer_id not in (None, customer.id):
        raise HTTPException(status_code=400, detail="Payment method does not belong to customer")

    product_snapshots: dict[int, Product] = {}
    total = 0.0
    for item in payload.items:
        product = require_model(Product, item.product_id)
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Insufficient stock for product {product.id}",
            )
        product_snapshots[product.id] = product
        total += product.price * item.quantity

    now = utc_now()
    created_order: Order | None = None
    try:
        created_order = Order.objects.create(
            customer_id=customer.id,
            address_id=address.id,
            payment_method_id=payment_method.id,
            total_amount=round(total, 2),
            created_at=now,
            updated_at=now,
        )

        for item in payload.items:
            product = product_snapshots[item.product_id]
            OrderItem.objects.create(
                order_id=created_order.id,
                product_id=product.id,
                quantity=item.quantity,
                price=product.price,
                created_at=now,
                updated_at=now,
            )
            Product.objects.update_where({"id": product.id}, stock=product.stock - item.quantity)

        OrderPayment.objects.create(
            order_id=created_order.id,
            payment_method_id=payment_method.id,
            amount=round(total, 2),
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

    return to_order_out(created_order)


@router.get("/orders/{order_id}", response_model=OrderDetailOut)
def get_order(order_id: int):
    order = require_model(Order, order_id)
    items = OrderItem.objects.filter(order_id=order.id, order_by="-id")
    payments = OrderPayment.objects.filter(order_id=order.id, order_by="-id")
    return OrderDetailOut(
        order=to_order_out(order),
        items=[to_order_item_out(item) for item in items],
        payments=[to_order_payment_out(payment) for payment in payments],
    )


@router.get("/orders", response_model=list[OrderOut])
def list_orders(
    customer_id: int | None = Query(None, ge=1),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    filters: dict[str, object] = {}
    if customer_id is not None:
        filters["customer_id"] = customer_id
    rows = Order.objects.filter(order_by="-id", limit=limit, offset=offset, **filters)
    return [to_order_out(order) for order in rows]
