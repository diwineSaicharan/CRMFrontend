"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import { workingDwApi, type DwRequest } from "@/lib/working-dw";

/**
 * The Assigned column: who is working this request.
 *
 * Ported from diwine_admin_ui. Coordination only — claiming assigns the row so
 * others can see it is being handled. It approves nothing, changes no status,
 * and touches no wallet or ledger.
 *
 * Three states, and which one you see depends on who holds it:
 *
 *   nobody      an empty toggle you can flip on to claim
 *   you         a filled toggle plus your name, flip off to release
 *   someone else no toggle at all, just their name
 *
 * That last case is the point of the column: the toggle disappearing is what
 * tells you the request is not yours to take.
 */

/* The betting-assistant "Active match" switch geometry: a 40x20 track and a
   14px knob travelling 20px. Teal in light, the blue accent in dark. */
const TRACK =
  "relative inline-flex h-5 w-10 shrink-0 items-center rounded-full border " +
  "transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

const TRACK_ON =
  "border-[#29738c] bg-[#29738c] dark:border-[#bde1ff] dark:bg-[#bde1ff]";

const TRACK_OFF =
  "border-[#29738c] bg-[#29738c]/[0.12] dark:border-[#bde1ff] dark:bg-[#bde1ff]/[0.12]";

const KNOB =
  "pointer-events-none ml-[2px] h-3.5 w-3.5 rounded-full bg-[#29738c] " +
  "shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-[transform,background-color] " +
  "duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] peer-checked:translate-x-[20px] " +
  "peer-checked:bg-white dark:bg-[#bde1ff] dark:peer-checked:bg-white";

export function DwAssignToggle({
  request,
  onDone,
}: {
  request: DwRequest;
  /** Reload the queue, so the name and the banker column agree with the claim. */
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  /**
   * What we believe the assignment is, before the row we were handed catches up.
   *
   * The toggle used to render straight from the prop, so a click did nothing
   * visible until the whole queue had been refetched — a second or two of a
   * switch that appeared stuck, then flipped by itself. The admin panel feels
   * instant because it mutates the row from the response instead of reloading.
   *
   * `undefined` means "no opinion, follow the row".
   */
  const [pending, setPending] = useState<{ id: string; name: string | null } | null | undefined>();

  const rowHeldBy = request.assignedToUserId ?? null;
  const pendingHeldBy = pending === undefined ? undefined : (pending?.id ?? null);

  /*
   * Once the row agrees with us, defer to the row — derived, not written back
   * into state. Clearing `pending` here would be a setState during render,
   * which schedules an extra pass and is the kind of thing that breaks under
   * concurrent rendering; there is nothing to store, because agreement is
   * exactly what "no opinion" means.
   */
  const settled = pendingHeldBy !== undefined && pendingHeldBy === rowHeldBy;
  const useRow = pendingHeldBy === undefined || settled;

  const heldBy = useRow ? rowHeldBy : pendingHeldBy;
  const heldName = useRow ? request.assignedToUserName : (pending?.name ?? null);
  const mine = !!heldBy && heldBy === user?.id;
  const someoneElse = !!heldBy && !mine;

  const toggle = async (checked: boolean) => {
    setError(null);
    // Move now. The request is in flight either way, and a switch that responds
    // to the click is the whole difference in how this feels.
    setPending(
      checked ? { id: user?.id ?? "", name: user?.username ?? null } : null,
    );

    try {
      const res = checked
        ? await workingDwApi.claim(request.id)
        : await workingDwApi.release(request.id);

      // Settle on what the server actually recorded, rather than assuming our
      // guess was right.
      const assigned = (res as { data?: { assignedToUserId?: string | null;
        assignedToUserName?: string | null } }).data;
      if (assigned) {
        setPending(
          assigned.assignedToUserId
            ? { id: assigned.assignedToUserId, name: assigned.assignedToUserName ?? null }
            : null,
        );
      }
      // Still reload, so the Banker column and everyone else's view agree.
      onDone();
    } catch (caught) {
      // Usually "Already claimed by X" — someone won the race. Put the toggle
      // back and let the reload show who holds it.
      setPending(undefined);
      setError(
        caught instanceof ApiError && caught.message
          ? caught.message
          : "Could not change the assignment",
      );
      onDone();
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-[3px]">
      {!someoneElse && (
        <label
          className={
            TRACK +
            " " +
            (mine ? TRACK_ON : TRACK_OFF) +
            " " +
            "cursor-pointer"
          }
          title={
            error
              ? error
              : mine
                ? "Assigned to you — toggle off to release"
                : "Toggle to claim this request"
          }
        >
          <input
            type="checkbox"
            className="peer sr-only"
            checked={mine}
            onChange={(event) => void toggle(event.target.checked)}
          />
          <span className={KNOB} />
        </label>
      )}

      {mine && (
        <span className="max-w-[92px] overflow-hidden text-ellipsis whitespace-nowrap text-[10px] leading-tight font-semibold tracking-[0.2px] text-[#2F855A] dark:text-[#4ADE80]">
          {heldName || user?.username}
        </span>
      )}

      {someoneElse && (
        <span className="text-[11px] font-semibold text-[#214055] dark:text-[#BDE1FF]">
          {heldName}
        </span>
      )}
    </div>
  );
}
