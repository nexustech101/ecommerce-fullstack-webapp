from __future__ import annotations

from fastapi import APIRouter, Query
from registers.db import hash_password

from app.models import Address, Customer, PaymentMethod
from app.schemas import (
    AddressCreate,
    AddressOut,
    AddressUpdate,
    CustomerCreate,
    CustomerOut,
    CustomerUpdate,
    PaymentMethodCreate,
    PaymentMethodOut,
)
from app.services.common import require_model, utc_now
from app.services.mappers import to_address_out, to_customer_out, to_payment_out

router = APIRouter()


@router.post("/customers", response_model=CustomerOut, status_code=201)
def create_customer(payload: CustomerCreate):
    now = utc_now()
    customer = Customer.objects.create(
        name=payload.name,
        email=payload.email,
        passwd_hash=hash_password(payload.password),
        created_at=now,
        updated_at=now,
    )
    return to_customer_out(customer)


@router.get("/customers/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int):
    customer = require_model(Customer, customer_id)
    return to_customer_out(customer)


@router.get("/customers", response_model=list[CustomerOut])
def list_customers(limit: int = Query(20, ge=1, le=200), offset: int = Query(0, ge=0)):
    rows = Customer.objects.filter(order_by="-id", limit=limit, offset=offset)
    return [to_customer_out(row) for row in rows]


@router.patch("/customers/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, payload: CustomerUpdate):
    customer = require_model(Customer, customer_id)
    updates = payload.model_dump(exclude_none=True)
    if "password" in updates:
        customer.passwd_hash = hash_password(updates.pop("password"))
    for field, value in updates.items():
        setattr(customer, field, value)
    customer.updated_at = utc_now()
    customer.save()
    return to_customer_out(customer)


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: int):
    customer = require_model(Customer, customer_id)
    customer.delete()
    return {"ok": True}


@router.post("/addresses", response_model=AddressOut, status_code=201)
def create_address(payload: AddressCreate):
    require_model(Customer, payload.customer_id)
    now = utc_now()

    if payload.is_default:
        Address.objects.update_where({"customer_id": payload.customer_id}, is_default=False)

    address = Address.objects.create(
        customer_id=payload.customer_id,
        street=payload.street,
        city=payload.city,
        state=payload.state,
        country=payload.country,
        zip_code=payload.zip_code,
        is_default=payload.is_default,
        created_at=now,
        updated_at=now,
    )
    return to_address_out(address)


@router.get("/customers/{customer_id}/addresses", response_model=list[AddressOut])
def list_customer_addresses(customer_id: int):
    require_model(Customer, customer_id)
    rows = Address.objects.filter(customer_id=customer_id, order_by="-id")
    return [to_address_out(row) for row in rows]


@router.patch("/addresses/{address_id}", response_model=AddressOut)
def update_address(address_id: int, payload: AddressUpdate):
    address = require_model(Address, address_id)
    updates = payload.model_dump(exclude_none=True)
    if updates.get("is_default") is True and address.customer_id is not None:
        Address.objects.update_where({"customer_id": address.customer_id}, is_default=False)
    for field, value in updates.items():
        setattr(address, field, value)
    address.updated_at = utc_now()
    address.save()
    return to_address_out(address)


@router.post("/payment-methods", response_model=PaymentMethodOut, status_code=201)
def create_payment_method(payload: PaymentMethodCreate):
    require_model(Customer, payload.customer_id)
    now = utc_now()
    method = PaymentMethod.objects.create(
        customer_id=payload.customer_id,
        method_name=payload.method_name,
        details=payload.details,
        created_at=now,
        updated_at=now,
    )
    return to_payment_out(method)


@router.get("/customers/{customer_id}/payment-methods", response_model=list[PaymentMethodOut])
def list_payment_methods(customer_id: int):
    require_model(Customer, customer_id)
    rows = PaymentMethod.objects.filter(customer_id=customer_id, order_by="-id")
    return [to_payment_out(row) for row in rows]
