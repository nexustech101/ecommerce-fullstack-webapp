// ─── Core Entities ───────────────────────────────────────────────────────────

export type Customer = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type Address = {
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

export type PaymentMethod = {
  id: number;
  customer_id?: number | null;
  method_name: string;
  details: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  image_url?: string | null;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: number;
  name: string;
  parent_category_id?: number | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export type Order = {
  id: number;
  customer_id?: number | null;
  address_id?: number | null;
  payment_method_id?: number | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
};

export type OrderPayment = {
  id: number;
  order_id: number;
  payment_method_id?: number | null;
  amount: number;
  created_at: string;
  updated_at: string;
};

export type OrderDetail = {
  order: Order;
  items: OrderItem[];
  payments: OrderPayment[];
};

// ─── Billing ─────────────────────────────────────────────────────────────────

export type CheckoutMode = "payment" | "subscription";

export type GuestCheckoutCustomer = {
  name: string;
  email: string;
};

export type BillingLineItem = {
  product_id: number;
  quantity: number;
};

export type CreateCheckoutSession = {
  mode: CheckoutMode;
  customer_id?: number;
  guest?: GuestCheckoutCustomer;
  items?: BillingLineItem[];
  plan_id?: number;
};

export type CheckoutSessionCreateResponse = {
  session_id: string;
  client_secret: string;
};

export type CheckoutSessionStatus = {
  session_id: string;
  status: string;
  payment_status?: string | null;
  mode: string;
  order_id?: number | null;
  subscription_id?: string | null;
};

export type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  stripe_price_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerSubscription = {
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

export type BillingConfig = {
  publishable_key: string;
  embedded_checkout_enabled: boolean;
};

export type CreatePayPalOrder = {
  customer_id?: number;
  guest?: GuestCheckoutCustomer;
  items: BillingLineItem[];
};

export type PayPalOrderCreateResponse = {
  paypal_order_id: string;
  status: string;
  approval_url?: string | null;
};

export type PayPalOrderStatus = {
  paypal_order_id: string;
  status: string;
  amount: number;
  currency: string;
  order_id?: number | null;
  capture_id?: string | null;
  approval_url?: string | null;
};

export type PayPalCaptureResponse = {
  paypal_order_id: string;
  status: string;
  order_id?: number | null;
  capture_id?: string | null;
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export type CartLine = {
  product: Product;
  quantity: number;
};

export type Cart = {
  lines: CartLine[];
};
