import type { PortfolioData } from "./types";

export const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ApiError carries the HTTP status so callers can react to it (e.g. a 401 that
// means the admin session expired) without string-matching messages.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// apiRequest is the shared browser-side client for the admin API: it attaches
// the session cookie, sets JSON headers unless the body is FormData, and turns a
// non-2xx response into an ApiError. A 204 resolves to null.
export async function apiRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    credentials: "include",
    headers: isForm ? init.headers : { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(response.status, body.error || "İşlem başarısız");
  }
  return (response.status === 204 ? null : await response.json()) as T;
}

export async function getPortfolio(): Promise<PortfolioData | null> {
  try {
    const response = await fetch(`${process.env.API_URL || apiBase}/api/v1/portfolio`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
