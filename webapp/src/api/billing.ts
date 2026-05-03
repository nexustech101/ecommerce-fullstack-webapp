import { request } from "./client";
import type {
  BillingConfig,
  CheckoutSessionCreateResponse,
  CheckoutSessionStatus,
  CreateCheckoutSession,
  CustomerSubscription,
  SubscriptionPlan,
} from "../types";

export const billingApi = {
  getConfig: (): Promise<BillingConfig> => request<BillingConfig>("/billing/config"),

  createCheckoutSession: (
    data: CreateCheckoutSession,
  ): Promise<CheckoutSessionCreateResponse> =>
    request<CheckoutSessionCreateResponse>("/billing/checkout-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCheckoutSession: (sessionId: string): Promise<CheckoutSessionStatus> =>
    request<CheckoutSessionStatus>(`/billing/checkout-sessions/${sessionId}`),

  getSubscriptionPlans: (): Promise<SubscriptionPlan[]> =>
    request<SubscriptionPlan[]>("/billing/subscription-plans"),

  getCustomerSubscriptions: (customerId: number): Promise<CustomerSubscription[]> =>
    request<CustomerSubscription[]>(`/billing/customers/${customerId}/subscriptions`),

  createPortalSession: (data: {
    customer_id?: number;
    stripe_customer_id?: string;
    return_url?: string;
  }): Promise<{ url: string }> =>
    request<{ url: string }>("/billing/portal-sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};