from __future__ import annotations

from fastapi import APIRouter, Query

from app.models import Category, Customer, Product, ProductCategory, ProductTag, Review, Tag
from app.schemas import (
    CategoryCreate,
    CategoryOut,
    ProductCreate,
    ProductOut,
    ProductUpdate,
    ReviewCreate,
    ReviewOut,
    TagCreate,
    TagOut,
)
from app.services.common import require_model, utc_now
from app.services.mappers import (
    to_category_out,
    to_product_out,
    to_review_out,
    to_tag_out,
)

router = APIRouter()


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate):
    now = utc_now()
    product = Product.objects.create(
        name=payload.name,
        description=payload.description,
        price=payload.price,
        stock=payload.stock,
        created_at=now,
        updated_at=now,
    )
    return to_product_out(product)


@router.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: int):
    product = require_model(Product, product_id)
    return to_product_out(product)


@router.get("/products", response_model=list[ProductOut])
def list_products(
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    search: str | None = Query(None, min_length=1),
):
    filters: dict[str, object] = {}
    if min_price is not None:
        filters["price__gte"] = min_price
    if max_price is not None:
        filters["price__lte"] = max_price
    if search is not None:
        filters["name__ilike"] = f"%{search}%"

    rows = Product.objects.filter(order_by="-id", limit=limit, offset=offset, **filters)
    return [to_product_out(row) for row in rows]


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate):
    product = require_model(Product, product_id)
    updates = payload.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(product, field, value)
    product.updated_at = utc_now()
    product.save()
    return to_product_out(product)


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(payload: CategoryCreate):
    if payload.parent_category_id is not None:
        require_model(Category, payload.parent_category_id)
    now = utc_now()
    category = Category.objects.create(
        name=payload.name,
        parent_category_id=payload.parent_category_id,
        created_at=now,
        updated_at=now,
    )
    return to_category_out(category)


@router.get("/categories", response_model=list[CategoryOut])
def list_categories():
    rows = Category.objects.all(order_by="-id")
    return [to_category_out(row) for row in rows]


@router.post("/tags", response_model=TagOut, status_code=201)
def create_tag(payload: TagCreate):
    now = utc_now()
    tag = Tag.objects.create(name=payload.name, created_at=now, updated_at=now)
    return to_tag_out(tag)


@router.get("/tags", response_model=list[TagOut])
def list_tags():
    rows = Tag.objects.all(order_by="-id")
    return [to_tag_out(row) for row in rows]


@router.post("/products/{product_id}/categories/{category_id}")
def attach_product_category(product_id: int, category_id: int):
    require_model(Product, product_id)
    require_model(Category, category_id)
    if ProductCategory.objects.exists(product_id=product_id, category_id=category_id):
        return {"ok": True, "message": "Already attached"}

    now = utc_now()
    ProductCategory.objects.create(
        product_id=product_id,
        category_id=category_id,
        created_at=now,
        updated_at=now,
    )
    return {"ok": True}


@router.post("/products/{product_id}/tags/{tag_id}")
def attach_product_tag(product_id: int, tag_id: int):
    require_model(Product, product_id)
    require_model(Tag, tag_id)
    if ProductTag.objects.exists(product_id=product_id, tag_id=tag_id):
        return {"ok": True, "message": "Already attached"}

    now = utc_now()
    ProductTag.objects.create(
        product_id=product_id,
        tag_id=tag_id,
        created_at=now,
        updated_at=now,
    )
    return {"ok": True}


@router.post("/reviews", response_model=ReviewOut, status_code=201)
def create_review(payload: ReviewCreate):
    require_model(Product, payload.product_id)
    require_model(Customer, payload.customer_id)
    now = utc_now()
    review = Review.objects.create(
        product_id=payload.product_id,
        customer_id=payload.customer_id,
        rating=payload.rating,
        comment=payload.comment,
        created_at=now,
        updated_at=now,
    )
    return to_review_out(review)


@router.get("/products/{product_id}/reviews", response_model=list[ReviewOut])
def list_product_reviews(product_id: int):
    require_model(Product, product_id)
    rows = Review.objects.filter(product_id=product_id, order_by="-id")
    return [to_review_out(row) for row in rows]
