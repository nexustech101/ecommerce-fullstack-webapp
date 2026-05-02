export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
};

export type BillingConfig = {
  publishable_key: string;
  embedded_checkout_enabled: boolean;
};

export type CheckoutMode = "payment" | "subscription";

export type CheckoutItem = {
  product_id: number;
  quantity: number;
};

export type GuestDetails = {
  name: string;
  email: string;
};

export type CreateCheckoutSessionRequest = {
  mode: CheckoutMode;
  customer_id?: number;
  guest?: GuestDetails;
  items?: CheckoutItem[];
  plan_id?: number;
};

export type CreateCheckoutSessionResponse = {
  session_id: string;
  client_secret: string;
};

export type CheckoutSessionStatus = {
  session_id: string;
  status: string;
  payment_status: string;
  mode: CheckoutMode;
  order_id?: number;
  subscription_id?: number;
};

export type SubscriptionPlan = {
  id: number;
  name: string;
  description?: string | null;
  price?: number;
  amount?: number;
  currency?: string;
  interval?: string;
  active?: boolean;
};

export type PortalSessionRequest = {
  customer_id?: number;
  stripe_customer_id?: string;
  return_url?: string;
};

export type PortalSessionResponse = {
  url: string;
};
