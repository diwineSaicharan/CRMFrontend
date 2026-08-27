"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import { formatRupees, workingDwApi, type DwRequest, type DwTab } from "@/lib/working-dw";

/**
 * The Banker / Admin stage cells on a queue row.
 *
 * Ported from diwine_admin_ui's deposit-withdrawal component, whose flow is:
 *
 *   deposit     banker: Verify | Reject
 *   withdrawal  banker: Process, then Verify Payment | Reject once PROCESSING
 *   root user   the admin then gets the same Verify | Reject, ADMIN role only
 *
 * Verify and Reject open a confirmation step rather than firing straight from
 * the menu — they move real money, and the admin panel stopped settling a root
 * request on a single unconfirmed click for the same reason. Process is
 * immediate there, so it is immediate here.
 *
 * There is deliberately no Claim item: assignment is a toggle in its own column
 * in the admin panel, not a stage action, and having it here was wrong.
 */

export type DwStage = "banker" | "admin";

/** Pill classes come from the page so both stages read like the rest of the row. */
export interface DwStageClasses {
  pill: string;
  locked: string;
  action: string;
  done: string;
}

const isDummy = (r: DwRequest) => !!r.isDummyRequest;

/** A legacy lien already debited the player: closing dropped below opening. */
const fundsHeld = (r: DwRequest) =>
  r.closingBalance != null &&
  r.openingBalance != null &&
  Number(r.closingBalance) < Number(r.openingBalance);

/** The banker's Verify is spent once a root request has been verified. */
const bankerVerified = (r: DwRequest) => isDummy(r) && !!r.verifiedBy;

const awaitingAdmin = (r: DwRequest) =>
  isDummy(r) && !!r.verifiedBy && r.adminApprovalStatus !== "APPROVED";

const adminApproved = (r: DwRequest) =>
  isDummy(r) && r.adminApprovalStatus === "APPROVED";

/** PENDING withdrawal whose funds are not held yet — Process is what debits. */
const canProcess = (r: DwRequest) => r.status === "PENDING" && !fundsHeld(r);

/** PROCESSING or legacy lien — the payment can be verified. */
const canVerifyWithdrawal = (r: DwRequest) => r.status === "PROCESSING" || fundsHeld(r);

type Mode = "verify" | "reject";

const MENU =
  "absolute right-0 z-50 mt-1 min-w-[170px] overflow-hidden rounded-[0.5rem] " +
  "border border-[#9DBFBE] bg-white shadow-lg dark:border-[#0062AD] dark:bg-[#0B3A63]";

const MENU_ITEM =
  "block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] text-[#214055] " +
  "hover:bg-[#EAF3F3] dark:text-[#BDE1FF] dark:hover:bg-[#0E4A80]";

const MENU_ITEM_REJECT =
  "block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] text-[#c5221f] " +
  "hover:bg-[#EAF3F3] dark:text-[#ff8a80] dark:hover:bg-[#0E4A80]";

const MENU_ERROR =
  "border-t border-[#9DBFBE] px-3 py-2 text-[11.5px] text-[#c5221f] " +
  "dark:border-[#0062AD] dark:text-[#ff8a80]";

export function DwStageCell({
  stage,
  request,
  tab,
  onDone,
  classes,
}: {
  stage: DwStage;
  request: DwRequest;
  tab: DwTab;
  /** Reload the queue and the badge counts after anything actually changed. */
  onDone: () => void;
  classes: DwStageClasses;
}) {
  const { effectiveRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<Mode | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const isWithdrawal = tab === "withdrawal";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const run = async (action: () => Promise<unknown>, label: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setModal(null);
      setReason("");
      setOpen(false);
      onDone();
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.message ? caught.message : `Could not ${label}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    if (modal === "reject") {
      if (!reason.trim()) {
        setError("Please give a reason.");
        return;
      }
      void run(() => workingDwApi.reject(request.id, { reason: reason.trim() }), "reject");
      return;
    }
    void run(
      () =>
        stage === "admin"
          ? workingDwApi.adminApprove(request.id)
          : workingDwApi.approve(request.id),
      "verify",
    );
  };

  const pill = (text: string, extra: string, title?: string) => (
    <span className={classes.pill + " " + extra} title={title}>
      {text}
    </span>
  );

  // ── Admin stage: root ("dummy") requests only ──────────────────────────
  if (stage === "admin") {
    if (!isDummy(request)) {
      return <span className="text-[12px] text-[#9BB4C7] dark:text-[#4E8DC1]">—</span>;
    }
    if (adminApproved(request)) return pill("Approved", classes.done);
    if (!request.verifiedBy) {
      return pill("Pending", classes.locked, "Waiting for the banker to verify first");
    }
    if (!(awaitingAdmin(request) && effectiveRole === "ADMIN")) {
      return pill(
        "Awaiting admin",
        classes.locked,
        "Verified by the banker — only an admin can approve it",
      );
    }
  }

  // ── Banker stage ───────────────────────────────────────────────────────
  if (stage === "banker" && bankerVerified(request)) {
    return pill(
      "Verified",
      classes.locked,
      "Verified by the banker — waiting for admin approval",
    );
  }

  const label =
    stage === "admin" ? "Pending" : request.status === "PROCESSING" ? "Processing" : "Pending";

  const showProcess = stage === "banker" && isWithdrawal && canProcess(request);
  const showVerify =
    stage === "admin" || !isWithdrawal || canVerifyWithdrawal(request);

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        className={classes.pill + " " + classes.action}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        title={stage === "admin" ? "Final admin decision on this root-user request" : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{busy ? "Processing…" : label}</span>
        <span
          aria-hidden="true"
          className={
            "material-icons text-[17px] leading-none opacity-60 transition-transform " +
            (open ? "rotate-180" : "")
          }
        >
          expand_more
        </span>
      </button>

      {open && !modal && (
        <div role="menu" className={MENU}>
          {showProcess && (
            <button
              type="button"
              role="menuitem"
              className={MENU_ITEM}
              onClick={() => void run(() => workingDwApi.process(request.id), "process")}
            >
              Process
            </button>
          )}
          {showVerify && (
            <button
              type="button"
              role="menuitem"
              className={MENU_ITEM}
              onClick={() => {
                setError(null);
                setModal("verify");
              }}
            >
              {stage === "banker" && isWithdrawal ? "Verify Payment" : "Verify"}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className={MENU_ITEM_REJECT}
            onClick={() => {
              setError(null);
              setReason("");
              setModal("reject");
            }}
          >
            Reject
          </button>
          {error && <p className={MENU_ERROR}>{error}</p>}
        </div>
      )}

      {modal && (
        <DwConfirmModal
          mode={modal}
          stage={stage}
          request={request}
          reason={reason}
          error={error}
          busy={busy}
          onReason={(value) => {
            setReason(value);
            if (error) setError(null);
          }}
          onCancel={() => {
            setModal(null);
            setReason("");
            setError(null);
          }}
          onConfirm={confirm}
        />
      )}
    </div>
  );
}

/**
 * The review step before a stage decision.
 *
 * The admin panel's version also re-collects UTR, receipt and bank on a banker
 * verify. This one confirms instead: the CRM's approve endpoint accepts no such
 * fields — the request already carries the UTR it was raised with — and a form
 * whose input is silently discarded would be worse than no form. Reject sends
 * its reason, which the endpoint does accept.
 */
function DwConfirmModal({
  mode,
  stage,
  request,
  reason,
  error,
  busy,
  onReason,
  onCancel,
  onConfirm,
}: {
  mode: Mode;
  stage: DwStage;
  request: DwRequest;
  reason: string;
  error: string | null;
  busy: boolean;
  onReason: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const rejecting = mode === "reject";
  const who = stage === "admin" ? "Admin" : "Banker";
  const kind = request.type === "WITHDRAWAL" ? "withdrawal" : "deposit";

  return (
    <div
      className="fixed inset-0 z-[1200] grid place-items-center bg-black/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${who} ${mode} ${kind}`}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] rounded-xl border border-[#9DBFBE] bg-white p-5 text-left shadow-xl dark:border-[#0062AD] dark:bg-[#0B3A63]"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="m-0 mb-1 text-[16px] font-semibold text-[#214055] dark:text-[#D8EEFF]">
          {rejecting ? "Reject" : `${who} verify`} {kind}
        </h3>
        <p className="m-0 mb-4 text-[12.5px] text-[#6a95b9] dark:text-[#9ED4FF]/80">
          {request.username || "—"} · {formatRupees(request.totalAmount ?? request.amount)}
          {request.utrNumber ? ` · UTR ${request.utrNumber}` : ""}
          {request.isDummyRequest ? " · root user" : ""}
        </p>

        {rejecting ? (
          <>
            <label
              htmlFor={`dw-reason-${request.id}`}
              className="mb-1 block text-[12px] font-medium text-[#214055] dark:text-[#BDE1FF]"
            >
              Reason for rejection
            </label>
            <textarea
              id={`dw-reason-${request.id}`}
              autoFocus
              rows={3}
              value={reason}
              onChange={(event) => onReason(event.target.value)}
              placeholder="Why is this being rejected?"
              className="w-full resize-none rounded-[0.35rem] border border-[#9DBFBE] px-2 py-1.5 text-[12.5px] text-[#214055] outline-none dark:border-[#0062AD] dark:bg-[#08294A] dark:text-[#BDE1FF]"
            />
          </>
        ) : (
          <p className="m-0 text-[12.5px] text-[#214055] dark:text-[#BDE1FF]">
            {stage === "admin"
              ? "Final sign-off. Chips move when you confirm."
              : kind === "withdrawal"
                ? "Confirm the payment has been made to the user."
                : request.isDummyRequest
                  ? "Confirm the money was received. An admin still has to approve it."
                  : "Confirm the money was received. Chips move when you confirm."}
          </p>
        )}

        {error && (
          <p className="mt-2 mb-0 text-[11.5px] text-[#c5221f] dark:text-[#ff8a80]">{error}</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer rounded-md border border-[#9DBFBE] px-3 py-1.5 text-[12.5px] text-[#214055] disabled:opacity-60 dark:border-[#0062AD] dark:text-[#BDE1FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || (rejecting && !reason.trim())}
            className={
              "cursor-pointer rounded-md px-3 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-60 " +
              (rejecting ? "bg-[#c5221f]" : "bg-[#0e7c5a]")
            }
          >
            {busy ? "Working…" : rejecting ? "Confirm reject" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
