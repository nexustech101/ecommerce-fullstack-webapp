from __future__ import annotations

from typing import Any

from app.models import Category, Product, ProductCategory, ProductTag, SubscriptionPlan, Tag
from app.services.common import utc_now

SAMPLE_PRODUCTS: tuple[dict[str, Any], ...] = (
    {
        "name": "Terra Loop Daypack",
        "description": "Weather-ready 18L daypack with recycled canvas and brass hardware.",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
        "price": 128.0,
        "stock": 14,
        "category": "Travel",
        "tags": ("bags", "featured"),
    },
    {
        "name": "Brass Pour-Over Kettle",
        "description": "Balanced gooseneck kettle for slow mornings and clean coffee pours.",
        "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80",
        "price": 74.0,
        "stock": 18,
        "category": "Kitchen",
        "tags": ("coffee", "home"),
    },
    {
        "name": "Linen Market Shirt",
        "description": "Breathable washed-linen button-down cut for all-day errands.",
        "image_url": "https://images.unsplash.com/photo-1520975682031-a8641f5e161a?auto=format&fit=crop&w=900&q=80",
        "price": 86.0,
        "stock": 22,
        "category": "Apparel",
        "tags": ("linen", "new"),
    },
    {
        "name": "Nomad Ceramic Mug",
        "description": "Hand-glazed ceramic mug with an easy-grip handle and satin finish.",
        "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
        "price": 32.0,
        "stock": 36,
        "category": "Kitchen",
        "tags": ("coffee", "giftable"),
    },
    {
        "name": "Trailhead Insulated Bottle",
        "description": "Double-wall stainless bottle that keeps cold drinks cold for a full day.",
        "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
        "price": 42.0,
        "stock": 30,
        "category": "Travel",
        "tags": ("outdoors", "featured"),
    },
    {
        "name": "Walnut Desk Tray",
        "description": "Solid walnut catchall for keys, cards, pens, and everyday carry.",
        "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
        "price": 58.0,
        "stock": 16,
        "category": "Home Office",
        "tags": ("desk", "home"),
    },
    {
        "name": "Cotton Cloud Throw",
        "description": "Soft ribbed cotton throw for sofa naps, reading corners, and chilly patios.",
        "image_url": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
        "price": 96.0,
        "stock": 11,
        "category": "Home",
        "tags": ("textiles", "giftable"),
    },
    {
        "name": "Signal Field Journal",
        "description": "Lay-flat dot-grid journal with a durable cloth cover and archival paper.",
        "image_url": "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80",
        "price": 24.0,
        "stock": 48,
        "category": "Home Office",
        "tags": ("stationery", "new"),
    },
)

SAMPLE_PLANS: tuple[dict[str, Any], ...] = (
    {
        "name": "Monthly Essentials Box",
        "description": "A recurring monthly box of curated home and travel essentials.",
        "stripe_price_id": "price_sample_monthly_essentials",
        "active": True,
    },
    {
        "name": "Quarterly Coffee Club",
        "description": "Seasonal mugs, brew tools, and coffee accessories every quarter.",
        "stripe_price_id": "price_sample_quarterly_coffee",
        "active": True,
    },
)


def _first(model_cls, **filters):
    rows = model_cls.objects.filter(limit=1, **filters)
    return rows[0] if rows else None


def _upsert_category(name: str) -> Category:
    category = _first(Category, name=name)
    if category is not None:
        return category
    now = utc_now()
    # Older local SQLite files may have created this column as NOT NULL.
    # A zero sentinel keeps the sample seed additive and avoids a destructive table rebuild.
    return Category.objects.create(name=name, parent_category_id=0, created_at=now, updated_at=now)


def _upsert_tag(name: str) -> Tag:
    tag = _first(Tag, name=name)
    if tag is not None:
        return tag
    now = utc_now()
    return Tag.objects.create(name=name, created_at=now, updated_at=now)


def _link_product_category(product_id: int, category_id: int) -> bool:
    if ProductCategory.objects.exists(product_id=product_id, category_id=category_id):
        return False
    now = utc_now()
    ProductCategory.objects.create(product_id=product_id, category_id=category_id, created_at=now, updated_at=now)
    return True


def _link_product_tag(product_id: int, tag_id: int) -> bool:
    if ProductTag.objects.exists(product_id=product_id, tag_id=tag_id):
        return False
    now = utc_now()
    ProductTag.objects.create(product_id=product_id, tag_id=tag_id, created_at=now, updated_at=now)
    return True


def _upsert_sample_plan(plan_data: dict[str, Any]) -> tuple[SubscriptionPlan, bool]:
    plan = _first(SubscriptionPlan, stripe_price_id=plan_data["stripe_price_id"])
    now = utc_now()
    if plan is None:
        return (
            SubscriptionPlan.objects.create(
                name=plan_data["name"],
                description=plan_data["description"],
                stripe_price_id=plan_data["stripe_price_id"],
                active=plan_data["active"],
                created_at=now,
                updated_at=now,
            ),
            True,
        )
    plan.name = plan_data["name"]
    plan.description = plan_data["description"]
    plan.active = plan_data["active"]
    plan.updated_at = now
    plan.save()
    return plan, False


def seed_sample_catalog() -> dict[str, Any]:
    created_products = 0
    updated_products = 0
    linked_categories = 0
    linked_tags = 0
    product_ids: list[int] = []

    for item in SAMPLE_PRODUCTS:
        category = _upsert_category(item["category"])
        tags = [_upsert_tag(tag_name) for tag_name in item["tags"]]
        now = utc_now()
        product = _first(Product, name=item["name"])
        if product is None:
            product = Product.objects.create(
                name=item["name"],
                description=item["description"],
                image_url=item["image_url"],
                price=item["price"],
                stock=item["stock"],
                created_at=now,
                updated_at=now,
            )
            created_products += 1
        else:
            product.description = item["description"]
            product.image_url = item["image_url"]
            product.price = item["price"]
            product.stock = max(product.stock, item["stock"])
            product.updated_at = now
            product.save()
            updated_products += 1

        product_ids.append(product.id)
        if _link_product_category(product.id, category.id):
            linked_categories += 1
        for tag in tags:
            if _link_product_tag(product.id, tag.id):
                linked_tags += 1

    created_plans = 0
    updated_plans = 0
    for plan_data in SAMPLE_PLANS:
        _plan, created = _upsert_sample_plan(plan_data)
        if created:
            created_plans += 1
        else:
            updated_plans += 1

    return {
        "ok": True,
        "products": {
            "created": created_products,
            "updated": updated_products,
            "ids": product_ids,
        },
        "links": {"categories": linked_categories, "tags": linked_tags},
        "plans": {"created": created_plans, "updated": updated_plans},
    }
