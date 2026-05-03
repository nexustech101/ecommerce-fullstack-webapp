# Ecommerce API Reference

Generated: 2026-05-03  
Audience: frontend engineers, downstream coding agents, QA automation, and integration reviewers.

This document describes the public HTTP API exposed by the FastAPI ecommerce backend. It is intended to be the working contract for frontend services that fetch catalog data, create carts/checkouts, support optional customer accounts, and integrate Stripe Embedded Checkout.

## 1. Runtime Overview

### Base URLs

| Environment | Base URL | Notes |
|---|---|---|
| Local backend direct | `http://localhost:8000/api/v1` | FastAPI/Uvicorn process. |
| Docker frontend proxy | `http://localhost:8080/api/v1` | Nginx frontend proxies `/api/*` to the backend container. |
| Vite dev frontend | `http://localhost:5173` | Set `VITE_API_BASE_URL=http://localhost:8000/api/v1` unless using the Docker proxy. |

### OpenAPI

FastAPI also exposes machine-readable API metadata:

- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

### Content Type

Unless noted otherwise:

```http
Content-Type: application/json
Accept: application/json
```

### Authentication Model

The current API has optional customer identity support but does not issue JWTs or access tokens yet.

- `POST /auth/signup` creates a customer and returns a customer profile.
- `POST /auth/signin` validates email/password and returns a customer profile.
- Frontends may store the returned `customer.id` locally and pass it to checkout as `customer_id`.
- Guest checkout remains fully supported and should be the fallback path.

Production implication: do not treat the current account flow as protected authentication for private account resources. It is a lightweight customer identity helper for checkout flows.

### Dates And Times

Date/time fields are ISO-8601 strings generated server-side, for example:

```json
"2026-05-03T02:06:06+00:00"
```

### Money

Product and order amounts are returned as decimal numbers in major currency units, for example `32.25`. Stripe line items are converted server-side to cents/minor units.

The Stripe currency is configured by `STRIPE_CURRENCY`, defaulting to `usd`.

## 2. Standard Errors

FastAPI and registers.db exceptions are mapped to JSON error responses.

| Status | Shape | Common Causes |
|---:|---|---|
| `400` | `{ "detail": string }` | Bad ownership relationship, invalid query, malformed webhook payload. |
| `401` | `{ "detail": "Invalid email or password" }` | Failed signin. |
| `404` | `{ "detail": string }` | Missing customer/product/order/session/etc. |
| `409` | `{ "detail": string }` | Unique constraint conflict, insufficient stock. |
| `422` | FastAPI validation error object | Missing required fields, invalid email, negative price/stock, invalid enum. |
| `502` | `{ "detail": string }` | Stripe API request failed after reaching Stripe. |
| `503` | `{ "detail": string }` | Stripe not configured, placeholder secret key, webhook secret missing, Stripe auth failure. |

Frontend recommendation: always surface `detail` when present, but keep a fallback message for FastAPI validation arrays and non-JSON errors.

## 3. Type Reference

These TypeScript-style shapes mirror the backend Pydantic schemas.

### Core Entities

```ts
type Customer = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

type Address = {
  id: number;
  customer_id?: number | null;
  street: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

type PaymentMethod = {
  id: number;
  customer_id?: number | null;
  method_name: string;
  details: string;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  image_url?: string | null;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
};

type Category = {
  id: number;
  name: string;
  parent_category_id?: number | null;
  created_at: string;
  updated_at: string;
};

type Tag = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

type Review = {
  id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};
```

### Orders

```ts
type Order = {
  id: number;
  customer_id?: number | null;
  address_id?: number | null;
  payment_method_id?: number | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
};

type OrderPayment = {
  id: number;
  order_id: number;
  payment_method_id?: number | null;
  amount: number;
  created_at: string;
  updated_at: string;
};

type OrderDetail = {
  order: Order;
  items: OrderItem[];
  payments: OrderPayment[];
};
```

### Billing

```ts
type CheckoutMode = "payment" | "subscription";

type GuestCheckoutCustomer = {
  name: string;
  email: string;
};

type BillingLineItem = {
  product_id: number;
  quantity: number;
};

type CreateCheckoutSession = {
  mode: CheckoutMode;
  customer_id?: number;
  guest?: GuestCheckoutCustomer;
  items?: BillingLineItem[];
  plan_id?: number;
};

type CheckoutSessionCreateResponse = {
  session_id: string;
  client_secret: string;
};

type CheckoutSessionStatus = {
  session_id: string;
  status: string;
  payment_status?: string | null;
  mode: string;
  order_id?: number | null;
  subscription_id?: string | null;
};

type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  stripe_price_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type CustomerSubscription = {
  id: number;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  customer_id?: number | null;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
};
```

## 4. Endpoint Summary

| Method | Path | Consumer | Purpose |
|---|---|---|---|
| `GET` | `/health` | Infra, QA | Backend health check. |
| `POST` | `/auth/signup` | Frontend | Optional customer account creation. |
| `POST` | `/auth/signin` | Frontend | Optional customer account signin. |
| `GET` | `/products` | Frontend | Product grid/listing. |
| `GET` | `/products/{product_id}` | Frontend | Product detail. |
| `POST` | `/products` | Admin/internal | Create product. |
| `PATCH` | `/products/{product_id}` | Admin/internal | Update product. |
| `GET` | `/categories` | Frontend/admin | List categories. |
| `POST` | `/categories` | Admin/internal | Create category. |
| `GET` | `/tags` | Frontend/admin | List tags. |
| `POST` | `/tags` | Admin/internal | Create tag. |
| `POST` | `/reviews` | Frontend | Create review. |
| `GET` | `/products/{product_id}/reviews` | Frontend | List product reviews. |
| `GET` | `/billing/config` | Frontend | Stripe publishable key/config. |
| `POST` | `/billing/checkout-sessions` | Frontend | Create Stripe Embedded Checkout Session. |
| `GET` | `/billing/checkout-sessions/{session_id}` | Frontend | Read checkout return status. |
| `GET` | `/billing/subscription-plans` | Frontend | List active recurring plans. |
| `POST` | `/billing/portal-sessions` | Frontend | Create Stripe Billing Portal redirect. |
| `GET` | `/billing/customers/{customer_id}/subscriptions` | Frontend | List local subscription records. |
| `POST` | `/billing/webhooks/stripe` | Stripe only | Webhook receiver; raw body + signature. |
| `POST` | `/orders/checkout` | Dev/local | Local non-Stripe checkout path. |
| `GET` | `/orders` | Frontend/admin | List orders. |
| `GET` | `/orders/{order_id}` | Frontend/admin | Order detail. |
| `POST` | `/customers` | Admin/internal | Create customer. Prefer `/auth/signup` for app UX. |
| `GET` | `/customers` | Admin/internal | List customers. |
| `GET` | `/customers/{customer_id}` | Admin/internal | Customer detail. |
| `PATCH` | `/customers/{customer_id}` | Admin/internal | Update customer. |
| `DELETE` | `/customers/{customer_id}` | Admin/internal | Delete customer. |
| `POST` | `/addresses` | Frontend/admin | Add customer address. |
| `PATCH` | `/addresses/{address_id}` | Frontend/admin | Update address. |
| `GET` | `/customers/{customer_id}/addresses` | Frontend/admin | List addresses for customer. |
| `POST` | `/payment-methods` | Dev/local | Create local payment method token record. Not raw card data. |
| `GET` | `/customers/{customer_id}/payment-methods` | Dev/local | List local payment methods. |
| `POST` | `/admin/seed/sample-catalog` | Dev/admin | Seed sample products/plans. |
| `GET` | `/admin/schema/status` | Dev/admin | Schema status. |
| `POST` | `/admin/schema/create` | Dev/admin | Create schemas. |
| `POST` | `/admin/schema/truncate` | Dev/admin | Destructive DB truncate. |

## 5. System

### `GET /health`

Health check used by Docker and monitoring.

Response `200`:

```json
{ "ok": true }
```

## 6. Optional Auth

### `POST /auth/signup`

Creates a customer account and hashes the password server-side.

Request:

```json
{
  "name": "Ada Buyer",
  "email": "ada@example.com",
  "password": "correct-horse"
}
```

Validation:

- `email` must be a valid email address.
- `password` must be at least 8 characters.
- Duplicate `email` returns `409`.

Response `201`:

```json
{
  "customer": {
    "id": 1,
    "name": "Ada Buyer",
    "email": "ada@example.com",
    "created_at": "2026-05-03T02:06:06+00:00",
    "updated_at": "2026-05-03T02:06:06+00:00"
  }
}
```

### `POST /auth/signin`

Validates a customer email/password pair.

Request:

```json
{
  "email": "ada@example.com",
  "password": "correct-horse"
}
```

Response `200`: same shape as signup.

Error `401`:

```json
{ "detail": "Invalid email or password" }
```

Frontend notes:

- Store only the returned customer profile if needed.
- There is no bearer token in the current contract.
- Checkout can use `customer.id` as `customer_id`; guests can skip signin entirely.

## 7. Catalog

### `GET /products`

Lists products sorted by newest first.

Query parameters:

| Name | Type | Default | Constraints | Description |
|---|---:|---:|---|---|
| `limit` | integer | `20` | `1..200` | Max records. |
| `offset` | integer | `0` | `>= 0` | Pagination offset. |
| `min_price` | number | omitted | `>= 0` | Inclusive minimum price. |
| `max_price` | number | omitted | `>= 0` | Inclusive maximum price. |
| `search` | string | omitted | min length `1` | Case-insensitive product-name search. |

Example:

```http
GET /api/v1/products?limit=12&search=mug&min_price=10
```

Response `200`:

```json
[
  {
    "id": 4,
    "name": "Nomad Ceramic Mug",
    "description": "Hand-glazed ceramic mug with an easy-grip handle and satin finish.",
    "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
    "price": 32.0,
    "stock": 36,
    "created_at": "2026-05-03T02:06:06+00:00",
    "updated_at": "2026-05-03T02:06:06+00:00"
  }
]
```

Frontend notes:

- `image_url` may be `null`; product cards should render a placeholder when missing or broken.
- `stock <= 0` should disable add-to-cart.
- Search only targets `name` server-side. If frontend searches descriptions too, do that client-side.

### `GET /products/{product_id}`

Fetches one product.

Response `200`: `Product`.

Errors:

- `404` if the product does not exist.

### `POST /products`

Creates a product. This is currently public at the API layer but should be treated as admin/internal in production deployments.

Request:

```json
{
  "name": "Copper Mug",
  "description": "Polished copper camp mug.",
  "image_url": "https://example.com/copper-mug.jpg",
  "price": 32.25,
  "stock": 3
}
```

Validation:

- `price >= 0`
- `stock >= 0`
- `image_url` is optional and not URL-validated by the backend.

Response `201`: `Product`.

### `PATCH /products/{product_id}`

Partially updates a product.

Request fields are optional:

```json
{
  "name": "Copper Mug",
  "description": "Updated copy",
  "image_url": "https://example.com/new.jpg",
  "price": 35.0,
  "stock": 7
}
```

Response `200`: `Product`.

### `GET /categories`

Lists categories newest first.

Response `200`: `Category[]`.

### `POST /categories`

Creates a category.

Request:

```json
{
  "name": "Kitchen",
  "parent_category_id": null
}
```

If `parent_category_id` is provided, it must reference an existing category.

Response `201`: `Category`.

### `GET /tags`

Lists tags newest first.

Response `200`: `Tag[]`.

### `POST /tags`

Creates a tag.

Request:

```json
{ "name": "featured" }
```

Response `201`: `Tag`.

Errors:

- `409` if tag name violates the unique constraint.

### `POST /products/{product_id}/categories/{category_id}`

Links a product to a category.

Response `200`:

```json
{ "ok": true }
```

If the link already exists:

```json
{ "ok": true, "message": "Already attached" }
```

### `POST /products/{product_id}/tags/{tag_id}`

Links a product to a tag.

Response `200`:

```json
{ "ok": true }
```

If the link already exists:

```json
{ "ok": true, "message": "Already attached" }
```

### `POST /reviews`

Creates a product review.

Request:

```json
{
  "product_id": 1,
  "customer_id": 1,
  "rating": 5,
  "comment": "Excellent."
}
```

Validation:

- `rating` must be between `1` and `5`.
- `product_id` and `customer_id` must exist.

Response `201`: `Review`.

### `GET /products/{product_id}/reviews`

Lists reviews for a product newest first.

Response `200`: `Review[]`.

Errors:

- `404` if product does not exist.

## 8. Stripe Billing And Checkout

Stripe Embedded Checkout is the primary payment surface. The frontend must never collect or store raw card data.

### Required Frontend Flow

1. Load product catalog with `GET /products`.
2. Store cart state client-side.
3. Collect either guest `name/email` or use an optional signed-in `customer_id`.
4. Call `POST /billing/checkout-sessions`.
5. Pass returned `client_secret` to Stripe `EmbeddedCheckoutProvider`.
6. Stripe redirects to `/checkout/return?session_id={CHECKOUT_SESSION_ID}`.
7. Frontend calls `GET /billing/checkout-sessions/{session_id}`.
8. Backend creates local paid orders only from Stripe webhooks, not from frontend success screens.

### `GET /billing/config`

Returns publishable Stripe config for frontend initialization.

Response `200`:

```json
{
  "publishable_key": "pk_test_...",
  "embedded_checkout_enabled": true
}
```

Security note: publishable key is safe to expose. Secret keys must never be sent to the frontend.

### `POST /billing/checkout-sessions`

Creates a Stripe Embedded Checkout Session and persists a local `BillingCheckoutSession` record.

Request for guest one-time purchase:

```json
{
  "mode": "payment",
  "guest": {
    "name": "Guest Buyer",
    "email": "guest@example.com"
  },
  "items": [
    { "product_id": 1, "quantity": 2 }
  ]
}
```

Request for registered customer one-time purchase:

```json
{
  "mode": "payment",
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 1 }
  ]
}
```

Request for subscription:

```json
{
  "mode": "subscription",
  "customer_id": 1,
  "plan_id": 1
}
```

Validation rules:

- `mode` must be `payment` or `subscription`.
- Either `customer_id` or `guest` is required.
- `payment` mode requires non-empty `items`.
- `subscription` mode requires `plan_id`.
- Item `quantity >= 1`.
- Product stock is validated before creating a Stripe session.
- Subscription plan must be active.

Response `201`:

```json
{
  "session_id": "cs_test_...",
  "client_secret": "cs_test_..._secret_..."
}
```

Common errors:

| Status | Cause |
|---:|---|
| `404` | Unknown `customer_id`, `product_id`, or `plan_id`. |
| `409` | Insufficient stock. |
| `422` | Invalid request shape or missing identity. |
| `503` | Stripe disabled, placeholder secret key, or Stripe auth failure. |
| `502` | Stripe API request failed after authentication/config passed. |

Frontend note: discard stale checkout sessions after errors. Start a fresh checkout session after backend config or return URL changes.

### `GET /billing/checkout-sessions/{session_id}`

Returns local checkout session status for the Stripe return page.

Response `200`:

```json
{
  "session_id": "cs_test_...",
  "status": "complete",
  "payment_status": "paid",
  "mode": "payment",
  "order_id": 42,
  "subscription_id": null
}
```

Errors:

- `404` if the local session is not found.

Important webhook note:

- `payment_status=paid` and `status=complete` come from Stripe webhook updates.
- `order_id` is populated only after `checkout.session.completed` webhook fulfillment.
- In local development, run Stripe CLI webhook forwarding or the frontend return page may show a completed Stripe redirect without a local order.

Local webhook command:

```powershell
stripe listen --forward-to localhost:8000/api/v1/billing/webhooks/stripe
```

### `GET /billing/subscription-plans`

Lists active recurring plans stored locally. Plans reference Stripe Prices by `stripe_price_id`; the backend does not use deprecated Stripe Plans.

Response `200`:

```json
[
  {
    "id": 1,
    "name": "Monthly Essentials Box",
    "description": "A recurring monthly box of curated home and travel essentials.",
    "stripe_price_id": "price_sample_monthly_essentials",
    "active": true,
    "created_at": "2026-05-03T02:06:06+00:00",
    "updated_at": "2026-05-03T02:06:06+00:00"
  }
]
```

Production note: sample seeded `stripe_price_id` values are placeholders. For real subscription checkout, configure local `SubscriptionPlan` rows with real Stripe Price IDs.

### `POST /billing/portal-sessions`

Creates a Stripe Billing Portal session URL.

Request using local customer ID:

```json
{
  "customer_id": 1,
  "return_url": "http://localhost:8080/portal"
}
```

Request using Stripe customer ID:

```json
{
  "stripe_customer_id": "cus_test_..."
}
```

Validation:

- Either `customer_id` or `stripe_customer_id` is required.
- If `customer_id` is used, a local `StripeCustomer` record must exist.

Response `200`:

```json
{ "url": "https://billing.stripe.com/p/session/..." }
```

Common errors:

- `404` if local customer has no Stripe customer mapping.
- `503` for Stripe auth/config failure.
- `502` for Stripe portal API failure.

### `GET /billing/customers/{customer_id}/subscriptions`

Lists local subscription records for a customer.

Response `200`: `CustomerSubscription[]`.

### `POST /billing/webhooks/stripe`

Stripe webhook receiver. This endpoint must receive the raw request body and the `Stripe-Signature` header.

Supported events:

| Stripe Event | Backend Behavior |
|---|---|
| `checkout.session.completed` | For `payment`, creates `Order`, `OrderItem`, `OrderPayment`, decrements stock, links order to checkout session. For `subscription`, creates/updates local subscription state. |
| `checkout.session.async_payment_failed` | Marks local checkout session failed without creating an order. |
| `checkout.session.expired` | Marks local checkout session expired/failed without creating an order. |
| `customer.subscription.created` | Creates or updates local subscription. |
| `customer.subscription.updated` | Syncs subscription status, current period, cancel flags. |
| `customer.subscription.deleted` | Syncs deleted/canceled subscription state. |

Response `200`:

```json
{ "received": true }
```

Errors:

- `400` invalid payload or invalid Stripe signature.
- `503` missing webhook secret.

Operational requirements:

- Configure `STRIPE_WEBHOOK_SECRET` from Stripe CLI or Stripe Dashboard.
- Do not call this endpoint from frontend code.
- Order fulfillment is idempotent: repeated completed-session delivery should not create duplicate orders.

## 9. Orders

### `POST /orders/checkout`

Creates a local/dev order without Stripe. This route exists for local testing and legacy/local payment paths. Stripe-backed ecommerce purchases should use `/billing/checkout-sessions`; local paid orders are created from Stripe webhooks.

Request:

```json
{
  "customer_id": 1,
  "address_id": 1,
  "payment_method_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 }
  ]
}
```

Validation:

- Customer, address, payment method, and products must exist.
- Address and payment method must belong to the customer, unless their owner field is `null`.
- Product stock must be sufficient.
- `items` must contain at least one item.
- `quantity >= 1`.

Response `201`: `Order`.

Errors:

- `400` ownership mismatch or compensated persistence error.
- `404` missing model references.
- `409` insufficient stock.

### `GET /orders/{order_id}`

Returns an order with line items and payments.

Response `200`:

```json
{
  "order": {
    "id": 42,
    "customer_id": 1,
    "address_id": 1,
    "payment_method_id": 1,
    "total_amount": 64.0,
    "created_at": "2026-05-03T02:06:06+00:00",
    "updated_at": "2026-05-03T02:06:06+00:00"
  },
  "items": [
    {
      "id": 99,
      "order_id": 42,
      "product_id": 1,
      "quantity": 2,
      "price": 32.0,
      "created_at": "2026-05-03T02:06:06+00:00",
      "updated_at": "2026-05-03T02:06:06+00:00"
    }
  ],
  "payments": [
    {
      "id": 88,
      "order_id": 42,
      "payment_method_id": 1,
      "amount": 64.0,
      "created_at": "2026-05-03T02:06:06+00:00",
      "updated_at": "2026-05-03T02:06:06+00:00"
    }
  ]
}
```

### `GET /orders`

Lists orders newest first.

Query parameters:

| Name | Type | Default | Constraints |
|---|---:|---:|---|
| `customer_id` | integer | omitted | `>= 1` |
| `limit` | integer | `20` | `1..200` |
| `offset` | integer | `0` | `>= 0` |

Response `200`: `Order[]`.

## 10. Customers, Addresses, Payment Methods

These endpoints are currently public at the API layer. Production deployments should place them behind appropriate auth/authorization before exposing them to untrusted clients.

### `POST /customers`

Creates a customer. Prefer `/auth/signup` for app-facing optional account creation.

Request:

```json
{
  "name": "Grace Hopper",
  "email": "grace@example.com",
  "password": "correct-horse"
}
```

Response `201`: `Customer`.

### `GET /customers`

Query parameters:

| Name | Type | Default | Constraints |
|---|---:|---:|---|
| `limit` | integer | `20` | `1..200` |
| `offset` | integer | `0` | `>= 0` |

Response `200`: `Customer[]`.

### `GET /customers/{customer_id}`

Response `200`: `Customer`.

Errors:

- `404` if missing.

### `PATCH /customers/{customer_id}`

Partially updates customer fields.

Request:

```json
{
  "name": "Rear Admiral Hopper",
  "email": "hopper@example.com",
  "password": "new-password"
}
```

All fields are optional. Password is re-hashed server-side when provided.

Response `200`: `Customer`.

### `DELETE /customers/{customer_id}`

Deletes a customer.

Response `200`:

```json
{ "ok": true }
```

### `POST /addresses`

Creates an address.

Request:

```json
{
  "customer_id": 1,
  "street": "100 Main St",
  "city": "Baltimore",
  "state": "MD",
  "country": "US",
  "zip_code": "21201",
  "is_default": true
}
```

Behavior:

- Customer must exist.
- If `is_default=true`, other addresses for that customer are set to `is_default=false`.

Response `201`: `Address`.

### `GET /customers/{customer_id}/addresses`

Lists addresses for a customer newest first.

Response `200`: `Address[]`.

### `PATCH /addresses/{address_id}`

Partially updates an address.

Request:

```json
{
  "city": "Annapolis",
  "is_default": false
}
```

If `is_default=true`, other addresses for that address owner are unset.

Response `200`: `Address`.

### `POST /payment-methods`

Creates a local payment method record. This is not a raw card collection endpoint.

Request:

```json
{
  "customer_id": 1,
  "method_name": "Test Card",
  "details": "pm_test"
}
```

Response `201`: `PaymentMethod`.

Frontend warning: do not send raw card numbers, CVCs, or bank details here. Real card collection belongs to Stripe Checkout.

### `GET /customers/{customer_id}/payment-methods`

Lists local payment method records for a customer newest first.

Response `200`: `PaymentMethod[]`.

## 11. Admin And Development Utilities

These routes are useful for local development and CI but should not be exposed in production without access control.

### `GET /admin/schema/status`

Returns whether each registers.db model table exists.

Response `200`:

```json
{
  "Customer": true,
  "Address": true,
  "Product": true
}
```

The real response includes every registered model.

### `POST /admin/schema/create`

Creates all registered schemas.

Response `200`:

```json
{ "ok": true }
```

### `POST /admin/schema/truncate`

Destructively truncates domain tables in dependency order.

Response `200`:

```json
{ "ok": true }
```

### `POST /admin/seed/sample-catalog`

Seeds sample products, categories, tags, and subscription plan rows. The seed is idempotent: existing sample products are updated by name rather than duplicated.

Response `200`:

```json
{
  "ok": true,
  "products": {
    "created": 8,
    "updated": 0,
    "ids": [1, 2, 3, 4, 5, 6, 7, 8]
  },
  "links": {
    "categories": 8,
    "tags": 16
  },
  "plans": {
    "created": 2,
    "updated": 0
  }
}
```

CLI alternative:

```powershell
python -m app.seed
```

Docker Compose currently sets `SEED_SAMPLE_DATA=true` for the backend service so a fresh volume is seeded on startup.

## 12. Frontend Integration Patterns

### API Client Skeleton

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();
    const detail = typeof payload === "object" && payload && "detail" in payload ? payload.detail : payload;
    throw new Error(typeof detail === "string" ? detail : `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
```

### Guest Payment Checkout

```ts
const session = await request<CheckoutSessionCreateResponse>("/billing/checkout-sessions", {
  method: "POST",
  body: JSON.stringify({
    mode: "payment",
    guest: { name: "Guest Buyer", email: "guest@example.com" },
    items: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
  }),
});

// Use session.client_secret with Stripe EmbeddedCheckoutProvider.
```

### Account Payment Checkout

```ts
const session = await request<CheckoutSessionCreateResponse>("/billing/checkout-sessions", {
  method: "POST",
  body: JSON.stringify({
    mode: "payment",
    customer_id: customer.id,
    items: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
  }),
});
```

### Return Page Status

```ts
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");
const status = await request<CheckoutSessionStatus>(`/billing/checkout-sessions/${sessionId}`);

if (status.payment_status === "paid" || status.status === "complete") {
  clearCart();
}
```

### Product Card Rendering

Frontend product cards should handle:

- `image_url === null`
- broken remote images
- `stock <= 0`
- decimal prices
- optimistic cart state separate from server inventory

## 13. Configuration Reference

Important environment variables:

| Variable | Purpose | Frontend Exposure |
|---|---|---|
| `CUSTOMER_DATABASE` | registers.db SQLite database path/URL. | Never. |
| `SEED_SAMPLE_DATA` | If `true`, seed sample catalog on startup. | Never. |
| `STRIPE_ENABLED` | Enables Stripe checkout routes. | Never. |
| `STRIPE_SECRET_KEY` | Stripe server secret key. | Never. |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key returned by `/billing/config`. | Safe. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret. | Never. |
| `STRIPE_API_VERSION` | Stripe API version; current default `2026-02-25.clover`. | Never. |
| `STRIPE_CURRENCY` | Currency for product `price_data`. | Usually not needed. |
| `STRIPE_RETURN_URL` | Embedded Checkout return URL. | Indirectly visible through Stripe redirect. |
| `STRIPE_PORTAL_RETURN_URL` | Billing Portal return URL. | Indirectly visible through Stripe redirect. |

Current Docker return URLs:

```env
STRIPE_RETURN_URL=http://localhost:8080/checkout/return?session_id={CHECKOUT_SESSION_ID}
STRIPE_PORTAL_RETURN_URL=http://localhost:8080/portal
```

## 14. Production Readiness Notes For Teams

Review these before public launch:

- Add real authentication and authorization around customer, order, admin, product mutation, address, and payment method endpoints.
- Restrict or remove `/admin/*` routes in public environments.
- Use real Stripe Price IDs for subscription plans; seeded sample plan IDs are placeholders.
- Configure Stripe webhook forwarding in development and Dashboard webhooks in production.
- Confirm `STRIPE_RETURN_URL` matches a frontend route after every deployment environment change.
- Do not rely on frontend success redirects for order fulfillment; Stripe webhooks are the source of truth.
- Add shipping/tax workflows before collecting shipping-sensitive orders.
- Avoid storing raw payment method data. Use Stripe Checkout/Portal for payment details.
- Consider paginated response envelopes later if clients need total counts; current list endpoints return arrays only.

## 15. Source Map For Maintainers

Graphify was used to orient the route and schema surface before this document was written. Exact contracts were then verified against the route and schema source files.

| Area | Source File |
|---|---|
| Router composition | `app/api/v1/api.py` |
| Auth routes | `app/api/v1/routes/auth.py` |
| Customer/address/payment routes | `app/api/v1/routes/customers.py` |
| Catalog/review routes | `app/api/v1/routes/catalog.py` |
| Order routes | `app/api/v1/routes/orders.py` |
| Billing routes | `app/api/v1/routes/billing.py` |
| Admin routes | `app/api/v1/routes/admin.py` |
| Transport schemas | `app/schemas/schemas.py` |
| Stripe checkout/webhook services | `app/services/billing.py` |
| Sample seed service | `app/services/seed.py` |
| Settings | `app/core/config.py` |
