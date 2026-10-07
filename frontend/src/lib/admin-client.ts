/**
 * Admin API client (browser side).
 * Access token lives in memory + sessionStorage; the refresh token is an
 * HTTP-only cookie handled by the backend via the /api/v1 proxy.
 * On 401 the client transparently refreshes once and retries.
 */

import { ApiError, CLIENT_BASE } from "./api";

const TOKEN_KEY = "admin_access_token";

let accessToken: string | null = null;

export function getToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = sessionStorage.getItem(TOKEN_KEY);
  }
  return accessToken;
}

export function setToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  }
}

export async function refreshSession(): Promise<string | null> {
  try {
    const res = await fetch(`${CLIENT_BASE}/admin/auth/refresh`, { method: "POST" });
    if (!res.ok) return null;
    const data = await res.json();
    setToken(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

interface AdminRequestOpts {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
}

export async function adminRequest<T>(path: string, opts: AdminRequestOpts = {}): Promise<T> {
  const doFetch = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (opts.body !== undefined && !opts.isFormData) headers["Content-Type"] = "application/json";
    return fetch(`${CLIENT_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.isFormData ? (opts.body as FormData) : opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  };

  let res = await doFetch(getToken());
  if (res.status === 401) {
    const fresh = await refreshSession();
    if (fresh) res = await doFetch(fresh);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let errorCode = "HTTP_ERROR";
    try {
      const err = await res.json();
      message = err.message ?? message;
      errorCode = err.error_code ?? errorCode;
    } catch { /* non-JSON */ }
    throw new ApiError(res.status, errorCode, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function adminLogin(email: string, password: string): Promise<{ access_token: string; user: { email: string; full_name: string; role: string } }> {
  const res = await fetch(`${CLIENT_BASE}/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(res.status, data.error_code ?? "LOGIN_FAILED", data.message ?? "Login failed");
  setToken(data.access_token);
  return data;
}

export async function adminLogout(): Promise<void> {
  try {
    await fetch(`${CLIENT_BASE}/admin/auth/logout`, { method: "POST" });
  } finally {
    setToken(null);
  }
}
