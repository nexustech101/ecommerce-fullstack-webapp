from __future__ import annotations

import logging

from app.models import MODEL_REGISTRY

logger = logging.getLogger(__name__)


def initialize_schemas() -> None:
    for model in MODEL_REGISTRY:
        if not model.schema_exists():
            model.create_schema()
            logger.info("Schema created -> %s", model.__name__)


def dispose_engines() -> None:
    for model in MODEL_REGISTRY:
        model.objects.dispose()
