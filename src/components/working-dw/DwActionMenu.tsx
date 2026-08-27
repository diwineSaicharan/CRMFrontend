"use client";

import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api";
import { workingDwApi, type DwRequest, type DwTab } from "@/lib/working-dw";

/**
 * The Banker / Admin stage control on a queue row.
 *
 * This used to be a pill with a chevron drawn on it and no handler behind it,
 * so clicking a row's stage did nothing at all. It is a real menu now, and the
 * items it offers depend on where the request actually is:
 *
 *   deposit, PENDING       verify -> hands it to the admin sign-off
 *   withdrawal, PENDING    process -> debits the player, awaits the payment
 *   withdrawal, PROCESSING verify -> confirms the banker has paid out
 *
 * Both kinds then need the admin sign-off, which is where the money actually
 * moves — verify only records who checked it.
 */

export type DwStage = "banker" | "admin";

interface MenuItem {
  key: string;
  label: string;
  run: (id: string, reason: string | null) => Promise<unknown>;
  /** Reject is the only one that needs a reason before it can run. */
  needsReason?: boolean;
  danger?: boolean;
}

const REJECT: MenuItem = {
  key: "reject",
  label: "Reject",
  needsReason: true,
  danger: true,
  run: (id, reason) => workingDwApi.reject(id, { reason }),
};

const VERIFY: MenuItem = {
  key: "approve",
  label: "Verify",
  run: (id) => workingDwApi.approve(id),
};

const PROCESS: MenuItem = {
  key: "process",
  label: "Process withdrawal",
  run: (id) => workingDwApi.process(id),
};

const ADMIN_APPROVE: MenuItem = {
  key: "adminApprove",
  label: "Approve",
  run: (id) => workingDwApi.adminApprove(id),
};

function itemsFor(
  stage: DwStage,
  request: DwRequest,
  tab: DwTab,
): { items: MenuItem[]; blocked: string | null } {
  const status = String(request.status ?? "PENDING").toUpperCase();

  if (stage === "admin") {
    // Both kinds need this second sign-off: the backend settles a normal
    // request at admin-approve, not at verify. Hiding the stage for normal
    // rows left a verified request stranded with no way to finish it.
    if (!request.verifiedBy) {
      return { items: [], blocked: "Waiting for the banker to verify first." };
    }
    return { items: [ADMIN_APPROVE, REJECT], blocked: null };
  }

  // Banker stage.
  if (status === "PROCESSING") return { items: [VERIFY, REJECT], blocked: null };
  if (status !== "PENDING") {
    return { items: [], blocked: `Request is ${status.toLowerCase()}.` };
  }
  const assign: MenuItem = request.assignedToUserId
    ? { key: "release", label: "Release claim", run: (id) => workingDwApi.release(id) }
    : { key: "claim", label: "Claim", run: (id) => workingDwApi.claim(id) };

  return {
    items: tab === "withdrawal" ? [PROCESS, assign, REJECT] : [VERIFY, assign, REJECT],
    blocked: null,
  };
}

export function DwActionMenu({
  stage,
  request,
  tab,
  onDone,
  pillClassName,
  lockedClassName,
  actionClassName,
  children,
}: {
  stage: DwStage;
  request: DwRequest;
  tab: DwTab;
  /** Reload the queue and the badge counts after anything actually changed. */
  onDone: () => void;
  pillClassName: string;
  lockedClassName: string;
  actionClassName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<MenuItem | null>(null);
  const [reason, setReason] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const { items, blocked } = itemsFor(stage, request, tab);

  // Close on an outside click or Escape, but never while a request is in
  // flight — the row would change under the operator mid-action.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (busy) return;
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, busy]);

  const close = () => {
    setOpen(false);
    setError(null);
    setReasonFor(null);
    setReason("");
  };

  const run = async (item: MenuItem, withReason: string | null) => {
    setBusy(item.key);
    setError(null);
    try {
      await item.run(request.id, withReason);
      close();
      onDone();
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.message
          ? caught.message
          : `Could not ${item.label.toLowerCase()}`,
      );
    } finally {
      setBusy(null);
    }
  };

  const onPick = (item: MenuItem) => {
    if (busy) return;
    if (item.needsReason) {
      setReasonFor(item);
      setError(null);
      return;
    }
    void run(item, null);
  };

  if (!items.length) {
    return (
      <span className={pillClassName + " " + lockedClassName} title={blocked ?? undefined}>
        {children}
      </span>
    );
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        className={pillClassName + " " + actionClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={Boolean(busy)}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {children}
      </button>

      {open && (
        <div
          role="menu"
          className={
            "absolute right-0 z-50 mt-1 min-w-[190px] overflow-hidden rounded-[0.5rem] " +
            "border border-[#9DBFBE] bg-white shadow-lg " +
            "dark:border-[#0062AD] dark:bg-[#0B3A63]"
          }
        >
          {reasonFor ? (
            <div className="p-3">
              <label
                htmlFor={`reason-${request.id}`}
                className="mb-1 block text-[12px] font-medium text-[#214055] dark:text-[#BDE1FF]"
              >
                Reason for rejection
              </label>
              <textarea
                id={`reason-${request.id}`}
                autoFocus
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className={
                  "w-full resize-none rounded-[0.35rem] border border-[#9DBFBE] px-2 py-1 " +
                  "text-[12.5px] text-[#214055] outline-none " +
                  "dark:border-[#0062AD] dark:bg-[#08294A] dark:text-[#BDE1FF]"
                }
                placeholder="Why is this being rejected?"
              />
              {error && (
                <p className="mt-1 text-[11.5px] text-[#c5221f] dark:text-[#ff8a80]">{error}</p>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-[12px] text-[#214055] hover:underline dark:text-[#BDE1FF]"
                  onClick={() => {
                    setReasonFor(null);
                    setReason("");
                  }}
                  disabled={Boolean(busy)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={
                    "rounded bg-[#c5221f] px-2.5 py-1 text-[12px] font-medium text-white " +
                    "disabled:opacity-60"
                  }
                  disabled={Boolean(busy) || !reason.trim()}
                  onClick={() => void run(reasonFor, reason.trim())}
                >
                  {busy ? "Rejecting…" : "Confirm reject"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  disabled={Boolean(busy)}
                  onClick={() => onPick(item)}
                  className={
                    "block w-full cursor-pointer px-3 py-2 text-left text-[12.5px] " +
                    "hover:bg-[#EAF3F3] disabled:cursor-wait disabled:opacity-60 " +
                    "dark:hover:bg-[#0E4A80] " +
                    (item.danger
                      ? "text-[#c5221f] dark:text-[#ff8a80]"
                      : "text-[#214055] dark:text-[#BDE1FF]")
                  }
                >
                  {busy === item.key ? "Working…" : item.label}
                </button>
              ))}
              {error && (
                <p className="border-t border-[#9DBFBE] px-3 py-2 text-[11.5px] text-[#c5221f] dark:border-[#0062AD] dark:text-[#ff8a80]">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
