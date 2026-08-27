"use client";

import { useEffect, useMemo, useState } from "react";

import { HeaderSlot } from "@/components/layout/HeaderSlot";
import { CreateTeammateForm } from "@/components/create/CreateTeammateForm";
import { CRM_CAPABILITY_INFO, crmTeammateApi, type CrmTeammate } from "@/lib/crm-teammates";
import { formatDwDate } from "@/lib/working-dw";
import { EditAccessModal } from "./EditAccessModal";
import styles from "./Teammates.module.css";

/**
 * CRM teammates: who can sign in to this panel, and what each of them reaches.
 *
 * Its own section rather than an entry under Create, because most of the work
 * here is reviewing and changing access that already exists — creating one is
 * the occasional part.
 *
 * A teammate with no access shows as such rather than being hidden: an account
 * that can sign in and see nothing is the state most worth noticing, and it is
 * how every teammate created before this table existed will appear.
 */

export function TeammatesPage() {
  const [rows, setRows] = useState<CrmTeammate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<CrmTeammate | null>(null);

  useEffect(() => {
    let cancelled = false;
    crmTeammateApi
      .list()
      .then((res) => {
        if (!cancelled) {
          setRows(res.data ?? []);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setError("Could not load teammates.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!rows) return [];
    if (!term) return rows;
    return rows.filter((row) =>
      [row.username, row.fullName, row.profileName, row.accessSummary]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term)),
    );
  }, [rows, query]);

  const withoutAccess = useMemo(
    () => (rows ?? []).filter((row) => !row.permissionsActive).length,
    [rows],
  );

  return (
    <div className={styles.page + " flex min-h-0 w-full min-w-0 flex-1 flex-col"}>
      <HeaderSlot>
        <div className={styles.page + " flex w-full min-w-0 items-center gap-2.5"}>
          <h2 className="m-0 me-[22px] flex-none text-[16px] leading-none font-medium whitespace-nowrap text-[var(--tm-headings)]">
            TeamMates
          </h2>

          <div className={styles.search + " relative min-w-0 flex-[0_1_320px]"}>
            <span
              aria-hidden="true"
              className="material-icons pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[17px] text-[var(--tm-muted)]"
            >
              search
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search teammates"
              placeholder="Search name, username or access"
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            onClick={() => setCreating((value) => !value)}
            className={
              "ms-auto inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 " +
              "text-[13px] font-medium text-white " +
              (creating ? "bg-[#6a95b9]" : "bg-[#16a34a]")
            }
          >
            <span className="material-icons text-[17px]">
              {creating ? "close" : "person_add"}
            </span>
            {creating ? "Cancel" : "New TeamMate"}
          </button>
        </div>
      </HeaderSlot>

      {creating ? (
        // The form is field-width work, not table-width: unconstrained it
        // stretched a two-field row across the whole page and the columns
        // stopped lining up with anything.
        <div className="mt-0.5 min-h-0 flex-auto overflow-y-auto">
          <div className="mx-auto w-full max-w-[1080px]">
          <CreateTeammateForm
            onCreated={() => {
              setCreating(false);
              setReloadKey((n) => n + 1);
            }}
          />
          </div>
        </div>
      ) : (
        <div className="mt-0.5 flex min-h-0 flex-auto flex-col overflow-hidden rounded-xl border-[7px] border-transparent bg-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.5)] dark:bg-[#0091ff0d] dark:shadow-[0_0_0_1px_rgb(0,145,255,0.15)]">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-4 rounded-xl bg-white/50 px-5 py-4 dark:bg-white/5">
            <div className="flex items-start gap-3">
              <span className="material-icons rounded-lg bg-[#B2CCCB40] p-2 text-[#214055] dark:text-[#9ED4FF]">
                badge
              </span>
              <div>
                <h1 className="m-0 text-xl font-semibold text-[#214055] dark:text-[#D8EEFF]">
                  CRM TeamMates
                </h1>
                <p className="m-0 mt-1 text-sm text-[#6a95b9] dark:text-[#9ED4FF]/80">
                  Who can sign in to this panel, and what each of them reaches
                </p>
              </div>
            </div>

            {withoutAccess > 0 && (
              <div
                className="rounded-[0.4rem] border border-[#c5221f]/40 bg-[#c5221f]/10 px-3 py-2 text-[12.5px] text-[#c5221f] dark:text-[#ff8a80]"
                role="status"
              >
                {withoutAccess} teammate{withoutAccess === 1 ? "" : "s"} with no access —
                they can sign in and see nothing.
              </div>
            )}
          </div>

          {error && (
            <p className="px-5 py-6 text-center text-sm text-[#c5221f] dark:text-[#ff8a80]">
              {error}
            </p>
          )}
          {!error && rows === null && (
            <p className="px-5 py-6 text-center text-sm text-[var(--tm-muted)]">Loading…</p>
          )}
          {!error && rows !== null && filtered.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-[var(--tm-muted)]">
              {rows.length === 0
                ? "No teammates yet. Create one to give someone part of the CRM."
                : "No teammates match your search."}
            </p>
          )}

          {!error && filtered.length > 0 && (
            <div className="min-h-0 flex-auto overflow-auto px-2">
              <table className={styles.table + " w-full border-collapse text-[13px]"}>
                <thead>
                  <tr>
                    <th>TeamMate</th>
                    <th>Username</th>
                    <th>Role Name</th>
                    <th>Access</th>
                    <th>Created</th>
                    <th>Created By</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      <td>{row.fullName || "—"}</td>
                      <td className="font-mono text-[12.5px]">{row.username}</td>
                      <td>{row.profileName || "—"}</td>
                      <td>
                        {row.permissionsActive ? (
                          <span className="flex flex-wrap gap-1">
                            {CRM_CAPABILITY_INFO.filter(
                              (item) => row.permissions[item.key],
                            ).map((item) => (
                              <span
                                key={item.key}
                                className="inline-flex items-center gap-1 rounded-full bg-[#B2CCCB]/60 px-2 py-0.5 text-[11px] font-medium text-[#214055] dark:bg-[#0B3A63] dark:text-[#9ED4FF]"
                              >
                                <span className="material-icons text-[13px]">{item.icon}</span>
                                {item.label}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-[12px] font-medium text-[#c5221f] dark:text-[#ff8a80]">
                            No access
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap">{formatDwDate(row.createdAt)}</td>
                      <td>{row.parentUsername || "—"}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          title={`Edit access for ${row.username}`}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#9DBFBE] px-2 py-1 text-[12px] text-[#214055] hover:bg-white/60 dark:border-[#0062AD] dark:text-[#BDE1FF] dark:hover:bg-[#0E4A80]"
                        >
                          <span className="material-icons text-[15px]">tune</span>
                          Edit access
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editing && (
        <EditAccessModal
          teammate={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setReloadKey((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
