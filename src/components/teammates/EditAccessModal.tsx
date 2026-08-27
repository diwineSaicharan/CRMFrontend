"use client";

import { useState } from "react";

import { ApiError } from "@/lib/api";
import type { CrmCapability } from "@/lib/auth";
import { CRM_CAPABILITY_INFO, crmTeammateApi, type CrmTeammate } from "@/lib/crm-teammates";

/**
 * Change what an existing teammate reaches.
 *
 * The same cards as the create form, because the decision is the same one —
 * a different control here would make the two screens disagree about what
 * "Deposits" means.
 *
 * Deactivating is offered alongside the grants rather than instead of them:
 * revoking every capability and suspending the account are different intents,
 * and the server refuses the first (an account that can sign in and reach
 * nothing) while allowing the second.
 */
export function EditAccessModal({
  teammate,
  onClose,
  onSaved,
}: {
  teammate: CrmTeammate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [access, setAccess] = useState<Record<CrmCapability, boolean>>({
    ...teammate.permissions,
  });
  const [profileName, setProfileName] = useState(teammate.profileName ?? "");
  const [isActive, setIsActive] = useState(teammate.permissionsActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grantedCount = CRM_CAPABILITY_INFO.filter((item) => access[item.key]).length;

  const save = async () => {
    if (isActive && grantedCount === 0) {
      setError("Grant at least one access, or deactivate the profile instead.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await crmTeammateApi.updatePermissions(teammate.id, {
        profileName: profileName.trim() || null,
        isActive,
        ...access,
      });
      onSaved();
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.message ? caught.message : "Could not save access",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1200] grid place-items-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit access for ${teammate.username}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-xl border border-[#9DBFBE] bg-white shadow-2xl dark:border-[#0062AD] dark:bg-[#072B4C]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-between border-b border-[#9DBFBE] px-5 py-3.5 dark:border-[#0062AD]">
          <div>
            <h2 className="m-0 text-[16px] font-semibold text-[#214055] dark:text-[#D8EEFF]">
              Edit access
            </h2>
            <p className="m-0 mt-0.5 text-[12.5px] text-[#6a95b9] dark:text-[#9ED4FF]/80">
              {teammate.fullName || teammate.username} · {teammate.username}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-[#6a95b9] hover:bg-[#EAF3F3] dark:text-[#9ED4FF] dark:hover:bg-[#0E4A80]"
          >
            <span className="material-icons text-[18px]">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-auto overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-3 rounded-[0.4rem] border border-[#c5221f]/40 bg-[#c5221f]/10 px-3 py-2 text-[12.5px] text-[#c5221f] dark:text-[#ff8a80]">
              {error}
            </div>
          )}

          <label
            htmlFor="edit-profile-name"
            className="mb-1 block text-[10.5px] font-semibold tracking-wide text-[#6a95b9] uppercase dark:text-[#9ED4FF]/70"
          >
            Role name
          </label>
          <input
            id="edit-profile-name"
            type="text"
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            placeholder="e.g. Deposit Banker"
            className="mb-4 w-full rounded-[0.35rem] border border-[#9DBFBE] bg-white px-2.5 py-1.5 text-[13px] text-[#214055] outline-none dark:border-[#0062AD] dark:bg-[#08294A] dark:text-[#BDE1FF]"
          />

          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10.5px] font-semibold tracking-wide text-[#6a95b9] uppercase dark:text-[#9ED4FF]/70">
              CRM access
            </span>
            <span className="text-[12px] text-[#6a95b9] dark:text-[#9ED4FF]/70">
              {grantedCount} of {CRM_CAPABILITY_INFO.length} granted
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CRM_CAPABILITY_INFO.map((item) => {
              const on = access[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => {
                    setAccess((current) => ({ ...current, [item.key]: !current[item.key] }));
                    if (error) setError(null);
                  }}
                  className={
                    "flex cursor-pointer items-start gap-2.5 rounded-[0.5rem] border p-3 text-left transition-colors " +
                    (on
                      ? "border-[#34a853] bg-[#34a853]/10 dark:bg-[#34a853]/20"
                      : "border-[#cfe0e0] bg-white/55 hover:bg-white/80 dark:border-[#0091ff40] dark:bg-[#0091ff14] dark:hover:bg-[#006bbd29]")
                  }
                >
                  <span
                    className={
                      "material-icons flex-none text-[19px] " +
                      (on
                        ? "text-[#1e7c47] dark:text-[#6ee7a0]"
                        : "text-[#50708d] dark:text-[#9ed4ff]")
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-[#214055] dark:text-[#d8eeff]">
                      {item.label}
                    </span>
                    <span className="text-[11.5px] leading-snug text-[#6a95b9] dark:text-[#9ed4ffbf]">
                      {item.description}
                    </span>
                  </span>
                  <span
                    className={
                      "material-icons flex-none text-[18px] " +
                      (on ? "text-[#34a853]" : "text-[#b6cbcb] dark:text-[#9ed4ff73]")
                    }
                  >
                    {on ? "check_circle" : "radio_button_unchecked"}
                  </span>
                </button>
              );
            })}
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] text-[#214055] dark:text-[#BDE1FF]">
            <input
              type="checkbox"
              checked={!isActive}
              onChange={(event) => {
                setIsActive(!event.target.checked);
                if (error) setError(null);
              }}
            />
            Suspend this teammate — they can sign in but reach nothing
          </label>
        </div>

        <div className="flex flex-none justify-end gap-2 border-t border-[#9DBFBE] px-5 py-3.5 dark:border-[#0062AD]">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-md border border-[#9DBFBE] px-3.5 py-1.5 text-[13px] text-[#214055] disabled:opacity-60 dark:border-[#0062AD] dark:text-[#BDE1FF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="cursor-pointer rounded-md bg-[#16a34a] px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save access"}
          </button>
        </div>
      </div>
    </div>
  );
}
