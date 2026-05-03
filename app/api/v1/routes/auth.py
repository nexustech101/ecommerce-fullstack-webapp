from __future__ import annotations

from fastapi import APIRouter, HTTPException
from registers.db import hash_password, verify_password

from app.models import Customer
from app.schemas import AuthCustomerOut, CustomerCreate, SignInCreate
from app.services.common import utc_now
from app.services.mappers import to_customer_out

router = APIRouter()


@router.post("/auth/signup", response_model=AuthCustomerOut, status_code=201)
def signup(payload: CustomerCreate):
    now = utc_now()
    customer = Customer.objects.create(
        name=payload.name,
        email=payload.email,
        passwd_hash=hash_password(payload.password),
        created_at=now,
        updated_at=now,
    )
    return AuthCustomerOut(customer=to_customer_out(customer))


@router.post("/auth/signin", response_model=AuthCustomerOut)
def signin(payload: SignInCreate):
    rows = Customer.objects.filter(email=payload.email, limit=1)
    if not rows or not verify_password(payload.password, rows[0].passwd_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthCustomerOut(customer=to_customer_out(rows[0]))
