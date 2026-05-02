import type {
  BillingConfig,
  CheckoutSessionStatus,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  PortalSessionRequest,
  PortalSessionResponse,
  Product,
  SubscriptionPlan
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(detail || `Request failed with ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  listProducts: () => request<Product[]>("/products"),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  getBillingConfig: () => request<BillingConfig>("/billing/config"),
  createCheckoutSession: (body: CreateCheckoutSessionRequest) =>
    request<CreateCheckoutSessionResponse>("/billing/checkout-sessions", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  getCheckoutSession: (sessionId: string) =>
    request<CheckoutSessionStatus>(`/billing/checkout-sessions/${sessionId}`),
  listSubscriptionPlans: () => request<SubscriptionPlan[]>("/billing/subscription-plans"),
  createPortalSession: (body: PortalSessionRequest) =>
    request<PortalSessionResponse>("/billing/portal-sessions", {
      method: "POST",
      body: JSON.stringify(body)
    })
};

export { ApiError };
