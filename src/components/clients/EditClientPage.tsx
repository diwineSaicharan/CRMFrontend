"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { fetchClient, updateClient, type Client } from "@/lib/clients";
import { getLeadSources } from "@/lib/lead-sources";
import { getAllPlatforms, type Platform } from "@/lib/platforms";
import { PLAYER_CATEGORIES } from "@/components/create/create-nav.config";
import { HeaderSlot } from "@/components/layout/HeaderSlot";
import { SearchableSelect } from "@/components/quick-create/SearchableSelect";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  FIELD_CONTROL,
  FIELD_LABEL,
  platformCheckClass,
  platformChipClass,
} from "@/components/ui/form-chrome";

/**
 * /clients/:id/edit — editing a client as a page rather than a modal.
 *
 * The sheet, the fields and the buttons are the Create User sheet's, imported
 * from form-chrome rather than re-typed, so the two cannot drift apart. Being a
 * real route is what makes Cancel and the sidebar behave: leaving is a
 * navigation, not a piece of local state.
 */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className={FIELD_LABEL}>{label}</label>
      {children}
    </div>
  );
}

export function EditClientPage({ clientId }: { clientId: string }) {
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loadError, setLoadError] = useState("");

  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [altMobile, setAltMobile] = useState("");
  const [doj, setDoj] = useState("");
  const [location, setLocation] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [category, setCategory] = useState("");
  const [platformIds, setPlatformIds] = useState<string[]>([]);

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchClient(clientId)
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setLoadError("User not found");
          return;
        }
        setClient(row);
        setFullName(row.fullName ?? "");
        setMobileNumber(row.mobileNumber ?? "");
        setAltMobile(row.alternateMobileNumber ?? "");
        // The column is a `date`, but pg hands back an ISO timestamp — the
        // input needs bare YYYY-MM-DD or it renders empty.
        setDoj((row.dateOfJoining ?? "").slice(0, 10));
        setLocation(row.location ?? "");
        setLeadSource(row.leadSource ?? "");
        setCategory(row.category ?? "");
        setPlatformIds(row.platformIds ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Failed to load user");
      });

    getAllPlatforms(true)
      .then((rows) => {
        if (!cancelled) setPlatforms(rows);
      })
      .catch(() => undefined);

    getLeadSources()
      .then((rows) => {
        if (!cancelled) setLeadSources(rows);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const leadSourceOptions = useMemo(
    () => leadSources.map((source) => ({ value: source, label: source })),
    [leadSources],
  );

  const categoryOptions = useMemo(
    () => PLAYER_CATEGORIES.map((value) => ({ value, label: value })),
    [],
  );

  /** Back to the client that was being edited, not the bare list. */
  const backToClient = () =>
    router.push(`/clients/${encodeURIComponent(clientId)}`);

  const togglePlatform = (id: string) =>
    setPlatformIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );

  const save = async () => {
    // No client-side format checks here on purpose: this screen edits rows
    // that already exist, including ones created before any rule was in place,
    // so refusing to save an untouched field would strand them. `error` still
    // surfaces whatever the API rejects.
    setError("");
    setSaving(true);
    try {
      await updateClient(clientId, {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim() || null,
        alternateMobileNumber: altMobile.trim() || null,
        dateOfJoining: doj || null,
        location: location.trim() || null,
        leadSource: leadSource || null,
        category: category || undefined,
        platformIds,
      });
      // The list refetches on mount, so it picks the saved row up on arrival.
      backToClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      <HeaderSlot>
        <div className="flex w-full min-w-0 items-center gap-5 min-[1440px]:pl-[0.7rem]">
          <h2 className="m-0 shrink-0 font-condensed text-[15px] leading-none font-medium whitespace-nowrap text-headings dark:text-[#bde1ff]">
            Edit User
          </h2>
        </div>
      </HeaderSlot>

      {/* The Create User sheet, as a page: same 980px width, same translucent
          shell around an inner card. */}
      <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
        <div className="h-full w-[980px] max-w-full rounded-[10px] border border-white/45 bg-white/28 px-[7.5px] py-[9px] text-[#1d4268] shadow-[0_20px_60px_rgba(20,60,95,0.12)] backdrop-blur-[26px] backdrop-saturate-125 dark:border-[rgba(0,145,255,0.22)] dark:bg-[rgba(0,43,82,0.3)] dark:text-[#d8eeff]">
          <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white/58 dark:bg-[rgba(0,43,82,0.62)]">
            <div className="flex items-center justify-between gap-4 px-[27.5px] pt-[26px] pb-[18px]">
              <h2 className="font-condensed text-[20px] leading-none font-semibold text-[#214055] dark:text-[#d8eeff]">
                Edit User
                {client && (
                  <span className="ms-2 text-[15px] font-normal opacity-75">
                    {client.username}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={backToClient}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D9E3E8] bg-white text-[#B8C4D0] transition-all hover:border-[#2140554D] hover:text-[#214055] dark:border-[#0A66C2] dark:bg-transparent dark:text-[#BDE1FF] dark:hover:text-[#D8EEFF]"
              >
                <span className="material-icons text-[24px]">close</span>
              </button>
            </div>

            <div className="shell-scroll min-h-0 flex-1 overflow-y-auto px-[27.5px]">
              {loadError && (
                <div className="mb-3 rounded-lg border border-[rgba(220,38,38,0.35)] bg-[rgba(220,38,38,0.07)] px-3 py-[9px] text-[12.5px] text-[#b91c1c]">
                  {loadError}
                </div>
              )}

              {!loadError && !client && (
                <p className="py-6 text-center font-condensed text-[13px] text-[#1d4268] dark:text-[rgba(158,212,255,0.75)]">
                  Loading user…
                </p>
              )}

              {client && (
                <>
                  {error && (
                    <div className="mb-3 rounded-lg border border-[rgba(220,38,38,0.35)] bg-[rgba(220,38,38,0.07)] px-3 py-[9px] text-[12.5px] text-[#b91c1c]">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-x-5 sm:grid-cols-2">
                    <Field label="Platform">
                      <div className="flex flex-wrap gap-2">
                        {platforms.length === 0 && (
                          <span className="font-condensed text-[13px] text-[#1d4268] dark:text-[rgba(158,212,255,0.75)]">
                            Loading platforms…
                          </span>
                        )}
                        {platforms.map((platform) => {
                          const selected = platformIds.includes(platform.id);
                          return (
                            <button
                              key={platform.id}
                              type="button"
                              onClick={() => togglePlatform(platform.id)}
                              aria-pressed={selected}
                              className={platformChipClass(selected)}
                            >
                              <span
                                aria-hidden="true"
                                className={platformCheckClass(selected)}
                              >
                                {selected ? "✓" : ""}
                              </span>
                              {platform.name}
                            </button>
                          );
                        })}
                      </div>
                    </Field>

                    <Field label="Name">
                      <input
                        type="text"
                        className={FIELD_CONTROL}
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Enter name"
                      />
                    </Field>

                    <Field label="Mobile Number">
                      <input
                        type="tel"
                        className={FIELD_CONTROL}
                        value={mobileNumber}
                        onChange={(event) => setMobileNumber(event.target.value)}
                        placeholder="Enter mobile number"
                      />
                    </Field>

                    <Field label="Alternate Mobile No">
                      <input
                        type="tel"
                        className={FIELD_CONTROL}
                        value={altMobile}
                        onChange={(event) => setAltMobile(event.target.value)}
                        placeholder="Optional"
                      />
                    </Field>

                    <Field label="DOJ">
                      <input
                        type="date"
                        className={
                          FIELD_CONTROL +
                          " [color-scheme:light] dark:[color-scheme:dark]"
                        }
                        value={doj}
                        onChange={(event) => setDoj(event.target.value)}
                      />
                    </Field>

                    <Field label="Location">
                      <input
                        type="text"
                        className={FIELD_CONTROL}
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="Enter location"
                      />
                    </Field>

                    <Field label="Lead Source">
                      <SearchableSelect
                        className={FIELD_CONTROL}
                        value={leadSource}
                        onChange={setLeadSource}
                        loading={leadSources.length === 0}
                        options={leadSourceOptions}
                      />
                    </Field>

                    <Field label="Category">
                      <SearchableSelect
                        className={FIELD_CONTROL}
                        value={category}
                        onChange={setCategory}
                        placeholder="Select Category"
                        options={categoryOptions}
                      />
                    </Field>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2.5 px-[27.5px] pt-3 pb-[22px]">
              <button type="button" onClick={backToClient} className={BTN_GHOST}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !client}
                className={BTN_PRIMARY}
              >
                <span className="material-icons text-[18px]">check_circle</span>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
