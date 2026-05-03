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

## Docker

Copy `.env.example` to `.env` and set real Stripe values before running payment flows.

```bash
docker compose up --build
```

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000/api/v1`
- API docs: `http://localhost:8000/docs`

The Compose setup stores the SQLite database in the `backend-data` Docker volume and serves the Vite frontend through Nginx. Frontend `/api/*` calls are proxied to the backend container.

## Stripe Billing

Copy `.env.example` to `.env` and set your Stripe test keys. Embedded Checkout uses:

- `POST /api/v1/billing/checkout-sessions` for guest or registered customer checkout.
- `GET /api/v1/billing/checkout-sessions/{session_id}` for return-page status.
- `POST /api/v1/billing/portal-sessions` for Stripe Customer Portal redirects.
- `POST /api/v1/billing/webhooks/stripe` for Stripe webhook delivery.

For local webhook testing:

```bash
stripe listen --forward-to localhost:8000/api/v1/billing/webhooks/stripe
```

## Migrations

Schema migrations live in `app/migrations/` and use `registers.db` lifecycle helpers.

```bash
python -m app.migrations status
python -m app.migrations upgrade
```

## Sample Catalog

Seed demo products, categories, tags, and subscription plans for frontend purchase simulations:

```bash
python -m app.seed
```

Or call `POST /api/v1/admin/seed/sample-catalog`. The seed is idempotent and refreshes sample product images/prices without duplicating products. Set `SEED_SAMPLE_DATA=true` to seed automatically on backend startup.

## Optional Accounts

Guest checkout remains supported. Optional account flows are available at:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/signin`

The frontend stores the returned customer profile locally and can pass `customer_id` to checkout sessions.

## Frontend

The React frontend lives in `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Set `frontend/.env` from `frontend/.env.example` when you need to override the API URL.

## Structure

- `app/main.py`: FastAPI app factory and startup lifecycle
- `app/core/`: settings, exception handlers, lifecycle hooks
- `app/models/`: registers.db table models
- `app/schemas/`: request and response models
- `app/services/`: shared service utilities and output mappers
- `app/api/v1/routes/`: domain route modules (customers, catalog, orders, admin)
