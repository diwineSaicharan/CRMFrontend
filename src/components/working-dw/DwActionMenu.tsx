"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import { workingDwApi, type DwRequest, type DwTab } from "@/lib/working-dw";
import { DwVerifyModal, type DwVerifySubmit } from "./DwVerifyModal";

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
  const { user, effectiveRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<Mode | null>(null);
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

  /**
   * The modal has already validated and collected whatever this stage needs —
   * UTR, ops bank and receipt for a banker verifying a withdrawal, a reason for
   * a reject, nothing for the rest.
   */
  const submit = (payload: DwVerifySubmit) => {
    if (modal === "reject") {
      void run(
        () => workingDwApi.reject(request.id, { reason: payload.remarks }),
        "reject",
      );
      return;
    }
    void run(
      () =>
        stage === "admin"
          ? workingDwApi.adminApprove(request.id, payload)
          : workingDwApi.approve(request.id, payload),
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
  if (stage === "banker") {
    if (bankerVerified(request)) {
      return pill(
        "Verified",
        classes.locked,
        "Verified by the banker — waiting for admin approval",
      );
    }

    /**
     * Claimed by someone else: no actions, as the admin panel has it
     * (canProcessRequest). The Assigned column already shows their name; this is
     * what stops two people working the same request at once.
     *
     * An admin or operator is never blocked — they have to be able to unstick a
     * request whose claimer has gone home.
     */
    const privileged = effectiveRole === "ADMIN" || effectiveRole === "OPERATOR";
    const heldByOther =
      !!request.assignedToUserId && request.assignedToUserId !== user?.id;
    if (heldByOther && !privileged) {
      return pill(
        request.status === "PROCESSING" ? "Processing" : "Pending",
        classes.locked,
        `Assigned to ${request.assignedToUserName ?? "someone else"} — only they can process this request`,
      );
    }
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
              setModal("reject");
            }}
          >
            Reject
          </button>
          {error && <p className={MENU_ERROR}>{error}</p>}
        </div>
      )}

      {modal && (
        <DwVerifyModal
          mode={modal}
          stage={stage}
          request={request}
          busy={busy}
          error={error}
          onError={setError}
          onCancel={() => {
            setModal(null);
            setError(null);
          }}
          onSubmit={submit}
        />
      )}
    </div>
  );
}
