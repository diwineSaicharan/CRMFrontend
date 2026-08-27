"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live server pushes, shared by every page that shows a queue.
 *
 * One stream is opened per page that asks, which is fine at this scale — the
 * alternative is a provider that every page then has to filter anyway.
 *
 * Returns a counter that increases whenever something the caller cares about
 * changed. Pages already reload on a bumped key, so this drops straight into
 * that plumbing rather than introducing a second way to refresh.
 */

export type LiveQueue = "deposit" | "withdrawal";

/** Several rapid changes are one refetch. */
const DEBOUNCE_MS = 400;

/**
 * How often to check for changes the stream did not deliver.
 *
 * NOTIFY is fire-and-forget: anything that happens while the server's listener
 * is disconnected is lost, and this RDS resets that connection regularly
 * (ECONNRESET in the backend log). So the push is the fast path, not the
 * guarantee — this poll is what makes an update certain to arrive.
 *
 * It reads pending-counts, which is two COUNT(*)s, and only triggers a real
 * refetch when a number actually moved.
 */
const POLL_MS = 5_000;

export function useLiveEvents(options: {
  /**
   * Which queue's changes matter here. Omit to react to any.
   *
   * A settlement updates its row more than once, and the admin panel may be
   * working through a batch, so an unfiltered page would refetch repeatedly for
   * changes it is not even showing.
   */
  queue?: LiveQueue;
  /**
   * Watch the client directory instead of a queue — a player added, removed or
   * edited, wherever that happened.
   */
  clients?: boolean;
  /** Off while a modal is open, so the rows cannot move under a decision. */
  enabled?: boolean;
} = {}): number {
  const { queue, clients = false, enabled = true } = options;
  const [tick, setTick] = useState(0);
  const timer = useRef<number | null>(null);
  /** Last pending-counts seen, so the poll only acts on a real change. */
  const lastCounts = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    // withCredentials, or the auth cookie is not sent cross-origin.
    const source = new EventSource(`${base}/events`, { withCredentials: true });

    const bump = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setTick((n) => n + 1), DEBOUNCE_MS);
    };

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { type?: string; queue?: string };
        if (clients) {
          if (payload.type === "clients-changed") bump();
          return;
        }
        if (payload.type !== "queue-changed") return;
        if (queue && payload.queue !== queue) return;
        bump();
      } catch {
        // A frame we cannot read is not worth tearing the stream down for.
      }
    };

    // No onerror: EventSource reconnects by itself, and logging every retry
    // would bury real errors during a deploy.

    /**
     * The safety net. Whatever the stream missed, this notices within POLL_MS.
     * Compared against the last seen counts so a quiet queue costs one cheap
     * request and no refetch at all.
     */
    /*
     * The cheapest thing that reveals a change on whatever this caller watches:
     * two COUNT(*)s for the queues, and the directory's own total for clients
     * (limit=1, so one row comes back with it).
     */
    const url = clients
      ? `${base}/end-users?limit=1`
      : `${base}/admin/deposit-withdrawal/pending-counts`;

    const check = () =>
      fetch(url, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => {
          const signature = clients
            ? // getEndUsers puts the count in meta, not data.
              String(body?.meta?.total ?? "")
            : body?.data
              ? `${body.data.pendingDeposits}:${body.data.pendingWithdrawals}`
              : "";
          if (!signature) return;
          const changed = lastCounts.current !== null && lastCounts.current !== signature;
          lastCounts.current = signature;
          if (changed) bump();
        })
        .catch(() => undefined);

    // Baseline immediately, not on the first tick. Recording it a tick late
    // meant a change made just after the page loaded went unnoticed for two
    // intervals — long enough to look broken and be dismissed.
    void check();
    const poll = window.setInterval(() => void check(), POLL_MS);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      window.clearInterval(poll);
      source.close();
    };
  }, [queue, clients, enabled]);

  return tick;
}
