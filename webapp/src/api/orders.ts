import { request } from "./client";
import type { Order, OrderDetail } from "../types";

export const ordersApi = {
  list: (params?: { customer_id?: number; limit?: number; offset?: number }): Promise<Order[]> => {
    const qs = new URLSearchParams();
    if (params?.customer_id) qs.set("customer_id", String(params.customer_id));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    return request<Order[]>(`/orders?${qs.toString()}`);
  },

  get: (orderId: number): Promise<OrderDetail> =>
    request<OrderDetail>(`/orders/${orderId}`),
};