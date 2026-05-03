from __future__ import annotations

import argparse
from collections.abc import Callable
from dataclasses import dataclass

from pydantic import BaseModel

from app.core.config import settings
from app.models import (
    MODEL_REGISTRY,
    BillingCheckoutSession,
    CustomerSubscription,
    Order,
    OrderPayment,
    PayPalOrder,
    Product,
    StripeCustomer,
)
from app.services.common import utc_now
from registers.db import DatabaseRegistry

migration_db = DatabaseRegistry()


@migration_db.database_registry(
    settings.CUSTOMER_DATABASE,
    table_name="schema_migrations",
    key_field="id",
    autoincrement=True,
    unique_fields=["version"],
)
class MigrationRecord(BaseModel):
    id: int | None = None
    version: str
    name: str
    applied_at: str


@dataclass(frozen=True)
class Migration:
    version: str
    name: str
    apply: Callable[[], None]


def create_registered_schemas() -> None:
    for model in (*MODEL_REGISTRY, MigrationRecord):
        if not model.schema_exists():
            model.create_schema()


def ensure_billing_columns() -> None:
    Order.objects.ensure_column("customer_id", int, nullable=True)
    Order.objects.ensure_column("address_id", int, nullable=True)
    Order.objects.ensure_column("payment_method_id", int, nullable=True)
    OrderPayment.objects.ensure_column("payment_method_id", int, nullable=True)

    StripeCustomer.objects.ensure_column("guest_name", str, nullable=True)
    StripeCustomer.objects.ensure_column("guest_email", str, nullable=True)
    BillingCheckoutSession.objects.ensure_column("payment_status", str, nullable=True)
    BillingCheckoutSession.objects.ensure_column("stripe_customer_id", str, nullable=True)
    BillingCheckoutSession.objects.ensure_column("guest_name", str, nullable=True)
    BillingCheckoutSession.objects.ensure_column("guest_email", str, nullable=True)
    BillingCheckoutSession.objects.ensure_column("order_id", int, nullable=True)
    BillingCheckoutSession.objects.ensure_column("subscription_id", str, nullable=True)
    CustomerSubscription.objects.ensure_column("current_period_start", str, nullable=True)
    CustomerSubscription.objects.ensure_column("current_period_end", str, nullable=True)
    CustomerSubscription.objects.ensure_column("canceled_at", str, nullable=True)


def ensure_product_image_url() -> None:
    Product.objects.ensure_column("image_url", str, nullable=True)


def ensure_paypal_order_columns() -> None:
    if not PayPalOrder.schema_exists():
        PayPalOrder.create_schema()
    PayPalOrder.objects.ensure_column("customer_id", int, nullable=True)
    PayPalOrder.objects.ensure_column("guest_name", str, nullable=True)
    PayPalOrder.objects.ensure_column("guest_email", str, nullable=True)
    PayPalOrder.objects.ensure_column("approval_url", str, nullable=True)
    PayPalOrder.objects.ensure_column("order_id", int, nullable=True)
    PayPalOrder.objects.ensure_column("capture_id", str, nullable=True)
    PayPalOrder.objects.ensure_column("payer_id", str, nullable=True)
    PayPalOrder.objects.ensure_column("raw_response", str, nullable=True)


MIGRATIONS = (
    Migration("0001", "create_registered_schemas", create_registered_schemas),
    Migration("0002", "ensure_billing_columns", ensure_billing_columns),
    Migration("0003", "ensure_product_image_url", ensure_product_image_url),
    Migration("0004", "ensure_paypal_order_columns", ensure_paypal_order_columns),
)


def _is_applied(version: str) -> bool:
    return MigrationRecord.objects.exists(version=version)


def apply_migrations() -> list[str]:
    if not MigrationRecord.schema_exists():
        MigrationRecord.create_schema()

    applied: list[str] = []
    for migration in MIGRATIONS:
        if _is_applied(migration.version):
            continue
        migration.apply()
        MigrationRecord.objects.create(
            version=migration.version,
            name=migration.name,
            applied_at=utc_now(),
        )
        applied.append(migration.version)
    return applied


def migration_status() -> list[dict[str, str | bool]]:
    if not MigrationRecord.schema_exists():
        return [
            {"version": migration.version, "name": migration.name, "applied": False}
            for migration in MIGRATIONS
        ]
    return [
        {
            "version": migration.version,
            "name": migration.name,
            "applied": _is_applied(migration.version),
        }
        for migration in MIGRATIONS
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Run ecommerce backend schema migrations.")
    parser.add_argument("command", choices=("status", "upgrade"))
    args = parser.parse_args()

    if args.command == "status":
        for row in migration_status():
            marker = "applied" if row["applied"] else "pending"
            print(f"{row['version']} {row['name']} {marker}")
        return

    applied = apply_migrations()
    if applied:
        print(f"Applied migrations: {', '.join(applied)}")
    else:
        print("No migrations to apply")


if __name__ == "__main__":
    main()
