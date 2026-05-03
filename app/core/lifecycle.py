from __future__ import annotations

import logging

from app.models import MODEL_REGISTRY
from app.migrations import apply_migrations
from app.core.config import settings
from app.services.seed import seed_sample_catalog

logger = logging.getLogger(__name__)


def initialize_schemas() -> None:
    for model in MODEL_REGISTRY:
        if not model.schema_exists():
            model.create_schema()
            logger.info("Schema created -> %s", model.__name__)
    applied = apply_migrations()
    if applied:
        logger.info("Applied migrations -> %s", ", ".join(applied))
    if settings.seed_sample_data:
        seed_sample_catalog()
        logger.info("Sample catalog seed completed")


def dispose_engines() -> None:
    for model in MODEL_REGISTRY:
        model.objects.dispose()
