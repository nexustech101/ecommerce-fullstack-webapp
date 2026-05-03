const API_BASE_URL =
  (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ??
  "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    const detail =
      typeof payload === "object" && payload && "detail" in payload
        ? (payload as { detail: unknown }).detail
        : payload;
    throw new ApiError(
      response.status,
      typeof detail === "string" ? detail : `Request failed with ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}