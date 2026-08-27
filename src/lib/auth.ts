import { api, ApiError, apiFetch } from "@/lib/api";
import type { UserRole } from "@/lib/nav-config";

/**
 * Mirrors diwine_admin_ui/src/app/core/models/auth.interface.ts and the
 * `/api/auth` routes in diwine_admin. The CRM backend implements the same
 * contract, so this layer is a straight port of AuthService.
 */
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  /** For a TEAMMATE, the role whose permissions they actually hold. */
  teammateRole?: UserRole | null;
  fullName?: string | null;
  mobileNumber?: string | null;
  parentId?: string | null;
  commission?: number;
  sharingRatio?: number;
  isActive?: boolean;
}

export interface LoginResponse {
  success?: boolean;
  /** The JWT is NOT here — it rides in an HTTP-only cookie. */
  csrfToken: string;
  user: AuthUser;
  sessionDuration?: number;
}

/** Set alongside the cookie so a reload knows to attempt rehydration. */
export const AUTH_FLAG_KEY = "authenticated";
export const CSRF_TOKEN_KEY = "csrf_token";

/**
 * The backend sets this cookie itself; we mirror it because a proxy or a
 * browser occasionally drops Set-Cookie, and without the readable copy every
 * state-changing request would fail CSRF. Same fallback the Angular app keeps.
 */
function syncCsrfCookie(token: string): void {
  if (typeof document === "undefined" || !token) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CSRF_TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
}

function clearCsrfCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CSRF_TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function markAuthenticated(csrfToken: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_FLAG_KEY, "true");
    localStorage.setItem(CSRF_TOKEN_KEY, csrfToken);
  } catch {
    // Private mode / storage disabled — the cookie still carries the session.
  }
  syncCsrfCookie(csrfToken);
}

export function clearClientAuth(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_FLAG_KEY);
    localStorage.removeItem(CSRF_TOKEN_KEY);
  } catch {
    // Ignore — clearing is best-effort.
  }
  clearCsrfCookie();
}

/**
 * The JWT is in an HTTP-only cookie that JS cannot read, so this flag is the
 * only client-side signal. It is a hint for routing, never a security check —
 * the backend validates the cookie on every request regardless.
 */
export function hasAuthFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(AUTH_FLAG_KEY) === "true";
  } catch {
    return false;
  }
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (response?.csrfToken) markAuthenticated(response.csrfToken);
    return response;
  },

  logout: () => api.post<{ message: string }>("/auth/logout"),

  profile: () => api.get<AuthUser>("/auth/profile"),

  refreshSession: () =>
    api.post<{ success: boolean; sessionDuration?: number }>("/auth/session/refresh"),

  verifyPassword: (password: string) =>
    api.post<{ success: boolean }>("/auth/verify-password", { password }),
};

/**
 * Turns a failed login into the message the user should see. Ported from
 * `resolveLoginError` in login.component.ts — the CRM backend returns the same
 * status codes and bodies, so the mapping carries over unchanged.
 */
export function resolveLoginError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Unable to connect to the server. Please try again later.";
  }

  const message = error.message?.trim() ?? "";

  switch (error.status) {
    case 0:
      return "Unable to connect to the server. Please try again later.";
    case 400:
      return message || "Please check your username and password.";
    case 401:
      return message || "Invalid username or password";
    case 403:
      return message || "Account locked. Contact your upline.";
    case 429:
      return message || "Too many failed login attempts. Please try again in 15 minutes.";
    default:
      return message || "Login failed. Please try again.";
  }
}

/** Distinguishes "logged in elsewhere" and idle timeout from a plain 401. */
export function describeSessionEnd(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status !== 401 && error.status !== 403) return null;

  const message = (error.message || "").toLowerCase();

  if (
    message.includes("session has been terminated") ||
    message.includes("logged in from another device")
  ) {
    return "Your session on this device was ended because the account signed in elsewhere.";
  }

  if (message.includes("inactivity")) {
    return "This device was logged out due to inactivity. Please sign in again.";
  }

  return "Your session has expired. Please sign in again.";
}
