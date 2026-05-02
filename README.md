# Ecommerce Backend Example

FastAPI backend organized by domain routers, shared service helpers, and registers.db models.

## Run

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Start server:

```bash
uvicorn app.main:app --reload
```

3. Open docs:

- Swagger UI: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/api/v1/health`

## Structure

- `app/main.py`: FastAPI app factory and startup lifecycle
- `app/core/`: settings, exception handlers, lifecycle hooks
- `app/models/`: registers.db table models
- `app/schemas/`: request and response models
- `app/services/`: shared service utilities and output mappers
- `app/api/v1/routes/`: domain route modules (customers, catalog, orders, admin)
