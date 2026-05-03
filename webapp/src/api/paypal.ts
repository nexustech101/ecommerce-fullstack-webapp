import { request } from "./client";
import type {
  CreatePayPalOrder,
  PayPalCaptureResponse,
  PayPalOrderCreateResponse,
  PayPalOrderStatus,
} from "../types";

export const paypalApi = {
  createOrder: (data: CreatePayPalOrder): Promise<PayPalOrderCreateResponse> =>
    request<PayPalOrderCreateResponse>("/payments/paypal/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getOrder: (paypalOrderId: string): Promise<PayPalOrderStatus> =>
    request<PayPalOrderStatus>(`/payments/paypal/orders/${paypalOrderId}`),

  captureOrder: (paypalOrderId: string): Promise<PayPalCaptureResponse> =>
    request<PayPalCaptureResponse>(`/payments/paypal/orders/${paypalOrderId}/capture`, {
      method: "POST",
    }),
};
