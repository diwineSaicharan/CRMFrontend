"use client";

import { useEffect, useState } from "react";

import { fetchClients, type Client, type ClientEntityKey } from "@/lib/clients";
import { SAMPLE_CLIENTS } from "@/lib/sample-data";
import { CLIENT_DIRECTORY_CONFIGS } from "./client-directory.config";
import { HeaderSlot } from "@/components/layout/HeaderSlot";
import { ClientDirectory } from "./ClientDirectory";
import styles from "./ClientDirectory.module.css";

const SEARCH_LABEL: Record<ClientEntityKey, string> = {
  dl: "DL",
  super: "Super",
  master: "Master",
  users: "Client",
  teammates: "TeamMate",
};

const PARENT_ROLES = [
  { value: "ALL", label: "All" },
  { value: "MASTER", label: "Master" },
  { value: "SUPER", label: "Super" },
  { value: "DL", label: "DL" },
];

export function ClientsPage({ entity }: { entity: ClientEntityKey }) {
  const [query, setQuery] = useState("");
  const [parentRole, setParentRole] = useState("ALL");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchClients(entity)
      .then((res) => {
        if (cancelled) return;
        setClients(res.items.length > 0 ? res.items : SAMPLE_CLIENTS);
      })
      // Until CRMBackend serves this route, fall back to placeholder rows so
      // the layout is reviewable rather than blank.
      .catch(() => {
        if (!cancelled) setClients(SAMPLE_CLIENTS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entity]);

  const filtered = query.trim()
    ? clients.filter((client) =>
        client.username.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : clients;

  const selectClass =
    "rounded-md border border-[#c7d9e6] bg-white px-2 py-1 text-sm text-headings " +
    "dark:border-[#3a5f79] dark:bg-[#0f2230] dark:text-[#d7ecff]";

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      {/* ── toolbar ──────────────────────────────────────────────────────── */}
      {/* Rendered into the shell header so it shares the row with the global
          Deposit / Withdrawal switch. It used to sit here in the page body,
          which put the search bar on a second line underneath that switch. */}
      <HeaderSlot>
        <div className="flex w-full min-w-0 items-center gap-5 min-[1440px]:pl-[0.7rem]">
          <h2 className="m-0 shrink-0 font-condensed text-[15px] leading-none font-medium whitespace-nowrap text-headings dark:text-[#bde1ff]">
            {SEARCH_LABEL[entity]}
          </h2>

          <div
            className={
              styles.searchShell +
              // 384px, and capped there: `.search-input-container` is
              // `max-width: 384px` above 1440px, and the balance pills that stop
              // it growing below that breakpoint are not ported yet.
              " flex h-10 w-96 max-w-[384px] flex-[1_1_auto] items-center rounded-full border-[0.5px] border-white bg-white/15 px-2.5 backdrop-blur-[10px] transition-all duration-300 " +
              "focus-within:border-white focus-within:bg-white/25 " +
              "dark:border-[#05498d] dark:bg-transparent dark:focus-within:border-white"
            }
          >
            <span className="material-icons text-[20px] text-black opacity-70 dark:text-[#bde1ff] dark:opacity-100">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${SEARCH_LABEL[entity]}...`}
              className="min-w-0 flex-1 border-none bg-transparent px-2 text-sm font-normal text-headings outline-none placeholder:text-headings dark:text-[#bde1ff] dark:placeholder:text-[#bde1ff] dark:placeholder:opacity-80"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="material-icons cursor-pointer text-black opacity-70 hover:opacity-100 dark:text-[#bde1ff] dark:opacity-100"
              >
                close
              </button>
            )}
            {/* The ⌘K hint the reference draws as a tiny inline glyph. */}
            <kbd className="me-2 ms-1 flex shrink-0 items-center text-xs text-headings dark:text-[#bde1ff]">
              Ctrl K
            </kbd>
          </div>

          {entity === "users" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#337AAB] dark:text-[#bde1ff]">
                Parent Role
              </span>
              <select
                value={parentRole}
                onChange={(event) => setParentRole(event.target.value)}
                className={selectClass}
              >
                {PARENT_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </HeaderSlot>

      {/* ── directory ─────────────────────────────────────────────────────
          `app-client-list`'s own `:host` carries `padding: 1px` on top of the
          `margin-top: 2px` the clients section gives it. Missing that 1px left
          the whole glass panel a pixel up and to the left of the reference. */}
      <div className="mt-0.5 min-h-0 flex-auto overflow-visible p-px">
        <ClientDirectory
          entity={entity}
          clients={filtered}
          loading={loading}
          key={CLIENT_DIRECTORY_CONFIGS[entity].key}
        />
      </div>
    </div>
  );
}
