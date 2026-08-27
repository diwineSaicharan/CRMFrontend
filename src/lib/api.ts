const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = `; ${document.cookie}`.split(`; ${name}=`);
  return parts.length === 2 ? (parts.pop()?.split(";").shift() ?? null) : null;
}

/**
 * Cookie first, stored copy second. A proxy or browser occasionally drops
 * Set-Cookie, and without a fallback every write would then fail CSRF — the
 * Angular interceptor keeps the same mirror for the same reason.
 */
function readCsrfToken(): string | null {
  const fromCookie = readCookie(CSRF_COOKIE_NAME);
  if (fromCookie) return decodeURIComponent(fromCookie);

  try {
    return localStorage.getItem(CSRF_COOKIE_NAME);
  } catch {
    return null;
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Same session model as diwine_admin: the JWT rides in an HTTP-only cookie, so
 * every call sends credentials, and state-changing verbs echo the readable CSRF
 * cookie back in a header (auth.middleware.ts compares the two).
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (STATE_CHANGING.has(method)) {
    const csrf = readCsrfToken();
    if (csrf) headers.set(CSRF_HEADER_NAME, csrf);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      method,
      headers,
      credentials: "include",
    });
  } catch {
    // Server unreachable — status 0 mirrors Angular's HttpErrorResponse, which
    // the login screen already distinguishes from a rejected credential.
    throw new ApiError(0, "Unable to reach the server");
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    // Controllers answer with `message`, auth middleware with `error` — read
    // both so a CSRF or session failure reaches the caller as its real reason.
    const fromBody =
      body && typeof body === "object"
        ? String(
            (body as { message?: unknown; error?: unknown }).message ??
              (body as { error?: unknown }).error ??
              "",
          ) || null
        : typeof body === "string" && body
          ? body
          : null;
    throw new ApiError(res.status, fromBody ?? `Request failed (${res.status})`);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
