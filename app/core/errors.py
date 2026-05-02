from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from registers.db import (
    DuplicateKeyError,
    InvalidQueryError,
    RecordNotFoundError,
    RegistryError,
    UniqueConstraintError,
)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RecordNotFoundError)
    async def handle_not_found(_request, exc: RecordNotFoundError):
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(UniqueConstraintError)
    async def handle_unique(_request, _exc: UniqueConstraintError):
        return JSONResponse(status_code=409, content={"detail": "Unique constraint violation"})

    @app.exception_handler(DuplicateKeyError)
    async def handle_duplicate(_request, _exc: DuplicateKeyError):
        return JSONResponse(status_code=409, content={"detail": "Duplicate primary key"})

    @app.exception_handler(InvalidQueryError)
    async def handle_query_error(_request, exc: InvalidQueryError):
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    @app.exception_handler(RegistryError)
    async def handle_registry_error(_request, exc: RegistryError):
        return JSONResponse(status_code=400, content={"detail": str(exc)})
