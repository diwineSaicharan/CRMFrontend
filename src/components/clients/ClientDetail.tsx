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
import { ClientTransactions } from "./ClientTransactions";
import { ColumnScroll } from "./ColumnScroll";
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
  "bg-accent/10 font-normal text-headings dark:border dark:border-white/8 dark:bg-white/10 dark:text-[#bde1ff]";

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
        <p className="m-0 text-[0.9375rem] leading-4 text-heading dark:text-[#bde1ff]">
          {value}
        </p>
      </div>
    </div>
  );
}


export interface ClientDetailProps {
  client: Client;
  config: ClientDirectoryEntityConfig;
}

export function ClientDetail({ client, config }: ClientDetailProps) {
  return (
    <div className="relative z-[1] flex h-full min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-hidden">
      {/* The action buttons are gone, but the 44px band stays: it is what keeps
          this column's card aligned with the list column's header row. */}
      <header className="h-11 shrink-0" />

      <ColumnScroll
        hostClassName="min-h-0 flex-1 overflow-hidden"
        className="h-full min-h-0 w-full overflow-x-hidden overflow-y-scroll"
      >
          <div className="mx-auto mt-5 block w-full max-w-xl rounded-lg bg-card p-2 dark:bg-[#0091ff1a]">
            {/* Hero. The row-action strip that used to sit under the name is
                gone, so the fixed 229px that was sized around it goes too. */}
            <div className="flex flex-col items-center justify-evenly gap-3 overflow-visible bg-[#67a5ad1a] p-5 dark:bg-[#006bbd1a]">
              <span
                className="flex aspect-square w-32 shrink-0 items-center justify-center overflow-hidden rounded-full text-[48px] leading-none font-bold text-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                style={{ backgroundColor: getClientAvatarColor(client.username) }}
              >
                {getClientInitials(client.username)}
              </span>

              <h3 className="m-0 max-w-full overflow-hidden px-2 text-center font-condensed text-ellipsis whitespace-nowrap text-headings dark:text-[#bde1ff]">
                {client.username || "N/A"}
              </h3>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-1 gap-x-8">
                <DetailField
                  icon={<span className="material-icons text-[20px]">trending_up</span>}
                  label="Exposure"
                  value={formatIndianCurrency(client.exposure)}
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
              </div>

              {/* Money movement. The upline card, the lock cards and the
                  balance / total-bet / winning / lifetime-P&L fields were all
                  dropped — the CRM does not manage hierarchy or account locks. */}
              <ClientTransactions
                transactions={client.transactions ?? []}
                username={client.username}
              />
            </div>
          </div>
      </ColumnScroll>
    </div>
  );
}
