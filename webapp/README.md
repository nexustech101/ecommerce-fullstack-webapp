# Maison — Ecommerce Frontend

A production-ready React + TypeScript ecommerce frontend for the FastAPI backend. Features a dark luxury editorial aesthetic with Cormorant Garamond display type, Stripe Embedded Checkout, cart state management, optional customer accounts, and product reviews.

---

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (dev server + bundler)
- **Tailwind CSS v3**
- **shadcn/ui** (component library built on Radix UI)
- **lucide-react** (icons)
- **Stripe.js** (loaded dynamically for embedded checkout)

---

## Quick Start Commands

### 1. Scaffold the Vite + React + TypeScript project

```bash
npm create vite@latest maison-ecommerce -- --template react-ts
cd maison-ecommerce
```

### 2. Install runtime dependencies

```bash
npm install lucide-react
```

### 3. Install Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

This generates `tailwind.config.js` and `postcss.config.js`. Replace their contents with the files provided in this project.

### 4. Initialize shadcn/ui

```bash
# Install the shadcn CLI
npx shadcn@latest init
```

The CLI will ask several questions — answer them to match `components.json`:
- Style: **Default**
- Base color: **Stone**
- CSS variables: **Yes**
- Global CSS file: `src/index.css`
- Tailwind config: `tailwind.config.js`
- Components alias: `@/components`
- Utils alias: `@/lib/utils`

### 5. Install shadcn/ui components used in this project

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add toast
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add card
npx shadcn@latest add avatar
npx shadcn@latest add skeleton
```

Or install all at once:

```bash
npx shadcn@latest add button input label badge separator toast dialog sheet card avatar skeleton
```

Each command copies the component source into `src/components/ui/`. You can customise those files freely.

### 6. Install shadcn peer dependencies (installed automatically by shadcn init, listed for reference)

```bash
npm install clsx tailwind-merge class-variance-authority @radix-ui/react-slot
```

### 7. Copy project source files

Replace the scaffolded `src/` directory with the files from this project (see file tree below).

### 8. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Direct backend (no Docker proxy)
VITE_API_BASE_URL=http://localhost:8000/api/v1

# Or via Docker Nginx proxy
# VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### 9. Start the development server

```bash
npm run dev
```

App runs at **http://localhost:5173**.

### 10. Build for production

```bash
npm run build
npm run preview   # serve the build locally
```

---

## Stripe Setup (for Checkout)

The checkout page loads Stripe.js dynamically from `https://js.stripe.com/v3/` at runtime — no install needed.

For local development, run the Stripe CLI webhook forwarder so that orders are fulfilled after payment:

```powershell
stripe listen --forward-to localhost:8000/api/v1/billing/webhooks/stripe
```

> Without the webhook forwarder, the return page will show a completed Stripe redirect but `order_id` will be `null`.

---

## File Tree

```
maison-ecommerce/
├── index.html                        # Vite HTML entry
├── package.json
├── postcss.config.js                 # PostCSS (required by Tailwind)
├── tailwind.config.js                # Tailwind config with custom fonts
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                    # Vite config with /api proxy
├── components.json                   # shadcn/ui config
├── .env.example                      # Copy to .env.local
│
└── src/
    ├── main.tsx                      # React root mount
    ├── App.tsx                       # Client-side router (page switcher)
    ├── index.css                     # Tailwind directives + custom fonts + scrollbar
    │
    ├── lib/
    │   └── utils.ts                  # shadcn cn() helper (clsx + tailwind-merge)
    │
    ├── types/
    │   └── index.ts                  # All TypeScript types (mirrors backend schemas)
    │
    ├── api/
    │   ├── client.ts                 # fetch wrapper + ApiError class
    │   ├── products.ts               # GET /products, GET /products/:id, reviews
    │   ├── auth.ts                   # POST /auth/signup, POST /auth/signin
    │   ├── billing.ts                # Stripe config, checkout sessions, subscriptions
    │   └── orders.ts                 # GET /orders, GET /orders/:id
    │
    ├── context/
    │   ├── AuthContext.tsx           # Customer auth state (persisted to localStorage)
    │   └── CartContext.tsx           # Cart state + drawer open/close
    │
    ├── hooks/
    │   └── useProducts.ts            # Products list with query/filter/loading state
    │
    ├── components/
    │   ├── ui/                       # ← shadcn/ui auto-generated components live here
    │   │   ├── button.tsx            #   (added via: npx shadcn@latest add button)
    │   │   ├── input.tsx
    │   │   ├── dialog.tsx
    │   │   └── ...                   #   (all other shadcn components you add)
    │   │
    │   ├── layout/
    │   │   ├── Layout.tsx            # Page wrapper: Header + main + Footer + CartDrawer
    │   │   ├── Header.tsx            # Fixed top nav: logo, nav links, cart icon, user menu
    │   │   └── Footer.tsx            # Simple dark footer with nav links
    │   │
    │   ├── product/
    │   │   ├── ProductCard.tsx       # Grid card: image, name, price, add-to-cart overlay
    │   │   └── ProductFilters.tsx    # Search input + price range filter panel
    │   │
    │   ├── cart/
    │   │   └── CartDrawer.tsx        # Slide-in cart: line items, qty controls, checkout CTA
    │   │
    │   └── auth/
    │       └── AuthModal.tsx         # Sign in / sign up modal with tab switcher
    │
    └── pages/
        ├── HomePage.tsx              # Hero + product grid with filters
        ├── ProductDetailPage.tsx     # Product image, info, qty, add-to-cart, reviews
        ├── CheckoutPage.tsx          # Guest/account identity + Stripe Embedded Checkout
        ├── CheckoutReturnPage.tsx    # Stripe return URL handler — shows order confirmation
        ├── SubscriptionsPage.tsx     # Recurring plan cards + subscribe flow
        ├── OrdersPage.tsx            # Customer order history list
        └── OrderDetailPage.tsx       # Single order: items + payments breakdown
```

---

## Pages & Features

| Page | Route (internal) | Description |
|---|---|---|
| Home | `home` | Product grid with search + price filters |
| Product Detail | `product` | Full product info, add to cart, star reviews |
| Checkout | `checkout` | Guest or account identity + Stripe Embedded Checkout |
| Checkout Return | `checkout-return` | Stripe return handler, order confirmation |
| Subscriptions | `subscriptions` | Active recurring plans from `/billing/subscription-plans` |
| Orders | `orders` | Signed-in customer order history |
| Order Detail | `order-detail` | Items, quantities, and payment breakdown |

> Navigation is handled client-side via a state machine in `App.tsx` — no React Router needed. To add React Router, swap the `handleNavigate` / `renderPage` logic in `App.tsx`.

---

## Architecture Notes

### No bearer tokens
The current backend issues no JWTs. `AuthContext` stores the returned `customer` object in `localStorage` and passes `customer.id` to checkout. Guest checkout is always supported.

### Cart state
`CartContext` is in-memory only (React state). It is not persisted to `localStorage` — add that yourself if you want carts to survive page reloads.

### Stripe Embedded Checkout
`CheckoutPage` loads `stripe.js` dynamically and calls `stripe.initEmbeddedCheckout()`. A new session must be created if the page is refreshed or if the session errors. The `client_secret` is never stored outside of the session closure.

### Order fulfillment is webhook-driven
`CheckoutReturnPage` shows `order_id` only once the `checkout.session.completed` webhook fires and the backend processes it. In development, run the Stripe CLI forwarder (see above).

### shadcn/ui components
The `src/components/ui/` directory is populated by `npx shadcn@latest add <name>`. The component source lives in your repo — modify it freely. The provided custom components (Header, CartDrawer, etc.) use raw Tailwind and can coexist with or use shadcn primitives.