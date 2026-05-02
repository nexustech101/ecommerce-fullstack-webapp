from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from pydantic import BaseModel
from registers.db import RecordNotFoundError


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def require_model(model_cls: type[BaseModel], model_id: int) -> BaseModel:
    try:
        return model_cls.objects.require(model_id)
    except RecordNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=f"{model_cls.__name__} {model_id} not found",
        ) from exc
