"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { HeaderSlot } from "@/components/layout/HeaderSlot";
import { useLiveEvents } from "@/lib/use-live-events";
import { getAllPlatforms, type Platform } from "@/lib/platforms";
import {
  completedTransactionsApi,
  type CompletedPagination,
  type CompletedTab,
  type CompletedTransaction,
} from "@/lib/completed-transactions";
import { formatDwDate, formatRupees } from "@/lib/working-dw";
import styles from "./CompletedTransactions.module.css";

/**
 * Every settled deposit and withdrawal, across both kinds of user.
 *
 * Ported from diwine_admin_ui's completed-transactions component: same tabs,
 * same filters, same nine columns. Filtering and paging happen on the server —
 * this is the whole settled history, not a page's worth of rows to sift in the
 * browser — so every control writes to the URL and the URL drives the fetch.
 */

const TABS: Array<{ key: CompletedTab; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "DEPOSIT", label: "Deposits" },
  { key: "WITHDRAWAL", label: "Withdrawals" },
];

const PAGE_SIZE = 25;

export function CompletedTransactionsPage() {
  const searchParams = useSearchParams();

  const tab = (searchParams.get("type") as CompletedTab) || "ALL";
  const search = searchParams.get("q") ?? "";
  const platformId = searchParams.get("platform") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  // A settlement in either panel adds a row here, so this list reacts to both
  // queues rather than one.
  const liveTick = useLiveEvents();

  /**
   * The result carries the filters it was fetched for, so "loading" is a
   * comparison at render time rather than a flag an effect has to set — the
   * same shape WorkingDwPage uses, and it keeps setState out of the effect.
   */
  const requestKey = JSON.stringify({ tab, search, platformId, page, reloadKey, liveTick });
  const [loaded, setLoaded] = useState<{
    key: string;
    rows: CompletedTransaction[];
    pagination: CompletedPagination | null;
    error: string | null;
  } | null>(null);

  const loading = loaded?.key !== requestKey;
  const rows = loaded?.key === requestKey ? loaded.rows : [];
  const pagination = loaded?.key === requestKey ? loaded.pagination : null;
  const error = loaded?.key === requestKey ? loaded.error : null;

  /**
   * Every control writes here. replaceState rather than a route push: typing
   * must not add a history entry per keystroke, and a route change would
   * remount this page on every character.
   */
  const setParam = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Any filter change invalidates the page number.
    if (!("page" in patch)) next.delete("page");
    const query = next.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${window.location.pathname}?${query}` : window.location.pathname,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAllPlatforms(true)
      .then((list) => {
        if (!cancelled) setPlatforms(list);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    completedTransactionsApi
      .list({ type: tab, search, platformId, page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setLoaded({
          key: requestKey,
          rows: res.data ?? [],
          pagination: res.pagination ?? null,
          error: null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLoaded({
          key: requestKey,
          rows: [],
          pagination: null,
          error: "Could not load completed transactions.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [tab, search, platformId, page, reloadKey, liveTick, requestKey]);

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  const platformOptions = useMemo(
    () => platforms.map((p) => ({ id: p.id, name: p.name })),
    [platforms],
  );

  return (
    <div className={styles.page + " flex min-h-0 w-full min-w-0 flex-1 flex-col"}>
      <HeaderSlot>
        <div className={styles.page + " flex w-full min-w-0 items-center gap-2.5"}>
          <h2 className="m-0 me-[22px] flex-none text-[16px] leading-none font-medium whitespace-nowrap text-[var(--ct-headings)]">
            Completed Transactions
          </h2>

          <div className={styles.search + " relative min-w-0 flex-[0_1_384px]"}>
            <span
              aria-hidden="true"
              className="material-icons pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[17px] text-[var(--ct-muted)]"
            >
              search
            </span>
            <input
              type="search"
              defaultValue={search}
              onChange={(event) => setParam({ q: event.target.value || null })}
              aria-label="Search completed transactions"
              placeholder="Search username, UTR or transaction id"
              autoComplete="off"
            />
          </div>
        </div>
      </HeaderSlot>

      <div className="mt-0.5 flex min-h-0 flex-auto flex-col overflow-hidden rounded-xl border-[7px] border-transparent bg-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.5)] dark:bg-[#0091ff0d] dark:shadow-[0_0_0_1px_rgb(0,145,255,0.15)]">
        {/* ── heading strip ─────────────────────────────────────────────── */}
        <div className="mb-3 flex flex-wrap items-start justify-between gap-4 rounded-xl bg-white/50 px-5 py-4 dark:bg-white/5">
          <div className="flex items-start gap-3">
            <span className="material-icons rounded-lg bg-[#B2CCCB40] p-2 text-[#214055] dark:text-[#9ED4FF]">
              receipt_long
            </span>
            <div>
              <h1 className="m-0 text-xl font-semibold text-[#214055] dark:text-[#D8EEFF]">
                All Completed Transactions
              </h1>
              <p className="m-0 mt-1 text-sm text-[#6a95b9] dark:text-[#9ED4FF]/80">
                Settled deposits &amp; withdrawals across every platform
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] tracking-wide text-[#6a95b9] dark:text-[#9ED4FF]/70">
              TOTAL
            </div>
            <div className="text-xl font-semibold text-[#214055] tabular-nums dark:text-[#D8EEFF]">
              {total.toLocaleString()}
            </div>
          </div>
        </div>

        {/* ── tabs and filters ──────────────────────────────────────────── */}
        <div className="mb-3 flex flex-wrap items-center gap-2 px-2">
          <div role="tablist" aria-label="Transaction type" className="flex gap-1">
            {TABS.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() =>
                    setParam({ type: item.key === "ALL" ? null : item.key })
                  }
                  className={
                    "cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors " +
                    (active
                      ? "border-[#34a853] bg-[#B2CCCB] text-[#214055] dark:border-[#34a853] dark:bg-[#0B3A63] dark:text-[#D8EEFF]"
                      : "border-[#9DBFBE] bg-transparent text-[#6a95b9] hover:bg-white/40 dark:border-[#0062AD] dark:text-[#9ED4FF]/80 dark:hover:bg-[#0E4A80]")
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <select
            value={platformId}
            onChange={(event) => setParam({ platform: event.target.value || null })}
            aria-label="Platform"
            className="rounded-md border border-[#c7d9e6] bg-white px-2 py-1.5 text-[13px] text-[#214055] dark:border-[#3a5f79] dark:bg-[#0f2230] dark:text-[#d7ecff]"
          >
            <option value="">All Platforms</option>
            {platformOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setReloadKey((n) => n + 1)}
            title="Refresh"
            aria-label="Refresh"
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-md border border-[#9DBFBE] text-[#214055] hover:bg-white/40 dark:border-[#0062AD] dark:text-[#9ED4FF] dark:hover:bg-[#0E4A80]"
          >
            <span className="material-icons text-[18px]">refresh</span>
          </button>
        </div>

        {/* ── states and table ──────────────────────────────────────────── */}
        {error && (
          <p className="px-5 py-6 text-center text-sm text-[#c5221f] dark:text-[#ff8a80]">
            {error}
          </p>
        )}
        {!error && loading && (
          <p className="px-5 py-6 text-center text-sm text-[var(--ct-muted)]">Loading…</p>
        )}
        {!error && !loading && rows.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-[var(--ct-muted)]">
            No completed transactions found.
          </p>
        )}

        {!error && !loading && rows.length > 0 && (
          <div className={styles.tableWrap + " min-h-0 flex-auto overflow-auto px-2"}>
            <table className={styles.table + " w-full border-collapse text-[13px]"}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>User</th>
                  <th>Platform</th>
                  <th>UTR</th>
                  <th className="text-right">Amount</th>
                  <th>Payment Mode</th>
                  <th>Settled By</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const deposit = row.type === "DEPOSIT";
                  return (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap">{formatDwDate(row.settledAt)}</td>
                      <td>
                        <span
                          className={
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold " +
                            (deposit
                              ? "bg-[#00a87826] text-[#00845e] dark:text-[#4ade80]"
                              : "bg-[#ff3b3026] text-[#b91c1c] dark:text-[#ff8a80]")
                          }
                        >
                          {row.type}
                        </span>
                      </td>
                      <td>
                        {row.username || "—"}
                        {row.isDummyRequest && (
                          <span
                            title="Root (dummy) platform user"
                            className="ms-1.5 rounded bg-[#B2CCCB] px-1 py-px text-[10px] font-semibold text-[#214055] dark:bg-[#0B3A63] dark:text-[#9ED4FF]"
                          >
                            root
                          </span>
                        )}
                      </td>
                      <td>{row.platform || "—"}</td>
                      <td>{row.utrNumber || "—"}</td>
                      <td
                        className={
                          "text-right font-medium tabular-nums " +
                          (deposit
                            ? "text-[#00845e] dark:text-[#4ade80]"
                            : "text-[#b91c1c] dark:text-[#ff8a80]")
                        }
                      >
                        {formatRupees(row.amount)}
                      </td>
                      <td>{row.paymentMode || "—"}</td>
                      <td>{row.settledBy || "—"}</td>
                      <td className="max-w-[280px] truncate" title={row.remarks || row.description || ""}>
                        {row.remarks || row.description || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── pager ─────────────────────────────────────────────────────── */}
        {!error && !loading && rows.length > 0 && (
          <div className="flex flex-none items-center justify-center gap-4 px-5 py-3 text-[13px] text-[var(--ct-headings)]">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setParam({ page: String(page - 1) })}
              className="cursor-pointer rounded-md border border-[#9DBFBE] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#0062AD]"
            >
              Previous
            </button>
            <span className="tabular-nums">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setParam({ page: String(page + 1) })}
              className="cursor-pointer rounded-md border border-[#9DBFBE] px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#0062AD]"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
