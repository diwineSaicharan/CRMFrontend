"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { dwApi, type OperationBank } from "@/lib/deposit-withdrawal";
import {
  formatDwDate,
  formatRupees,
  getRequestedByLabel,
  getSourceLabel,
  type DwRequest,
} from "@/lib/working-dw";
import type { DwStage } from "./DwActionMenu";

/**
 * Banker Verification / Admin Approval / Reject Request.
 *
 * Ported from diwine_admin_ui's verify modal: one dialog with a mode
 * (verify | reject) and a stage (banker | admin), the same detail grid to
 * review before deciding, and the same collection block.
 *
 * That block is deliberately narrow — withdrawals at the banker stage only.
 * A deposit already carries the UTR and receipt it was raised with, so there is
 * nothing to collect and the modal is a review; the admin stage is the final
 * sign-off on details the banker already supplied. The reference does exactly
 * this, and its validation is reproduced below rather than approximated.
 */

export type DwMode = "verify" | "reject";

/** Indexable, because the API client takes a plain record body. */
export interface DwVerifySubmit extends Record<string, unknown> {
  remarks?: string;
  utrNumber?: string;
  bankId?: string;
  receiptImage?: string;
}

const FIELD =
  "w-full rounded-[0.35rem] border border-[#9DBFBE] bg-white px-2.5 py-1.5 text-[13px] " +
  "text-[#214055] outline-none focus:border-[#0e7c5a] " +
  "dark:border-[#0062AD] dark:bg-[#08294A] dark:text-[#BDE1FF]";

const LABEL =
  "mb-1 block text-[10.5px] font-semibold tracking-wide text-[#6a95b9] uppercase dark:text-[#9ED4FF]/70";

const HINT = "mt-1 text-[11.5px] text-[#6a95b9] dark:text-[#9ED4FF]/70";
const HINT_REQUIRED = "mt-1 text-[11.5px] text-[#c5221f] dark:text-[#ff8a80]";

/** One read-only cell of the review grid. */
function Detail({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div
      className={
        "rounded-[0.4rem] bg-[#F2F7F7] px-2.5 py-2 dark:bg-[#0B3A63]/60 " +
        (full ? "sm:col-span-3" : "")
      }
    >
      <div className={LABEL}>{label}</div>
      <div
        className={
          "text-[13px] font-semibold text-[#214055] dark:text-[#D8EEFF] " +
          (mono ? "font-mono" : "")
        }
      >
        {value}
      </div>
    </div>
  );
}

export function DwVerifyModal({
  mode,
  stage,
  request,
  busy,
  error,
  onError,
  onCancel,
  onSubmit,
}: {
  mode: DwMode;
  stage: DwStage;
  request: DwRequest;
  busy: boolean;
  error: string | null;
  onError: (message: string | null) => void;
  onCancel: () => void;
  onSubmit: (payload: DwVerifySubmit) => void;
}) {
  const isWithdrawal = String(request.type ?? "").toUpperCase() === "WITHDRAWAL";
  const rejecting = mode === "reject";
  /** Only a banker verifying a withdrawal supplies anything. */
  const collects = isWithdrawal && !rejecting && stage === "banker";

  const [reason, setReason] = useState("");
  const [utr, setUtr] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [banks, setBanks] = useState<OperationBank[]>([]);
  const [bankQuery, setBankQuery] = useState("");
  const [bank, setBank] = useState<OperationBank | null>(null);
  const [bankListOpen, setBankListOpen] = useState(false);
  const bankBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!collects) return;
    let cancelled = false;
    dwApi
      .getBanks()
      .then((res) => {
        if (!cancelled) setBanks(res.data ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [collects]);

  useEffect(() => {
    if (!bankListOpen) return;
    const onDown = (event: MouseEvent) => {
      if (bankBoxRef.current && !bankBoxRef.current.contains(event.target as Node)) {
        setBankListOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [bankListOpen]);

  const filteredBanks = useMemo(() => {
    const term = bankQuery.trim().toLowerCase();
    if (!term) return banks;
    return banks.filter((b) =>
      [b.bankName, b.accountNumber, b.ifscCode].filter(Boolean).some((field) =>
        String(field).toLowerCase().includes(term),
      ),
    );
  }, [banks, bankQuery]);

  const title = rejecting
    ? "Reject Request"
    : stage === "admin"
      ? "Admin Approval"
      : "Banker Verification";

  const intro = rejecting
    ? "Review all details below and enter the rejection reason."
    : stage === "admin"
      ? "Verified by the banker. Review the details and click Verify to give the final admin approval."
      : "Review all details below. Click Verify if everything is correct.";

  const onReceiptChosen = (file: File | null) => {
    if (!file) {
      setReceipt(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReceipt(String(reader.result));
    reader.readAsDataURL(file);
  };

  /** The reference's checks, in the reference's order. */
  const submit = () => {
    onError(null);

    if (rejecting) {
      if (!reason.trim()) {
        onError("Please enter the rejection reason");
        return;
      }
      onSubmit({ remarks: reason.trim() });
      return;
    }

    if (!collects) {
      onSubmit({});
      return;
    }

    if (!bank) {
      onError("Please select the bank");
      return;
    }
    if (!utr.trim()) {
      onError("Please provide UTR");
      return;
    }
    if (!/^\d+$/.test(utr.trim())) {
      onError("UTR must contain numbers only");
      return;
    }
    if (!request.receiptUrl && !receipt) {
      onError("Please upload bank transaction receipt");
      return;
    }

    onSubmit({
      utrNumber: utr.trim(),
      bankId: bank.id,
      ...(receipt ? { receiptImage: receipt } : {}),
    });
  };

  /*
   * Rendered into <body>, not where it sits in the tree.
   *
   * This dialog is mounted from a cell of the queue table, and the queue's
   * fade-up animation puts a `transform` on an ancestor — which makes that
   * ancestor the containing block for `position: fixed`. The overlay's inset-0
   * then resolved against the table wrapper rather than the viewport, so the
   * dialog sat off to one side and the dim did not cover the page. A portal
   * takes it out of that subtree for good, rather than leaving the centring at
   * the mercy of whatever CSS lands on an ancestor later.
   *
   * Guarded because document does not exist during the server render. This
   * cannot mismatch on hydration: the dialog only mounts from a click, so it
   * is never part of the server-rendered markup.
   */
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] grid place-items-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-xl border border-[#9DBFBE] bg-white text-left shadow-2xl dark:border-[#0062AD] dark:bg-[#072B4C]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-between border-b border-[#9DBFBE] px-5 py-3.5 dark:border-[#0062AD]">
          <h2 className="m-0 text-[17px] font-semibold text-[#214055] dark:text-[#D8EEFF]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-[#6a95b9] hover:bg-[#EAF3F3] dark:text-[#9ED4FF] dark:hover:bg-[#0E4A80]"
          >
            <span className="material-icons text-[18px]">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-auto overflow-y-auto px-5 py-4">
          <p className="m-0 mb-3 text-[13px] text-[#6a95b9] dark:text-[#9ED4FF]/80">{intro}</p>

          {error && (
            <div className="mb-3 rounded-[0.4rem] border border-[#c5221f]/40 bg-[#c5221f]/10 px-3 py-2 text-[12.5px] text-[#c5221f] dark:text-[#ff8a80]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Detail label="Type" value={String(request.type ?? "—")} />
            <Detail label="User" value={request.username || "—"} />
            <Detail label="Mobile" value={request.mobile || "—"} />
            <Detail label="Category" value={request.category || "—"} />
            <Detail label="Source" value={getSourceLabel(request.sourceType)} />
            <Detail label="Platform" value={request.platform || "—"} />
            <Detail label="Amount" value={formatRupees(request.amount)} />

            {!isWithdrawal && (
              <>
                <Detail
                  label="Bonus"
                  value={
                    request.bonusEligible
                      ? `${request.bonusPlanName ?? "Bonus"} (+${formatRupees(request.bonusAmount)})`
                      : "None"
                  }
                />
                <Detail
                  label="Total Credit"
                  value={formatRupees(request.totalAmount ?? request.amount)}
                />
              </>
            )}

            <Detail label="Bank" value={request.bankName || "—"} />
            <Detail label="Account" value={request.bankAccountNumber || "—"} />
            <Detail label="IFSC / UPI" value={request.bankIfsc || "—"} />
            <Detail label="UTR" value={request.utrNumber || "—"} mono />
            <Detail label="Created" value={formatDwDate(request.createdAt)} />
            <Detail label="Created By" value={getRequestedByLabel(request)} />
          </div>

          {/* Existing receipt, for either kind. */}
          {request.receiptUrl && (
            <div className="mt-3">
              <div className={LABEL}>
                {isWithdrawal ? "Bank Transaction Receipt" : "Payment Receipt"}
              </div>
              <a href={request.receiptUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={request.receiptUrl}
                  alt="Receipt"
                  className="max-h-[220px] rounded-[0.4rem] border border-[#9DBFBE] dark:border-[#0062AD]"
                />
              </a>
            </div>
          )}

          {collects && (
            <div className="mt-3 rounded-[0.5rem] border border-[#9DBFBE] bg-[#F2F7F7] p-3 dark:border-[#0062AD] dark:bg-[#0B3A63]/50">
              <div className="mb-3">
                <label className={LABEL} htmlFor="dw-receipt">
                  Bank Transaction Receipt <span className="text-[#c5221f]">*</span>
                </label>
                <input
                  id="dw-receipt"
                  type="file"
                  accept="image/*"
                  onChange={(event) => onReceiptChosen(event.target.files?.[0] ?? null)}
                  className={FIELD}
                />
                {receipt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={receipt}
                    alt="New receipt"
                    className="mt-2 max-h-[140px] rounded-[0.4rem] border border-[#9DBFBE] dark:border-[#0062AD]"
                  />
                ) : (
                  !request.receiptUrl && (
                    <p className={HINT_REQUIRED}>
                      Upload proof of bank transfer — required to complete verification.
                    </p>
                  )
                )}
              </div>

              <div className="mb-3">
                <label className={LABEL} htmlFor="dw-utr">
                  UTR <span className="text-[#c5221f]">*</span>
                </label>
                <input
                  id="dw-utr"
                  type="text"
                  inputMode="numeric"
                  value={utr}
                  onChange={(event) => setUtr(event.target.value)}
                  placeholder="Enter UTR digits only"
                  className={FIELD}
                />
              </div>

              <div ref={bankBoxRef} className="relative">
                <label className={LABEL} htmlFor="dw-bank">
                  Ops Bank <span className="text-[#c5221f]">*</span>
                </label>
                <input
                  id="dw-bank"
                  type="text"
                  value={bankQuery}
                  onFocus={() => setBankListOpen(true)}
                  onChange={(event) => {
                    setBankQuery(event.target.value);
                    setBankListOpen(true);
                    setBank(null);
                  }}
                  placeholder="Search and select bank..."
                  autoComplete="off"
                  className={FIELD}
                />
                {bankListOpen && (
                  <div className="absolute z-10 mt-1 max-h-[190px] w-full overflow-y-auto rounded-[0.4rem] border border-[#9DBFBE] bg-white shadow-lg dark:border-[#0062AD] dark:bg-[#0B3A63]">
                    {filteredBanks.length === 0 ? (
                      <div className="px-3 py-2 text-[12.5px] text-[#6a95b9]">No banks found</div>
                    ) : (
                      filteredBanks.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-[#EAF3F3] dark:hover:bg-[#0E4A80]"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setBank(b);
                            setBankQuery(b.bankName);
                            setBankListOpen(false);
                          }}
                        >
                          <div className="text-[13px] font-medium text-[#214055] dark:text-[#D8EEFF]">
                            {b.bankName}
                          </div>
                          <div className="text-[11.5px] text-[#6a95b9] dark:text-[#9ED4FF]/70">
                            {[b.accountNumber, b.ifscCode || b.upiId]
                              .filter(Boolean)
                              .join(" • ") || "—"}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <p className={bank ? HINT : HINT_REQUIRED}>
                  {bank
                    ? `Selected: ${bank.bankName} (${bank.accountNumber || "—"})`
                    : "Type a name, then click a bank from the list (required)."}
                </p>
              </div>
            </div>
          )}

          {rejecting && (
            <div className="mt-3">
              <label className={LABEL} htmlFor="dw-reason">
                Rejection reason <span className="text-[#c5221f]">*</span>
              </label>
              <textarea
                id="dw-reason"
                rows={3}
                autoFocus
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Enter reason if details are incorrect"
                className={FIELD + " resize-none"}
              />
            </div>
          )}
        </div>

        <div className="flex flex-none justify-end gap-2 border-t border-[#9DBFBE] px-5 py-3.5 dark:border-[#0062AD]">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer rounded-md border border-[#9DBFBE] px-3.5 py-1.5 text-[13px] text-[#214055] disabled:opacity-60 dark:border-[#0062AD] dark:text-[#BDE1FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className={
              "cursor-pointer rounded-md px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-60 " +
              (rejecting ? "bg-[#c5221f]" : "bg-[#16a34a]")
            }
          >
            {busy ? "Processing…" : rejecting ? "Reject" : "Verify"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
