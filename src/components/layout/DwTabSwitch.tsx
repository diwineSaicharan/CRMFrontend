"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useLiveEvents } from "@/lib/use-live-events";
import { workingDwApi, type DwPendingCounts, type DwTab } from "@/lib/working-dw";
import styles from "./DwTabSwitch.module.css";

/**
 * The Deposit / Withdrawal switch, as global chrome.
 *
 * It used to live inside the Working D/W page's own top bar, which meant it only
 * existed on that one route. Here it renders in the shell header on every page:
 * from anywhere else, picking a side navigates to that queue; on the queue
 * itself it just switches which one is shown.
 */

/* Both halves are `flex-1 basis-0` off the same min-width, so they render at
   identical widths and the sliding indicator can be one button wide. */
const SWITCH_BUTTON =
  "relative z-10 inline-flex min-w-[132px] flex-1 basis-0 cursor-pointer items-center " +
  "justify-center gap-2 rounded-[0.4rem] px-4 py-2 text-[14px] font-semibold leading-none " +
  "transition-colors duration-200";

const SWITCH_ON = "text-[#085A86] dark:text-[#D8EEFF]";

const SWITCH_OFF =
  "text-[#085A86]/60 hover:text-[#085A86] " +
  "dark:text-[#9ED4FF]/70 dark:hover:text-[#9ED4FF]";

const BADGE =
  "inline-grid h-[18px] min-w-[18px] place-items-center rounded-full px-1.5 " +
  "text-[10px] font-bold leading-none tabular-nums";

/** One route per side. The active one is read from the URL, not held in state. */
export const DW_PATHS: Record<DwTab, string> = {
  deposit: "/deposits",
  withdrawal: "/withdrawals",
};

const DW_TABS: Array<{
  id: DwTab;
  label: string;
  href: string;
  countKey: keyof DwPendingCounts;
}> = [
  {
    id: "deposit",
    label: "Deposit",
    href: DW_PATHS.deposit,
    countKey: "pendingDeposits",
  },
  {
    id: "withdrawal",
    label: "Withdrawal",
    href: DW_PATHS.withdrawal,
    countKey: "pendingWithdrawals",
  },
];

export function DwTabSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const { permissions } = useAuth();
  // The badges are the most visible sign that a queue moved, so they follow the
  // same pushes the queues do — including changes made in diwine_admin.
  const liveTick = useLiveEvents();
  const [counts, setCounts] = useState<DwPendingCounts>({
    pendingDeposits: 0,
    pendingWithdrawals: 0,
  });

  // Re-read on every route change: approving something elsewhere should be
  // reflected in the badges without a reload.
  useEffect(() => {
    let cancelled = false;

    workingDwApi
      .getPendingCounts()
      .then((res) => {
        if (!cancelled && res.data) setCounts(res.data);
      })
      .catch(() => {
        if (!cancelled) setCounts({ pendingDeposits: 0, pendingWithdrawals: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, liveTick]);

  // Withdrawals is the only route that lights the right-hand side; everywhere
  // else the switch shows Deposit as the default landing side.
  const tab: DwTab = pathname === DW_PATHS.withdrawal ? "withdrawal" : "deposit";
  const isDeposit = tab === "deposit";

  /**
   * Only the queues this account holds. A teammate granted deposits alone was
   * still shown Withdrawal here — the sidebar hid the page but this offered a
   * route straight into it, which then refused them.
   *
   * With one side left the sliding indicator and the half-width geometry make
   * no sense, so the switch renders as a single label instead; with none it
   * does not render at all.
   */
  const visibleTabs = DW_TABS.filter((item) => permissions[item.id]);
  if (visibleTabs.length === 0) return null;
  const isSwitch = visibleTabs.length > 1;

  return (
    <div
      role="tablist"
      aria-label="Transaction type"
      className={
        styles.tabSwitch +
        " relative flex flex-none items-center rounded-[0.55rem] p-1"
      }
    >
      {isSwitch && (
        <span
          aria-hidden="true"
          className={
            styles.tabIndicator +
            " pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-[0.4rem]"
          }
          style={{ transform: isDeposit ? "none" : "translateX(100%)" }}
        />
      )}

      {visibleTabs.map((item) => {
        const isActive = tab === item.id;
        const pending = counts[item.countKey];

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => router.push(item.href)}
            className={
              SWITCH_BUTTON +
              " " +
              (isActive || !isSwitch ? SWITCH_ON : SWITCH_OFF)
            }
          >
            {item.label}
            {pending > 0 && (
              <span
                className={
                  BADGE +
                  " " +
                  (isActive
                    ? "bg-[#ef4444] text-white"
                    : "bg-[#538EA1]/85 text-white dark:bg-[#0062AD] dark:text-[#D8EEFF]")
                }
              >
                {pending}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
