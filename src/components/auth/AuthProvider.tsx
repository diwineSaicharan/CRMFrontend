"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  authApi,
  clearClientAuth,
  describeSessionEnd,
  FULL_CRM_ACCESS,
  hasAuthFlag,
  type AuthUser,
  type CrmPermissions,
} from "@/lib/auth";
import type { UserRole } from "@/lib/nav-config";

/**
 * React port of diwine_admin_ui/src/app/core/services/auth.service.ts.
 *
 * The session itself lives in an HTTP-only cookie the page cannot read, so
 * this holds only the derived state: who is signed in, and whether we are
 * still finding out.
 */

/** Slide the cookie forward while the user is active on this device. */
const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
/** Never ping more than once a minute, however busy the user is. */
const SESSION_REFRESH_THROTTLE_MS = 60 * 1000;

const ACTIVITY_EVENTS = ["click", "keydown", "scroll", "touchstart"] as const;

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  /** TEAMMATEs act with the role they were granted. */
  effectiveRole: UserRole | null;
  /** Which CRM pages this account may reach. */
  permissions: CrmPermissions;
  /**
   * False while a teammate's access is still unknown.
   *
   * "Unknown" and "none" have to be different: treating them the same showed a
   * teammate the no-access screen for the whole first render after signing in,
   * because only /profile carried the permissions and login did not.
   */
  permissionsKnown: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  /**
   * Starts as "loading" only when there is a flag worth verifying. With no
   * flag we already know the answer, so there is nothing to wait for — and no
   * effect needs to write that back.
   *
   * This does read localStorage, so the server seeds "unauthenticated" while a
   * signed-in browser seeds "loading". That divergence is invisible by design:
   * RequireAuth renders one identical placeholder for both, and every other
   * consumer only asks whether the status is "authenticated", which is false
   * either way. Give the two states different markup and hydration will break.
   */
  const [status, setStatus] = useState<AuthStatus>(() =>
    hasAuthFlag() ? "loading" : "unauthenticated",
  );

  const lastRefreshAttempt = useRef(0);
  // Read inside listeners that must not be re-bound on every state change.
  // Synced in an effect rather than during render — a render-phase ref write is
  // unsafe under concurrent rendering.
  const statusRef = useRef<AuthStatus>("loading");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const endSession = useCallback(
    (message?: string) => {
      clearClientAuth();
      setUser(null);
      setStatus("unauthenticated");
      if (message && typeof window !== "undefined") {
        window.alert(message);
      }
      router.replace("/login");
    },
    [router],
  );

  /**
   * Rehydrate on mount. The flag only says a cookie was issued at some point;
   * /profile is what actually proves the session is still good.
   */
  useEffect(() => {
    let cancelled = false;

    if (!hasAuthFlag()) return;

    authApi
      .profile()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        // The cookie is gone or the session was revoked server-side.
        clearClientAuth();
        setUser(null);
        setStatus("unauthenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSession = useCallback(
    async (fromUserAction: boolean) => {
      if (statusRef.current !== "authenticated") return;

      const now = Date.now();
      const throttle = fromUserAction
        ? SESSION_REFRESH_THROTTLE_MS
        : SESSION_REFRESH_INTERVAL_MS - 30_000;

      if (now - lastRefreshAttempt.current < throttle) return;
      lastRefreshAttempt.current = now;

      try {
        await authApi.refreshSession();
      } catch (error) {
        const reason = describeSessionEnd(error);
        if (reason) endSession(reason);
      }
    },
    [endSession],
  );

  // Keep-alive: a timer for idle tabs, plus activity so an actively used tab
  // never lapses. Both funnel through the same throttle.
  useEffect(() => {
    if (status !== "authenticated") return;

    const timer = window.setInterval(
      () => void refreshSession(false),
      SESSION_REFRESH_INTERVAL_MS,
    );

    const onActivity = () => void refreshSession(true);
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true }),
    );

    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, onActivity),
      );
    };
  }, [status, refreshSession]);

  const login = useCallback(async (username: string, password: string) => {
    // authApi.login stores the CSRF token and the flag on success.
    const response = await authApi.login(username, password);
    lastRefreshAttempt.current = Date.now(); // Cookie is brand new; don't ping.
    setUser(response.user);
    setStatus("authenticated");
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // A failed logout call must never strand the user in the app.
    }
    clearClientAuth();
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await authApi.profile();
      setUser(profile);
      setStatus("authenticated");
      return profile;
    } catch (error) {
      const reason = describeSessionEnd(error);
      if (reason) endSession(reason);
      return null;
    }
  }, [endSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      effectiveRole:
        user?.role === "TEAMMATE" ? (user.teammateRole ?? null) : (user?.role ?? null),
      /**
       * What this account may reach. Only a TEAMMATE is restricted — everyone
       * else administers the CRM, and gating them on a permission row would
       * lock an admin out of their own panel if the row were ever missing.
       *
       * Until the profile resolves this is deliberately full access rather than
       * none: the shell does not render before then, and defaulting to none
       * would flash an empty sidebar at every reload.
       */
      permissions:
        user?.role === "TEAMMATE"
          ? (user.crmPermissions ?? {
              clients: false,
              create: false,
              deposit: false,
              withdrawal: false,
              transaction: false,
            })
          : FULL_CRM_ACCESS,
      // Anyone unrestricted is known immediately; a teammate is known once
      // their permissions have actually arrived.
      permissionsKnown: user?.role !== "TEAMMATE" || !!user.crmPermissions,
      login,
      logout,
      refreshUser,
    }),
    [user, status, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
