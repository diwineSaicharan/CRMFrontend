"use client";

import type { ClientTransaction } from "@/lib/clients";
import { formatIndianCurrency } from "./client-directory.config";

/** DEBIT for withdrawals; deposits and bonuses both credit the wallet. */
function isDebit(row: ClientTransaction): boolean {
  return row.type === "WITHDRAWAL";
}

function directionLabel(row: ClientTransaction): string {
  return row.type === "BONUS" ? "BONUS" : isDebit(row) ? "DEBIT" : "CREDIT";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", { hour12: false });
}

/** `paymentMode` arrives screaming-snake from the API. */
function formatPaymentMode(mode?: string | null): string {
  return mode ? mode.replace(/_/g, " ") : "-";
}

function partyText(row: ClientTransaction): string {
  if (!row.partyUsername) return "-";
  const label = `${row.partyPrefix || "To"}: ${row.partyUsername}`;
  return row.partyRole ? `${label} (${row.partyRole})` : label;
}

const CSV_COLUMNS: Array<[string, (row: ClientTransaction) => string]> = [
  ["Date", (row) => `${formatDate(row.createdAt)} ${formatTime(row.createdAt)}`.trim()],
  ["Debit / Credit", directionLabel],
  ["Amount", (row) => String(row.amount ?? 0)],
  ["To / From", partyText],
  ["Payment Mode", (row) => formatPaymentMode(row.paymentMode)],
  ["UTR", (row) => row.utrNumber || "-"],
];

/** Quotes every field, so a comma inside a username cannot shift a column. */
function toCsvCell(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"';
}

const HEADER_ICON =
  "flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-[10px] " +
  "bg-accent/10 text-headings dark:bg-white/10 dark:text-[#bde1ff]";

/* `.transaction-export-btn`, with the dark rule's blue-tinted variant. */
const EXPORT_BTN =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] " +
  "border border-[#c5d4d3] bg-accent/10 px-3.5 text-sm font-medium leading-none text-headings " +
  "whitespace-nowrap transition-colors hover:border-[#9cb4b2] hover:bg-accent/[0.16] " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "dark:border-[rgba(0,145,255,0.25)] dark:bg-[rgba(0,145,255,0.05)] dark:text-[#9ED4FF] " +
  "dark:hover:border-[rgba(0,145,255,0.4)] dark:hover:bg-[rgba(0,145,255,0.1)]";

const TH =
  "whitespace-nowrap px-5 text-left text-[11px] font-semibold uppercase text-headings " +
  "dark:border-b dark:border-white/8 dark:text-[#4D83B3]";

const TD = "px-4 py-3 align-top text-xs text-[#374151] dark:text-[#bde1ff]";

export function ClientTransactions({
  transactions,
  username,
  loading,
}: {
  transactions: ClientTransaction[];
  username: string;
  loading?: boolean;
}) {
  const exportCsv = () => {
    if (transactions.length === 0) return;

    const csv = [
      CSV_COLUMNS.map(([header]) => toCsvCell(header)).join(","),
      ...transactions.map((row) =>
        CSV_COLUMNS.map(([, read]) => toCsvCell(read(row))).join(","),
      ),
    ].join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions_${username || "user"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-transparent shadow-sm dark:border-white/8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4 dark:border-[rgba(0,145,255,0.18)]">
        <div className="flex items-center gap-3">
          <div className={HEADER_ICON}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect width="18" height="18" x="3" y="4" rx="2" />
              <path d="M3 10h18" />
              <path d="M8 14h.01" />
              <path d="M12 14h.01" />
              <path d="M16 14h.01" />
              <path d="M8 18h.01" />
              <path d="M12 18h.01" />
              <path d="M16 18h.01" />
            </svg>
          </div>
          {/* `.transaction-history-card h3` lifts to #D8EEFF in dark. */}
          <h3 className="m-0 text-[15px] font-medium text-headings dark:text-[#D8EEFF]">
            Transaction History
          </h3>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={transactions.length === 0}
          className={EXPORT_BTN}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 15V3" />
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      <div className="p-5">
        {loading && (
          <p className="py-16 text-center text-xs text-muted dark:text-[#4e8dc1]">
            Loading transactions…
          </p>
        )}

        {!loading && transactions.length > 0 && (
          <div className="max-w-full overflow-x-auto rounded-lg border border-[#d8e4e3] bg-transparent dark:rounded-xl dark:border-white/8 dark:bg-[rgba(2,51,94,0.3)]">
            <table className="w-full min-w-[720px]">
              <thead className="h-[38px] bg-[#b2cccb] dark:bg-white/[0.03]">
                <tr>
                  <th className={TH}>Date</th>
                  <th className={TH}>Debit / Credit</th>
                  <th className={TH}>Amount</th>
                  <th className={TH}>To / From</th>
                  <th className={TH}>Payment Mode</th>
                  <th className={TH}>UTR</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row) => {
                  const debit = isDebit(row);
                  /* The dark reference tints these badges; light keeps the same
                     pill so the column does not change shape between themes. */
                  const tone = debit
                    ? "bg-red-500/10 text-red-600 dark:bg-[rgba(255,0,0,0.12)] dark:text-[#FF4D4F]"
                    : "bg-emerald-500/10 text-green-600 dark:bg-[rgba(0,210,106,0.12)] dark:text-[#00D26A]";

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 hover:bg-white/35 dark:border-white/5 dark:hover:bg-white/[0.02]"
                    >
                      <td className={TD}>
                        <div>{formatDate(row.createdAt)}</div>
                        <div className="mt-0.5 text-[10px] text-[#9ca3af] dark:text-[rgba(158,212,255,0.55)]">
                          {formatTime(row.createdAt)}
                        </div>
                      </td>
                      <td className={TD}>
                        <span
                          className={
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold " +
                            tone
                          }
                        >
                          {directionLabel(row)}
                        </span>
                      </td>
                      <td className={TD}>
                        <span
                          className={
                            "text-xs font-semibold whitespace-nowrap " +
                            (debit
                              ? "text-red-600 dark:text-[#FF4D4F]"
                              : "text-green-600 dark:text-[#00D26A]")
                          }
                        >
                          {formatIndianCurrency(row.amount)}
                        </span>
                      </td>
                      <td className={TD}>
                        {row.partyUsername ? (
                          <>
                            {row.partyPrefix || "To"}: {row.partyUsername}
                            {row.partyRole && (
                              <>
                                <br />
                                <span className="font-semibold">({row.partyRole})</span>
                              </>
                            )}
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className={TD}>{formatPaymentMode(row.paymentMode)}</td>
                      <td
                        className={TD + " text-gray-500 dark:text-[rgba(158,212,255,0.55)]"}
                      >
                        {row.utrNumber || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5">
              <span className="material-icons text-[28px] text-gray-400 dark:text-[#4e8dc1]">
                receipt_long
              </span>
            </div>
            <h4 className="mt-4 text-base font-semibold text-gray-700 dark:text-[#bde1ff]">
              No Transactions
            </h4>
            <p className="mt-1 text-[13px] text-gray-400 dark:text-[#4e8dc1]">
              No transaction history found for this period
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
