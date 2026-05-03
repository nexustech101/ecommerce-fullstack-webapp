import { request } from "./client";
import type { Customer } from "../types";

type AuthResponse = { customer: Customer };

export const authApi = {
  signup: (data: { name: string; email: string; password: string }): Promise<AuthResponse> =>
    request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  signin: (data: { email: string; password: string }): Promise<AuthResponse> =>
    request<AuthResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};