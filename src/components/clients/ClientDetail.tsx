"use client";

import type { ReactNode } from "react";

import type { Client } from "@/lib/clients";
import type { ClientDirectoryEntityConfig } from "./client-directory.config";
import {
  formatIndianCurrency,
  formatShortDate,
  getClientAvatarColor,
  getClientInitials,
} from "./client-directory.config";
import { RowActions } from "./RowActions";
import styles from "./ClientDirectory.module.css";

/* Lucide geometry copied from client-directory-panel.component.html. */
const svg = (paths: ReactNode, size = 20) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {paths}
  </svg>
);

const ICONS = {
  percent: svg(
    <>
      <line x1="19" x2="5" y1="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>,
  ),
  listSort: svg(
    <>
      <path d="M15 12H3" />
      <path d="M3 5h18" />
      <path d="M9 19H3" />
    </>,
  ),
  bankUp: svg(
    <>
      <path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" />
      <path d="M18 12h.01" />
      <path d="M19 22v-6" />
      <path d="m22 19-3-3-3 3" />
      <path d="M6 12h.01" />
      <circle cx="12" cy="12" r="2" />
    </>,
  ),
  bankDown: svg(
    <>
      <path d="M12 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5" />
      <path d="m16 19 3 3 3-3" />
      <path d="M18 12h.01" />
      <path d="M19 16v6" />
      <path d="M6 12h.01" />
      <circle cx="12" cy="12" r="2" />
    </>,
  ),
  pound: svg(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M10 16V9.5a1 1 0 0 1 5 0" />
      <path d="M8 12h4" />
      <path d="M8 16h7" />
    </>,
  ),
  trophy: svg(
    <>
      <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
      <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
      <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
      <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
    </>,
  ),
  gift: svg(
    <>
      <path d="M12 7v14" />
      <path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
      <path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" />
      <rect x="3" y="7" width="18" height="4" rx="1" />
    </>,
  ),
  phone: svg(
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
  ),
  calendar: svg(
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </>,
  ),
} as const;

const ICON_CIRCLE =
  "flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full " +
  "bg-accent/10 font-normal text-headings dark:text-[#9ED4FF]";

function DetailField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className={styles.fieldRow + " relative flex min-h-[70px] items-center gap-5"}>
      <div className={ICON_CIRCLE}>{icon}</div>
      <div>
        <h3 className="m-0 mb-1 text-xs leading-4 text-muted dark:text-[#4e8dc1]">
          {label}
        </h3>
        <p className="m-0 text-[0.9375rem] leading-4 text-heading dark:text-[#9ED4FF]">
          {value}
        </p>
      </div>
    </div>
  );
}

/* Four cards: account, bet lock, sports lock, casino lock. `unlocked` is the
   permissive state in each case, which is why bet/sports/casino invert. */
function LockRow({
  unlocked,
  title,
  statusText,
}: {
  unlocked: boolean;
  title: string;
  statusText: string;
}) {
  return (
    <button
      type="button"
      className="grid min-h-[58px] cursor-pointer grid-cols-[32px_minmax(0,1fr)] items-center gap-2 rounded-lg border border-[#e5e7eb] bg-card p-2.5 text-left text-headings dark:border-[rgba(0,145,255,0.2)] dark:bg-[rgba(0,145,255,0.06)] dark:text-[#9ED4FF]"
    >
      <span
        className={
          "material-icons text-[21px] " +
          (unlocked ? "text-[#16a34a]" : "text-[#dc3545]")
        }
      >
        {unlocked ? "lock_open" : "lock"}
      </span>
      <span className="min-w-0">
        <strong className="block overflow-hidden text-[13px] font-medium text-ellipsis whitespace-nowrap">
          {title}
        </strong>
        <small className="mt-1 inline-flex h-[22px] w-fit items-center rounded-full bg-[rgba(178,204,203,0.2)] px-3 py-1 text-[10px] leading-none font-medium text-headings dark:bg-[rgba(0,145,255,0.14)] dark:text-[#9ED4FF]">
          {statusText}
        </small>
      </span>
    </button>
  );
}

export interface ClientDetailProps {
  client: Client;
  config: ClientDirectoryEntityConfig;
  onCreate?: () => void;
  onDeposit?: () => void;
  onBulkUpload?: () => void;
}

export function ClientDetail({
  client,
  config,
  onCreate,
  onDeposit,
  onBulkUpload,
}: ClientDetailProps) {
  const headerButton =
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-normal whitespace-nowrap " +
    "transition-colors hover:bg-accent/20 focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50";

  return (
    <div className="relative z-[1] flex h-full min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-hidden">
      <header className="flex h-11 shrink-0 items-center px-3 font-normal text-[hsl(210_57%_26%)] dark:text-[#9ED4FF]">
        <button
          type="button"
          className={"ms-auto " + headerButton}
          onClick={onDeposit}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/action/dep.svg" alt="" className="h-3.5 w-3.5" />
          Deposit
        </button>

        {config.showBulkUpload && (
          <button type="button" className={headerButton} onClick={onBulkUpload}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
              <path d="M14 2v5a1 1 0 0 0 1 1h5" />
              <path d="M12 12v6" />
              <path d="m15 15-3-3-3 3" />
            </svg>
            Bulk Upload
          </button>
        )}

        <button type="button" className={headerButton} onClick={onCreate}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/action/add-user.svg" alt="" className="h-3.5 w-3.5" />
          {config.createLabel}
        </button>
      </header>

      <div className={styles.columnBody + " relative min-h-0 flex-1 overflow-hidden"}>
        <div
          className={
            styles.columnScroll +
            " h-full min-h-0 w-full overflow-x-hidden overflow-y-scroll"
          }
        >
          <div className="mx-auto mt-5 block w-full max-w-xl rounded-lg bg-card p-2 dark:bg-[#0091ff1a]">
            {/* Hero: fixed 229px so the card never reflows as fields load. */}
            <div className="flex h-[229px] max-h-[229px] min-h-[229px] flex-col items-center justify-evenly gap-1.5 overflow-visible bg-accent/10 p-5 pb-2">
              <span
                className="flex aspect-square w-32 shrink-0 items-center justify-center overflow-hidden rounded-full text-[48px] leading-none font-bold text-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                style={{ backgroundColor: getClientAvatarColor(client.username) }}
              >
                {getClientInitials(client.username)}
              </span>

              <h3 className="m-0 max-w-full overflow-hidden px-2 text-center font-condensed text-ellipsis whitespace-nowrap text-headings dark:text-[#9ED4FF]">
                {client.username || "N/A"}
              </h3>

              <div className="flex w-full max-w-full shrink-0 justify-center">
                <RowActions />
              </div>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-1 gap-x-8">
                <DetailField
                  icon={
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/assets/action/dep.svg" alt="" className="h-[18px] w-5 object-contain" />
                  }
                  label="Balance"
                  value={formatIndianCurrency(client.balance)}
                />
                <DetailField
                  icon={<span className="material-icons text-[20px]">trending_up</span>}
                  label="Exposure"
                  value={formatIndianCurrency(client.exposure)}
                />
                <DetailField
                  icon={ICONS.percent}
                  label="Sharing Tree"
                  value={client.sharingTree ?? `${client.sharingRatio ?? 0}`}
                />
                <DetailField
                  icon={ICONS.listSort}
                  label="Category"
                  value={client.category ?? "N/A"}
                />
                <DetailField
                  icon={ICONS.bankUp}
                  label="Total Deposit"
                  value={formatIndianCurrency(client.totalDeposits)}
                />
                <DetailField
                  icon={ICONS.bankDown}
                  label="Total Withdrawals"
                  value={formatIndianCurrency(client.totalWithdrawals)}
                />
                <DetailField
                  icon={ICONS.pound}
                  label="Total bet"
                  value={client.betCount ?? 0}
                />
                <DetailField
                  icon={ICONS.trophy}
                  label="Winning %"
                  value={client.winningPercent ?? 0}
                />

                {config.showBonus && (
                  <DetailField
                    icon={ICONS.gift}
                    label="Bonus"
                    value={formatIndianCurrency(client.bonusBalance)}
                  />
                )}

                {config.showPhone && (
                  <DetailField
                    icon={ICONS.phone}
                    label="Phone"
                    value={client.mobileNumber || "N/A"}
                  />
                )}

                {config.showJoinedDate && (
                  <DetailField
                    icon={ICONS.calendar}
                    label="Joined Date"
                    value={formatShortDate(client.createdAt)}
                  />
                )}

                <DetailField
                  icon={ICONS.bankUp}
                  label="Last Deposit Date"
                  value={formatShortDate(client.lastDepositDate)}
                />
                <DetailField
                  icon={ICONS.trophy}
                  label="Affiliate"
                  value={client.affiliateLink || "N/A"}
                />
                <DetailField
                  icon={ICONS.trophy}
                  label="Life Time Pnl"
                  value={formatIndianCurrency(client.lifetimePnl)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 bg-transparent px-[22px] pb-5">
                <LockRow
                  unlocked={client.isActive !== false}
                  title="Account"
                  statusText={client.isActive === false ? "Inactive" : "Active"}
                />
                <LockRow
                  unlocked={!client.isBetLocked}
                  title="Bet Lock"
                  statusText={client.isBetLocked ? "Locked" : "Unlocked"}
                />
                <LockRow
                  unlocked={!client.isSportsLocked}
                  title="Sports Lock"
                  statusText={client.isSportsLocked ? "Locked" : "Unlocked"}
                />
                <LockRow
                  unlocked={!client.isCasinoLocked}
                  title="Casino Lock"
                  statusText={client.isCasinoLocked ? "Locked" : "Unlocked"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
