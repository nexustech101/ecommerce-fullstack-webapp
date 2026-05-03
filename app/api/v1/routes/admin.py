from fastapi import APIRouter

from app.models import (
    Address,
    BillingCheckoutSession,
    Category,
    Customer,
    CustomerSubscription,
    Order,
    OrderItem,
    OrderPayment,
    PaymentMethod,
    Product,
    ProductCategory,
    ProductTag,
    Review,
    StripeCustomer,
    SubscriptionPlan,
    Tag,
    MODEL_REGISTRY,
)
from app.services.seed import seed_sample_catalog

router = APIRouter()


@router.post("/admin/schema/create")
def create_all_schemas():
    for model in MODEL_REGISTRY:
        model.create_schema()
    return {"ok": True}


@router.get("/admin/schema/status")
def schema_status():
    return {model.__name__: model.schema_exists() for model in MODEL_REGISTRY}


@router.post("/admin/schema/truncate")
def truncate_all():
    for model in (
        CustomerSubscription,
        BillingCheckoutSession,
        OrderPayment,
        OrderItem,
        Order,
        Review,
        ProductTag,
        ProductCategory,
    ):
        model.truncate()
    for model in (
        StripeCustomer,
        SubscriptionPlan,
        PaymentMethod,
        Address,
        Tag,
        Category,
        Product,
        Customer,
    ):
        model.truncate()
    return {"ok": True}


@router.post("/admin/seed/sample-catalog")
def seed_sample_catalog_route():
    return seed_sample_catalog()
