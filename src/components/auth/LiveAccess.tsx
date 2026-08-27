"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "./AuthProvider";

/**
 * Keeps this browser's view of its own access current.
 *
 * When an admin grants or revokes a teammate, that teammate's sidebar, rail and
 * routes are all derived from permissions this page already fetched — so
 * without a push they stay wrong until a reload, and nobody reloads a page that
 * looks fine. The server sends `access-changed`; this re-reads the profile,
 * which re-renders the nav and the guard together.
 *
 * Re-reading rather than trusting a pushed payload is deliberate: the profile
 * is the same source the first render used, so there is only ever one answer
 * about what this account may reach.
 *
 * A dropped stream is not a failure mode worth handling here — EventSource
 * reconnects on its own, and the periodic session refresh already re-reads the
 * profile, so the worst case is a delay rather than a stale page forever.
 */
export function LiveAccess() {
  const { isAuthenticated, refreshUser } = useAuth();
  // Held in a ref so the stream below does not reconnect whenever this
  // callback's identity changes. Synced in an effect, not during render — a
  // render-phase ref write is unsafe under concurrent rendering.
  const refresh = useRef(refreshUser);
  useEffect(() => {
    refresh.current = refreshUser;
  }, [refreshUser]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    // withCredentials, or the auth cookie is not sent cross-origin and the
    // stream answers 401.
    const source = new EventSource(`${base}/events`, { withCredentials: true });

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string };
        if (payload.type === "access-changed") void refresh.current();
      } catch {
        // A malformed frame is not worth tearing the stream down for.
      }
    };

    // No onerror handling on purpose: EventSource retries by itself, and
    // logging every reconnect would bury real errors during a deploy.

    return () => source.close();
  }, [isAuthenticated]);

  return null;
}
