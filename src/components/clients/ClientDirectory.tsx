"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Client, ClientEntityKey } from "@/lib/clients";
import {
  CLIENT_DIRECTORY_CONFIGS,
  CLIENT_NAV_OPTIONS,
  formatIndianCurrency,
  getClientAvatarColor,
  getClientInitials,
} from "./client-directory.config";
import { CLIENT_NAV_ICONS } from "@/components/ui/icons";
import { ClientDetail } from "./ClientDetail";
import { ColumnScroll } from "./ColumnScroll";

/* Class strings ported from client-list.component.html. */
const NAV_ITEM =
  "mb-px flex w-full cursor-pointer items-center rounded-md border-0 bg-transparent p-2.5 " +
  "font-condensed text-[15px] leading-none font-normal text-[#1d4268] " +
  "transition-[background] duration-0 hover:bg-accent/10 " +
  // Dark values from `::ng-deep app-client-list` in admin.component.scss:
  // `.client-list-nav-item span` #bde1ff, `:hover` #006bbd1a, `.active-menu`
  // rgba(0,98,198,0.25) — the accent teal never applies in dark.
  "dark:text-[#bde1ff] dark:hover:bg-[#006bbd1a]";

/**
 * Selected state for a nav row and a client row.
 *
 * The ported value is a 20%-opacity accent fill, which over the glass panel
 * is close to invisible — the selection was applied but unreadable. The bar
 * is added on top of that fill rather than replacing it, so the reference
 * colour still shows and the state is unmistakable.
 */
const SELECTED_MARKER =
  "relative before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] " +
  "before:rounded-full before:bg-accent before:content-[''] " +
  "dark:before:bg-[#0398ff]";

const NAV_ITEM_ACTIVE =
  "bg-accent/25 font-medium dark:bg-[rgba(0,98,198,0.25)] " + SELECTED_MARKER;

const SECTION_LABEL =
  "mb-1.5 px-2.5 font-condensed text-xs text-muted dark:text-[#4e8dc1]";

const ACTION_ICONS = {
  import: (
    <>
      <path d="M12 3v12" />
      <path d="m8 11 4 4 4-4" />
      <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
    </>
  ),
  export: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </>
  ),
  print: (
    <>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" />
    </>
  ),
};

export interface ClientDirectoryProps {
  entity: ClientEntityKey;
  clients: Client[];
  loading?: boolean;
  /** The id in the URL. Absent means "nothing picked yet". */
  selectedId?: string;
}

export function ClientDirectory({
  entity,
  clients,
  loading,
  selectedId,
}: ClientDirectoryProps) {
  const config = CLIENT_DIRECTORY_CONFIGS[entity];
  const router = useRouter();

  const [sortAsc, setSortAsc] = useState(false);

  const displayed = useMemo(() => {
    if (!sortAsc) return clients;
    return [...clients].sort((a, b) => a.username.localeCompare(b.username));
  }, [clients, sortAsc]);

  // Selection lives in the URL, so it is linkable and survives a reload. With
  // no id (plain /clients) the first row stands in, as it did before.
  const selected =
    displayed.find((client) => client.id === selectedId) ?? displayed[0] ?? null;

  return (
    <div className="content-body group/content relative flex h-full min-h-0 flex-1 overflow-hidden rounded-xl border-[7px] border-transparent bg-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.5)] md:gap-5 dark:bg-[#0091ff0d] dark:shadow-[0_0_0_1px_rgb(0,145,255,0.15)]">
      {/* ── Column 1: client nav ───────────────────────────────────────── */}
      <aside
        className="relative z-20 flex h-full w-60 min-h-0 shrink-0 flex-col overflow-hidden rounded-r-xl border-none bg-transparent"
      >
        <ColumnScroll
          hostClassName="flex min-h-0 flex-1 flex-col overflow-hidden px-1 pt-4"
          className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-scroll"
          /* The host's pt-4 sits above the viewport, so the rail starts below it. */
          railClassName="top-4"
        >
            <ul className="m-0 list-none p-0">
              <li className="mb-6">
                <div className={SECTION_LABEL}>Client</div>
                <ul className="m-0 w-full list-none p-0">
                  {CLIENT_NAV_OPTIONS.map((option) => {
                    const NavIcon = CLIENT_NAV_ICONS[option.value];
                    return (
                      <li key={option.value}>
                        <Link
                          href="/clients"
                          className={
                            NAV_ITEM +
                            (entity === option.value ? " " + NAV_ITEM_ACTIVE : "")
                          }
                        >
                          <NavIcon className="me-3 h-4 w-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate text-left">
                            {option.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              <li className="mb-6">
                <div className={SECTION_LABEL}>Actions</div>
                <ul className="m-0 w-full list-none p-0">
                  {(["import", "export", "print"] as const).map((action) => (
                    <li key={action}>
                      <button type="button" className={NAV_ITEM}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="me-3 h-4 w-4"
                          aria-hidden="true"
                        >
                          {ACTION_ICONS[action]}
                        </svg>
                        <span className="min-w-0 flex-1 truncate text-left capitalize">
                          {action}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
        </ColumnScroll>
      </aside>

      {/* ── Column 2: the list ───────────────────────────────────────────── */}
      <div className="relative z-[1] flex h-full w-64 min-h-0 min-w-0 flex-col self-stretch overflow-hidden xl:w-80 2xl:w-96">
        <header className="flex h-11 shrink-0 items-center px-3 font-normal text-[hsl(210_57%_26%)] dark:text-[#bde1ff]">
          <div className="flex-1 truncate text-[15px] font-normal">
            {config.listTitle}
          </div>
          <button
            type="button"
            onClick={() => setSortAsc((value) => !value)}
            title={sortAsc ? "Sorted A–Z" : "Sort A–Z"}
            aria-label={sortAsc ? "Sorted A–Z" : "Sort A–Z"}
            className={
              "inline-flex h-9 w-9 items-center justify-center gap-2 rounded-md p-0 text-sm whitespace-nowrap transition-colors hover:bg-accent/20 dark:hover:bg-[rgba(0,98,198,0.25)] focus-visible:bg-accent focus-visible:outline-none " +
              (sortAsc ? "bg-accent/15" : "")
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
              <path d="M20 8h-5" />
              <path d="M15 10V6.5a2.5 2.5 0 0 1 5 0V10" />
              <path d="M15 14h5l-5 6h5" />
            </svg>
          </button>
        </header>

        <ColumnScroll
          hostClassName="min-h-0 flex-1 overflow-hidden"
          className="h-full max-w-none min-h-0 w-full overflow-x-hidden overflow-y-scroll"
          dir="ltr"
        >
            {loading && displayed.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted">Loading data…</p>
            )}

            {!loading && displayed.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted">
                {config.noDataMessage}
              </p>
            )}

            {displayed.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => router.push(`/clients/${encodeURIComponent(client.id)}`)}
                aria-current={selected?.id === client.id ? "true" : undefined}
                className={
                  "mb-px flex w-full cursor-pointer items-center rounded-md border-0 bg-transparent px-3 py-2.5 text-left transition-[background] duration-0 hover:bg-accent/10 " +
                  // `.user-list-item` dark: hover #006bbd1a; selected
                  // hsl(206 100% 37% / .2), which *lightens* to /.1 on hover.
                  "dark:hover:bg-[#006bbd1a] " +
                  (selected?.id === client.id
                    ? "bg-accent/25 dark:bg-[hsl(206_100%_37%_/_0.25)] " +
                      "dark:hover:bg-[hsl(206_100%_37%_/_0.2)] " +
                      SELECTED_MARKER
                    : "")
                }
              >
                <span
                  className="relative me-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: getClientAvatarColor(client.username) }}
                >
                  {getClientInitials(client.username)}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="mb-1 block font-normal text-[hsl(210_57%_26%)] dark:text-[#bde1ff]">
                    {client.username || "N/A"}
                  </span>
                  <span className="text-xs text-[#6195b9] dark:text-[#4e8dc1]">
                    {formatIndianCurrency(client.balance)}
                  </span>
                </span>

                <span
                  className="inline-flex min-w-5 shrink-0 items-center justify-end gap-[5px]"
                  aria-label="Client status indicators"
                >
                  <span
                    className={
                      "material-icons text-[20px] leading-none opacity-72 " +
                      (client.isActive === false ? "text-[#dc3545]" : "text-[#16a34a]")
                    }
                    title={client.isActive === false ? "Inactive" : "Active"}
                  >
                    {client.isActive === false ? "lock" : "lock_open"}
                  </span>
                </span>
              </button>
            ))}
        </ColumnScroll>
      </div>

      {/* ── Column 3: the detail card ───────────────────────────────────── */}
      {selected && <ClientDetail client={selected} config={config} />}
    </div>
  );
}
