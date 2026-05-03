import { request } from "./client";
import type { Product, Review } from "../types";

export type ProductsQuery = {
  limit?: number;
  offset?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
};

export const productsApi = {
  list: (params: ProductsQuery = {}): Promise<Product[]> => {
    const qs = new URLSearchParams();
    if (params.limit !== undefined) qs.set("limit", String(params.limit));
    if (params.offset !== undefined) qs.set("offset", String(params.offset));
    if (params.min_price !== undefined) qs.set("min_price", String(params.min_price));
    if (params.max_price !== undefined) qs.set("max_price", String(params.max_price));
    if (params.search) qs.set("search", params.search);
    return request<Product[]>(`/products?${qs.toString()}`);
  },

  get: (id: number): Promise<Product> => request<Product>(`/products/${id}`),

  getReviews: (productId: number): Promise<Review[]> =>
    request<Review[]>(`/products/${productId}/reviews`),

  createReview: (data: {
    product_id: number;
    customer_id: number;
    rating: number;
    comment: string;
  }): Promise<Review> =>
    request<Review>("/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};