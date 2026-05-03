from fastapi import APIRouter

from app.api.v1.routes.admin import router as admin_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.billing import router as billing_router
from app.api.v1.routes.catalog import router as catalog_router
from app.api.v1.routes.customers import router as customers_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.orders import router as orders_router
from app.api.v1.routes.paypal import router as paypal_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["system"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(customers_router, tags=["customers"])
api_router.include_router(catalog_router, tags=["catalog"])
api_router.include_router(orders_router, tags=["orders"])
api_router.include_router(billing_router, tags=["billing"])
api_router.include_router(paypal_router, tags=["payments"])
api_router.include_router(admin_router, tags=["admin"])
