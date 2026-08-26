"use client";

import { useEffect, useMemo, useState } from "react";

import {
  formatDwDate,
  formatRupees,
  getSourceLabel,
  workingDwApi,
  type DwPendingCounts,
  type DwRequest,
  type DwTab,
} from "@/lib/working-dw";
import { SAMPLE_DW_REQUESTS } from "@/lib/sample-data";
import { DW_HERO_MASK, DW_TABLE_MASK } from "./icon-masks";
import styles from "./WorkingDw.module.css";

/*
 * Stage pill colours, from the component's own `stagePill*` bindings — the pill
 * carries a solid fill rather than the page's card token, so it did not inherit
 * anything usable in dark. Geometry is left as it was.
 *
 * `border-[#9DBFBE] border-[#34a853]` is the reference's own pair, kept in the
 * same order so the same one wins here as there.
 */
const STAGE_PILL =
  "inline-flex min-h-[26px] min-w-[112px] items-center justify-center gap-1 rounded-full " +
  "border border-solid px-3 py-[3px] text-[12.5px] font-medium leading-none whitespace-nowrap " +
  "border-[#9DBFBE] border-[#34a853] bg-[#B2CCCB] " +
  "dark:border-[#0062AD] dark:border-[#34a853] dark:bg-[#0B3A63]";
const STAGE_INK = "text-[#214055] dark:text-[#BDE1FF]";
const STAGE_ACTION =
  "cursor-pointer transition-colors hover:bg-[#A3C1C0] dark:hover:bg-[#0E4A80]";
const STAGE_LOCKED = "cursor-not-allowed opacity-60";

const TAB_BASE =
  "inline-flex items-center gap-2 rounded-[0.4rem] border border-solid px-4 py-2.5 " +
  "text-[14px] font-semibold leading-none transition-colors";

const TAB_ON =
  "border-[#5E93A6] bg-[#B2CCCB]/70 text-[#085A86] " +
  "dark:border-[#0091ff]/70 dark:bg-[#0091ff33] dark:text-[#D8EEFF]";

const TAB_OFF =
  "border-[#9FC3CE] bg-[#67a5ad1a] text-[#085A86] hover:border-[#5E93A6] " +
  "dark:border-[#0062AD] dark:bg-[#0091ff14] dark:text-[#9ED4FF]/80 dark:hover:border-[#0091ff]/70";

const BADGE =
  "inline-grid h-[18px] min-w-[18px] place-items-center rounded-full px-1.5 " +
  "text-[10px] font-bold leading-none tabular-nums";

function MaskIcon({
  mask,
  className,
}: {
  mask: string;
  className: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={styles.maskIcon + " " + className}
      style={{
        WebkitMaskImage: `url("${mask}")`,
        maskImage: `url("${mask}")`,
      }}
    />
  );
}

export function WorkingDwPage() {
  const [mainTab, setMainTab] = useState<DwTab>("deposit");
  const [searchTerm, setSearchTerm] = useState("");
  const [loaded, setLoaded] = useState<{ tab: DwTab; rows: DwRequest[] } | null>(null);
  const [counts, setCounts] = useState<DwPendingCounts>({
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  });

  // The rows carry the tab they belong to, so "loading" is a comparison at
  // render time rather than a flag the effect has to set synchronously.
  useEffect(() => {
    let cancelled = false;

    workingDwApi
      .getQueue(mainTab)
      .then((res) => {
        if (cancelled) return;
        setLoaded({ tab: mainTab, rows: res.data?.length ? res.data : SAMPLE_DW_REQUESTS });
      })
      // Until CRMBackend serves this route, fall back to placeholder rows so
      // the layout is reviewable rather than blank.
      .catch(() => {
        if (!cancelled) setLoaded({ tab: mainTab, rows: SAMPLE_DW_REQUESTS });
      });

    return () => {
      cancelled = true;
    };
  }, [mainTab]);

  const isLoading = loaded?.tab !== mainTab;
  // Memoised so the empty-array branch does not produce a new identity each
  // render and re-run the filter below.
  const requests = useMemo(
    () => (loaded?.tab === mainTab ? loaded.rows : []),
    [loaded, mainTab],
  );

  useEffect(() => {
    let cancelled = false;

    workingDwApi
      .getPendingCounts()
      .then((res) => {
        if (!cancelled && res.data) setCounts(res.data);
      })
      .catch(() => {
        if (!cancelled) setCounts({ pendingDeposits: 11, pendingWithdrawals: 3 });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const isFiltered = searchTerm.trim().length > 0;

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((request) =>
      [request.username, request.master, request.utrNumber]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [requests, searchTerm]);

  const isDeposit = mainTab !== "withdrawal";
  const pageTitle = isDeposit ? "Deposit Dashboard" : "Withdrawal Dashboard";

  return (
    <div className={styles.page + " flex min-h-0 w-full min-w-0 flex-1 flex-col"}>
      {/* ── top bar ──────────────────────────────────────────────────────── */}
      <header
        className={
          styles.topbar + " box-border flex flex-none items-center gap-2.5 px-3"
        }
      >
        <h2 className="m-0 me-[22px] flex-none text-[16px] leading-none font-medium whitespace-nowrap text-[var(--dw-headings)]">
          {pageTitle}
        </h2>

        <div className={styles.search + " relative min-w-0 flex-[0_1_384px]"}>
          <span
            aria-hidden="true"
            className="material-icons pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[17px] text-[var(--dw-muted)]"
          >
            search
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label={`Search ${pageTitle}`}
            placeholder="Search by user, master, or UTR..."
            autoComplete="off"
          />
          {isFiltered && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[var(--dw-muted)] hover:text-[var(--dw-headings)]"
            >
              &times;
            </button>
          )}
        </div>
      </header>

      {/*
        Shell mirrors linear-next's `content-body` recipe exactly: rounded-xl +
        border-[7px] border-transparent + bg-white/30 + a 1px ring drawn by
        box-shadow. No inner padding — the transparent border IS the gutter.
      */}
      <div
        className={
          styles.shell +
          " relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border-[7px] border-transparent bg-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.5)] dark:bg-[#0091ff0d] dark:shadow-[0_0_0_1px_rgb(0,145,255,0.15)]"
        }
      >
        {/* ── hero ───────────────────────────────────────────────────────── */}
        <header className="mb-2 flex flex-none flex-wrap items-center justify-between gap-4 rounded-xl bg-[var(--dw-card)] px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <MaskIcon
              mask={DW_HERO_MASK}
              className="h-[20px] w-[20px] shrink-0 text-headings dark:text-[#BDE1FF]"
            />
            <div className="min-w-0">
              <h1 className="m-0 text-[19px] leading-[1.2] font-semibold text-[var(--dw-headings)]">
                Operations Dashboard
              </h1>
              <p className="mt-1 mb-0 text-[13px] leading-[1.4] text-[var(--dw-muted)]">
                Manual &amp; self deposit / withdrawal — banker verifies before approval
              </p>
            </div>
          </div>

          <div className="flex flex-none flex-wrap gap-2.5">
            <div className="flex min-w-[132px] flex-col items-center gap-0.5 rounded-[5px] border border-[var(--dw-border-soft)] bg-[var(--dw-accent-tint)] px-4 py-[7px]">
              <span className="text-[10px] font-medium tracking-[0.06em] whitespace-nowrap text-[var(--dw-sec)] uppercase">
                Pending Deposits
              </span>
              <span className="text-[22px] leading-[1.1] font-bold text-[var(--dw-sec)] tabular-nums">
                {counts.pendingDeposits || 0}
              </span>
            </div>
            <div className="flex min-w-[132px] flex-col items-center gap-0.5 rounded-[5px] border border-[var(--dw-border-soft)] bg-[var(--dw-accent-tint)] px-4 py-[7px]">
              <span className="text-[10px] font-medium tracking-[0.06em] whitespace-nowrap text-[var(--dw-sec)] uppercase">
                Pending Withdrawals
              </span>
              <span className="text-[22px] leading-[1.1] font-bold text-[var(--dw-sec)] tabular-nums">
                {counts.pendingWithdrawals || 0}
              </span>
            </div>
          </div>
        </header>

        {/* ── tabs ───────────────────────────────────────────────────────── */}
        <div
          className="mb-2.5 flex flex-wrap items-center gap-2.5 rounded-xl bg-white/50 px-4 py-3.5 dark:bg-[#0091ff1a]"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isDeposit}
            onClick={() => setMainTab("deposit")}
            className={TAB_BASE + " " + (isDeposit ? TAB_ON : TAB_OFF)}
          >
            Deposit Dashboard
            {counts.pendingDeposits > 0 && (
              <span
                className={
                  BADGE +
                  " " +
                  (isDeposit
                    ? "bg-[#ef4444] text-white"
                    : "bg-[#538EA1]/85 text-white dark:bg-[#0062AD] dark:text-[#D8EEFF]")
                }
              >
                {counts.pendingDeposits}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!isDeposit}
            onClick={() => setMainTab("withdrawal")}
            className={TAB_BASE + " " + (!isDeposit ? TAB_ON : TAB_OFF)}
          >
            Withdrawal Dashboard
            {counts.pendingWithdrawals > 0 && (
              <span
                className={
                  BADGE +
                  " " +
                  (!isDeposit
                    ? "bg-[#ef4444] text-white"
                    : "bg-[#538EA1]/85 text-white dark:bg-[#0062AD] dark:text-[#D8EEFF]")
                }
              >
                {counts.pendingWithdrawals}
              </span>
            )}
          </button>
        </div>

        {/* ── queue ──────────────────────────────────────────────────────── */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] bg-[var(--dw-card)]">
          <div className="flex flex-none items-center gap-2.5 px-3.5 pt-3.5 pb-3">
            <span className="mx-[5px] grid h-8 w-8 flex-none place-items-center rounded-lg bg-[var(--dw-accent-tint-strong)] text-[var(--dw-headings)]">
              <MaskIcon mask={DW_TABLE_MASK} className="h-5 w-5" />
            </span>
            <span className="text-[15px] font-semibold text-[var(--dw-headings)]">
              {isDeposit ? "Deposit Statement" : "Withdrawal Statement"}
            </span>
          </div>

          {isLoading && (
            <div className="px-4 py-10 text-center text-[13px] text-[var(--dw-muted)]">
              Loading…
            </div>
          )}

          {!isLoading && requests.length === 0 && (
            <div className="px-4 py-10 text-center text-[13px] text-[var(--dw-muted)]">
              No requests in this queue
            </div>
          )}

          {!isLoading && requests.length > 0 && filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-[13px] text-[var(--dw-muted)]">
              No requests match this search
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="relative flex min-h-0 min-w-0 flex-1">
              <div
                className={
                  styles.tableScroll +
                  " min-h-0 min-w-0 flex-1 overflow-auto px-2.5 pt-1.5 pb-6"
                }
              >
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.colAssigned}>Assigned</th>
                      <th className={styles.colUser}>User</th>
                      <th className={styles.colMaster}>Master</th>
                      <th className={styles.colPlatform}>Platform</th>
                      <th className={styles.colCategory}>Category</th>
                      <th className={styles.colSource}>Source</th>
                      <th className={styles.colAmount}>Amount</th>
                      {isDeposit && <th className={styles.colBonus}>Bonus</th>}
                      {isDeposit && <th className={styles.colTotal}>Total</th>}
                      <th className={styles.colBank}>Payment Mode</th>
                      <th className={styles.colUtr}>UTR</th>
                      {isDeposit && <th className={styles.colReceipt}>Receipt</th>}
                      <th className={styles.colCreated}>Created</th>
                      <th className={styles.colBy}>By</th>
                      <th className={styles.colBanker}>Banker</th>
                      <th className={styles.colAdmin}>Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((request, index) => (
                      <tr
                        key={request.id}
                        className={index % 2 === 0 ? styles.rowAlt : undefined}
                      >
                        <td className={styles.colAssigned}>
                          {/*
                            Column, not row: your own name sits directly under
                            your own toggle, while a teammate's name takes the
                            toggle's place, so the cell keeps its width either way.
                          */}
                          <div className="inline-flex flex-col items-start gap-[3px]">
                            {!request.assignedToUserName && (
                              <label className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border border-[#29738c] bg-[#29738c]/[0.12] transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] dark:border-[#bde1ff] dark:bg-[#bde1ff]/[0.12]">
                                <input type="checkbox" className="peer sr-only" />
                                <span className="pointer-events-none ml-[2px] h-3.5 w-3.5 rounded-full bg-[#29738c] shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] peer-checked:translate-x-[20px] peer-checked:bg-white dark:bg-[#bde1ff] dark:peer-checked:bg-white" />
                              </label>
                            )}
                            {request.assignedToUserName && (
                              <span className="text-[11px] font-semibold text-headings dark:text-[#BDE1FF]">
                                {request.assignedToUserName}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className={styles.colUser + " " + styles.isStrong}>
                          {request.username}
                        </td>
                        <td className={styles.colMaster}>{request.master || "—"}</td>
                        <td className={styles.colPlatform}>{request.platform || "—"}</td>
                        <td className={styles.colCategory}>{request.category || "—"}</td>
                        <td className={styles.colSource}>
                          {getSourceLabel(request.sourceType)}
                        </td>

                        <td className={styles.colAmount}>
                          <span className={styles.capsule + " " + styles.capsuleAmount}>
                            {formatRupees(request.amount)}
                          </span>
                        </td>

                        {isDeposit && (
                          <td className={styles.colBonus}>
                            {request.bonusEligible
                              ? `${request.bonusPlanName} (+${formatRupees(request.bonusAmount)})`
                              : "—"}
                          </td>
                        )}

                        {isDeposit && (
                          <td className={styles.colTotal}>
                            <span className={styles.capsule + " " + styles.capsuleTotal}>
                              {formatRupees(request.totalAmount ?? request.amount)}
                            </span>
                          </td>
                        )}

                        <td className={styles.colBank}>{request.paymentMode || "—"}</td>

                        <td className={styles.colUtr}>
                          <span className={styles.capsule + " " + styles.capsuleUtr}>
                            {request.utrNumber || "—"}
                          </span>
                        </td>

                        {isDeposit && (
                          <td className={styles.colReceipt}>
                            {request.receiptUrl ? (
                              <button
                                type="button"
                                title="View receipt"
                                className="inline-flex cursor-pointer items-center justify-center border-none bg-transparent p-0"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={request.receiptUrl}
                                  alt="Receipt"
                                  className="h-8 w-8 rounded object-cover"
                                />
                              </button>
                            ) : (
                              "—"
                            )}
                          </td>
                        )}

                        <td className={styles.colCreated}>
                          {formatDwDate(request.createdAt)}
                        </td>
                        <td className={styles.colBy}>{request.requestedBy || "—"}</td>

                        <td className={styles.colBanker}>
                          <button
                            type="button"
                            className={
                              STAGE_PILL + " " + STAGE_INK + " " + STAGE_ACTION
                            }
                          >
                            <span>
                              {request.status === "PROCESSING" ? "Processing" : "Pending"}
                            </span>
                            <span
                              aria-hidden="true"
                              className="material-icons text-[17px] leading-none opacity-60"
                            >
                              expand_more
                            </span>
                          </button>
                        </td>

                        {/* Admin sign-off only applies to root ("dummy") platform
                            requests; every normal request shows a dash. */}
                        <td className={styles.colAdmin}>
                          {request.isDummyRequest ? (
                            <span
                              className={
                                STAGE_PILL + " " + STAGE_INK + " " + STAGE_LOCKED
                              }
                              title="Waiting for the banker to verify first"
                            >
                              Pending
                            </span>
                          ) : (
                            <span className="text-[12px] text-[#9BB4C7] dark:text-[#4E8DC1]">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
