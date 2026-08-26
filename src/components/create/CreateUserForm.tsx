"use client";

import { useState, type ReactNode } from "react";

import { PLAYER_CATEGORIES } from "./create-nav.config";
import {
  FORM_CONTROL,
  FORM_GROUP,
  FORM_LABEL,
  FORM_ROW,
  FormField,
  FormSection,
  PASSWORD_CONTROL,
  SELECT_CONTROL,
  SECTION_TITLE,
  SectionHeader,
  HelperText,
} from "./form-primitives";
import styles from "./CreateForm.module.css";

const HEADER_BUTTON =
  "flex items-center gap-2 rounded-[5px] border border-[rgba(93,150,189,0.3)] bg-white/40 px-4 py-2 " +
  "text-xs font-normal text-headings transition-all duration-200 active:translate-y-px " +
  // `.dl-list-button, .reset-button` dark: rgba(0,98,198,0.18) fill,
  // rgba(0,98,198,0.6) edge, #bde1ff ink, lifting to 0.28 on hover.
  "dark:border-[rgba(0,98,198,0.6)] dark:bg-[rgba(0,98,198,0.18)] dark:text-[#bde1ff] " +
  "dark:hover:bg-[rgba(0,98,198,0.28)]";

const SWITCH_OPTION =
  "relative z-[1] flex-1 basis-0 cursor-pointer rounded-full border-0 bg-transparent px-[18px] py-2 " +
  "text-[12.5px] font-medium whitespace-nowrap text-muted transition-colors duration-200 " +
  "aria-selected:font-semibold aria-selected:text-heading " +
  "dark:text-[rgba(158,212,255,0.7)] dark:aria-selected:text-[#d8eeff]";

/* `.mini-action` — Select All / Reload. */
const MINI_ACTION =
  "inline-flex items-center gap-1 rounded border border-[rgba(156,201,224,1)] bg-transparent px-2.5 py-1 " +
  "text-xs leading-[1.2] font-normal text-headings transition-[background,border-color] duration-200 " +
  "hover:border-[#B2CACA] hover:bg-[#b0d2d2] hover:text-white " +
  "dark:border-[rgba(0,98,198,0.6)] dark:text-[#bde1ff] dark:hover:bg-[rgba(0,98,198,0.28)] dark:hover:text-[#d8eeff]";

/* `.platform-option` — a pill whose checkbox is drawn in its 32px left inset. */
const PLATFORM_OPTION =
  "relative flex min-h-[30px] cursor-pointer items-center gap-1.5 rounded-2xl border " +
  "border-[rgba(66,133,244,0.18)] bg-white/80 py-1.5 pr-2.5 text-xs font-medium text-[#37474f] " +
  "select-none transition-[background,border-color,box-shadow] duration-250 " +
  "hover:border-[rgba(66,133,244,0.4)] hover:bg-white " +
  "dark:border-[rgba(158,212,255,0.15)] dark:bg-transparent dark:text-[#bde1ff] " +
  styles.platformOption;

/* `.form-actions button` / `.secondary-button`. */
const ACTION_BUTTON =
  "flex h-10 cursor-pointer items-center justify-center rounded-lg border " +
  "border-[rgba(93,150,189,0.3)] bg-white/40 px-6 text-sm text-headings " +
  "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-60 " +
  "dark:border-[rgba(0,98,198,0.6)] dark:bg-[rgba(0,98,198,0.18)] dark:text-[#bde1ff] " +
  "dark:hover:bg-[rgba(0,98,198,0.28)]";

/* Placeholder list until CRMBackend serves `/platforms`. */
const PLATFORMS = ["Bahubali The Conclusion", "Platform Dummy", "Sikander Exchange"];

/** `.sub-section-title` — an icon plus a 16px heading. */
function SubSectionTitle({
  icon,
  children,
}: {
  icon: string;
  children: ReactNode;
}) {
  return (
    <h4 className="mb-4 flex items-center gap-3 text-[16px] font-normal text-headings dark:text-[#bde1ff]">
      <span className="material-icons text-[20px]">{icon}</span>
      {children}
    </h4>
  );
}

/** `.section-box` — a nested panel inside a form section. */
function SectionBox({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "mt-4 rounded-lg bg-transparent p-2.5 pt-1.5 " +
        "dark:border dark:border-[rgba(158,212,255,0.08)] dark:bg-[rgba(0,39,77,0.85)] " +
        className
      }
    >
      {children}
    </div>
  );
}

/** `.no-data-message` — stacked icon and caption. */
function EmptyState({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-[#5D96BD] dark:text-[#bde1ff]">
      <span className="material-icons mb-3 text-[32px] opacity-70">{icon}</span>
      <p className="m-0">{children}</p>
    </div>
  );
}

/** `.radio-group` — 24px-apart options using the module's custom radio. */
function RadioGroup({
  name,
  options,
  defaultValue,
  value,
  onChange,
}: {
  name: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
  value?: string;
  onChange?: (next: string) => void;
}) {
  return (
    <div className="mt-2.5 flex gap-6">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center text-[13px] text-headings dark:text-[#bde1ff]"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            className={styles.radio}
            {...(value === undefined
              ? { defaultChecked: option.value === defaultValue }
              : {
                  checked: value === option.value,
                  onChange: () => onChange?.(option.value),
                })}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

/**
 * `.lock-card` — the checkbox means "is locked", so the slider and glyph read
 * green while open and red once restricted.
 */
function LockCard({
  title,
  description,
  locked,
  onToggle,
}: {
  title: string;
  description: string;
  locked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={
        "relative flex flex-col gap-3 rounded-xl border p-5 transition-all duration-300 " +
        "hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] " +
        "dark:border-[rgba(158,212,255,0.08)] dark:bg-[rgba(0,39,77,0.85)] dark:shadow-none " +
        (locked
          ? "border-[rgba(211,47,47,0.1)] bg-[rgba(211,47,47,0.02)]"
          : "border-[rgba(93,150,189,0.2)] bg-white/40")
      }
    >
      <div className="flex items-center gap-3">
        <span
          className={
            "material-icons text-2xl transition-colors duration-300 " +
            (locked ? "text-[#d32f2f]" : "text-[#4CAF50] dark:text-[#00D26A]")
          }
        >
          {locked ? "lock" : "lock_open"}
        </span>
        <h4
          className={
            "m-0 text-[16px] font-medium " +
            (locked ? "text-[#d32f2f]" : "text-headings dark:text-[#bde1ff]")
          }
        >
          {title}
        </h4>
      </div>
      <p className="m-0 text-[13px] leading-[1.4] text-[#5D96BD] dark:text-[#bde1ff]">
        {description}
      </p>
      <label className={styles.switch}>
        <input type="checkbox" checked={locked} onChange={onToggle} />
        <span className={styles.slider} />
      </label>
    </div>
  );
}

export function CreateUserForm() {
  const [isRootUser, setIsRootUser] = useState(false);
  const [enableInitialBonus, setEnableInitialBonus] = useState(false);
  const [bonusMode, setBonusMode] = useState("amount");
  const [locks, setLocks] = useState({ bet: false, sports: false, casino: false });

  const toggleLock = (key: keyof typeof locks) =>
    setLocks((current) => ({ ...current, [key]: !current[key] }));

  /** Comes from the parent's profile once the API is wired. */
  const parentSharingRatio = 0;

  return (
    <div
      className={
        styles.formScroll +
        " h-auto min-h-0 w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto bg-transparent pt-0 pb-8"
      }
    >
      <form className="w-full">
        <FormSection>
          {/* ── header ───────────────────────────────────────────────────── */}
          <div
            className={
              styles.sectionRule +
              " mb-3.5 flex items-center justify-between pb-2.5 max-md:flex-col max-md:items-start max-md:gap-3"
            }
          >
            <h2 className="m-0 text-[16px] leading-none font-medium text-headings dark:text-[#bde1ff]">
              User Information
            </h2>
            <div className="flex gap-3 max-md:w-full max-md:flex-wrap">
              <button type="button" className={HEADER_BUTTON}>
                <span className="material-icons text-[18px]">list</span>
                User List
              </button>
              <button type="button" className={HEADER_BUTTON + " !rounded-lg"}>
                <span className="material-icons me-2 text-[16px]">refresh</span>
                Reset
              </button>
            </div>
          </div>

          {/* ── account type ─────────────────────────────────────────────── */}
          <div className="mb-[18px] flex items-center justify-between gap-6 rounded-[10px] border border-white/90 bg-white/55 px-[18px] py-3.5 dark:border-[rgba(0,145,255,0.2)] dark:bg-[rgba(0,145,255,0.08)]">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-semibold text-headings dark:text-[#d8eeff]">
                Account Type
              </span>
              <span className="max-w-[60ch] text-[11.5px] leading-[1.45] text-muted dark:text-[rgba(158,212,255,0.75)]">
                {isRootUser
                  ? "No DL, Super or Master above them — deposits and withdrawals never move anyone else’s chips. A random password is generated automatically."
                  : "Standard player created under a master in the hierarchy."}
              </span>
            </div>

            <div
              className="relative flex flex-none gap-0.5 rounded-full border border-[rgba(163,190,209,0.6)] bg-white/75 p-1 dark:border-[rgba(0,145,255,0.28)] dark:bg-[rgba(0,145,255,0.1)]"
              role="tablist"
            >
              <span
                aria-hidden="true"
                className={
                  styles.switchThumb + (isRootUser ? " " + styles.switchThumbRoot : "")
                }
              />
              <button
                type="button"
                role="tab"
                aria-selected={!isRootUser}
                onClick={() => setIsRootUser(false)}
                className={SWITCH_OPTION}
              >
                Normal User
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRootUser}
                onClick={() => setIsRootUser(true)}
                className={SWITCH_OPTION}
              >
                Dummy Platform User
              </button>
            </div>
          </div>

          {/* ── identity ─────────────────────────────────────────────────── */}
          <div className={FORM_ROW}>
            <FormField label="Full Name" required icon="person">
              <input type="text" className={FORM_CONTROL} placeholder="Enter full name" />
            </FormField>
            <FormField label="Username" required icon="account_circle">
              <input type="text" className={FORM_CONTROL} placeholder="Enter username" />
            </FormField>
            <FormField label="Mobile Number" icon="phone">
              <input
                type="tel"
                className={FORM_CONTROL}
                placeholder="Enter mobile number"
              />
            </FormField>
            <FormField label="Category" icon="label">
              <select className={SELECT_CONTROL} defaultValue="D1">
                {PLAYER_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {isRootUser ? (
            <div className={FORM_ROW}>
              <FormField label="Platform" fullWidth>
                <select className={SELECT_CONTROL + " !pl-3"} defaultValue="">
                  <option value="">Select Platform</option>
                </select>
              </FormField>
            </div>
          ) : (
            <>
              {/* ── credentials ──────────────────────────────────────────── */}
              <div className={FORM_ROW}>
                <FormField label="Password" icon="lock">
                  <input
                    type="password"
                    className={PASSWORD_CONTROL + " pr-10"}
                    placeholder="Enter password"
                  />
                  <span className="material-icons absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[18px] text-[#5D96BD] dark:text-[#bde1ff]">
                    visibility
                  </span>
                </FormField>
                <FormField label="Confirm Password" icon="lock">
                  <input
                    type="password"
                    className={PASSWORD_CONTROL + " pr-10"}
                    placeholder="Confirm password"
                  />
                  <span className="material-icons absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[18px] text-[#5D96BD] dark:text-[#bde1ff]">
                    visibility
                  </span>
                </FormField>
              </div>

              {/* ── upline ───────────────────────────────────────────────── */}
              <div className={FORM_ROW}>
                <FormField label="Select Master" fullWidth>
                  <input
                    type="text"
                    className={FORM_CONTROL + " !pl-3.5"}
                    placeholder="Search or select Master..."
                  />
                </FormField>
              </div>

              {/* ── bet winning limits ───────────────────────────────────── */}
              <div className={FORM_ROW}>
                <FormField
                  label="Max Bet Winning Multiplier"
                  icon="trending_up"
                  helper="Maximum multiplier for bet winnings. Common values: 1, 2, 3, 5, or 10."
                >
                  <input
                    type="number"
                    min={1}
                    step={1}
                    defaultValue={1}
                    className={FORM_CONTROL}
                  />
                </FormField>
                <FormField
                  label="Max Bet Winning Amount"
                  icon="account_balance"
                  helper="Maximum amount that can be won on a single bet. 0 means no limit."
                >
                  <input
                    type="number"
                    min={0}
                    defaultValue={0}
                    className={FORM_CONTROL}
                  />
                </FormField>
              </div>

              {/* ── wallet limits ────────────────────────────────────────── */}
              <div className={FORM_ROW}>
                <FormField
                  label="Max Wallet Limit Warning"
                  icon="warning"
                  helper="Wallet balance threshold that triggers Maximum Bet limit to 50%."
                >
                  <input
                    type="number"
                    min={0}
                    defaultValue={0}
                    className={FORM_CONTROL}
                  />
                </FormField>
                <FormField
                  label="Max Wallet Limit Final"
                  icon="block"
                  helper="Maximum wallet balance allowed. User cannot exceed this limit. 0 means no limit."
                >
                  <input
                    type="number"
                    min={0}
                    defaultValue={0}
                    className={FORM_CONTROL}
                  />
                </FormField>
              </div>

              {/* ── deposit limits ───────────────────────────────────────── */}
              <div className={FORM_ROW}>
                <FormField
                  label="Min Deposit Limit"
                  icon="arrow_downward"
                  helper="Minimum amount required for each deposit transaction. 0 means no minimum."
                >
                  <input
                    type="number"
                    min={0}
                    defaultValue={0}
                    className={FORM_CONTROL}
                  />
                </FormField>
                <FormField
                  label="Max Deposit Limit"
                  icon="arrow_upward"
                  helper="Maximum amount allowed for each deposit transaction. 0 means no limit."
                >
                  <input
                    type="number"
                    min={0}
                    defaultValue={0}
                    className={FORM_CONTROL}
                  />
                </FormField>
              </div>
            </>
          )}
        </FormSection>

        {!isRootUser && (
          <>
            <FormSection className="rounded-lg border shadow-md">
              <SectionHeader
                title="Choose Type"
                description="Business type for this user. Chosen independently — not inherited from the parent."
              />
              <div className={FORM_ROW}>
                <div className={FORM_GROUP}>
                  <label className={FORM_LABEL}>Account Type</label>
                  <RadioGroup
                    name="user-businessType"
                    options={[
                      { value: "B2C", label: "B2C" },
                      { value: "B2B", label: "B2B" },
                    ]}
                    defaultValue="B2C"
                  />
                </div>
              </div>
            </FormSection>

            {/* ── Commission Settings ─────────────────────────────────────── */}
            <FormSection className="rounded-lg border shadow-md">
              <SectionHeader
                title="Commission Settings"
                description="Configure commission percentages for different betting categories."
              />

              <SectionBox>
                <SubSectionTitle icon="trending_up">Betting Commission</SubSectionTitle>

                <div className={FORM_ROW}>
                  <div className={FORM_GROUP}>
                    <label className={FORM_LABEL}>Liability Type</label>
                    <RadioGroup
                      name="liabilityType"
                      options={[
                        { value: "fixed", label: "Fixed" },
                        { value: "recurring", label: "Recurring" },
                      ]}
                      defaultValue="fixed"
                    />
                  </div>
                  <FormField label="Betfair Commission (%)" icon="percent">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Enter betfair commission"
                      className={FORM_CONTROL}
                    />
                  </FormField>
                </div>

                <div className={FORM_ROW}>
                  <FormField label="Commission on Bookmaker (%)" icon="percent">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Enter commission on bookmaker"
                      className={FORM_CONTROL}
                    />
                  </FormField>
                  <FormField label="Commission on Fancy (%)" icon="percent">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Enter commission on fancy"
                      className={FORM_CONTROL}
                    />
                  </FormField>
                </div>
              </SectionBox>
            </FormSection>

            {/* ── Ratio Settings ──────────────────────────────────────────── */}
            <FormSection className="rounded-lg border shadow-md">
              <SectionHeader
                title="Ratio Settings"
                description="Configure percentage ratios for casino operators and sports."
              />

              <div className={FORM_ROW + " mt-2"}>
                <FormField
                  label="Sharing Ratio (%)"
                  icon="percent"
                  helper={
                    <>
                      Enter sharing ratio (0–100%). Parent ratio:{" "}
                      <strong>{parentSharingRatio}%</strong>
                    </>
                  }
                >
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="100"
                    className={FORM_CONTROL}
                  />
                </FormField>
              </div>

              <SectionBox className="rounded-md p-4 shadow-md">
                <SubSectionTitle icon="casino">Casino Ratios</SubSectionTitle>
                {/* Operators come from the API; until CRMBackend serves them the
                    reference's own empty state is what renders. */}
                <EmptyState icon="casino">No casino operators available</EmptyState>
              </SectionBox>

              <div className="mt-2 rounded-lg bg-white/40 p-4 dark:border dark:border-[rgba(158,212,255,0.08)] dark:bg-[rgba(0,39,77,0.85)]">
                <SubSectionTitle icon="sports_soccer">Sports Ratios</SubSectionTitle>
                <div className="mb-2 flex items-center gap-2.5 px-1.5 pb-3 text-[16px] font-semibold text-headings dark:text-[#bde1ff]">
                  <div>Operator Name</div>
                  <div>Status</div>
                  <div>Ratio (%)</div>
                </div>
                <EmptyState icon="sports_soccer">
                  No sports operators available
                </EmptyState>
              </div>
            </FormSection>

            {/* ── Lock Settings ───────────────────────────────────────────── */}
            <FormSection>
              <SectionHeader
                title="Lock Settings"
                description="Manage account restrictions. By default, all betting activities are locked for safety."
              />
              <div className="mt-4 grid grid-cols-3 gap-6 max-[1200px]:grid-cols-2 max-md:grid-cols-1 max-md:gap-4">
                <LockCard
                  title="Bet Lock"
                  description="Complete betting restriction for this user."
                  locked={locks.bet}
                  onToggle={() => toggleLock("bet")}
                />
                <LockCard
                  title="Sports Lock"
                  description="Restrict access to all sports and exchange markets."
                  locked={locks.sports}
                  onToggle={() => toggleLock("sports")}
                />
                <LockCard
                  title="Casino Lock"
                  description="Restrict access to all casino and live games."
                  locked={locks.casino}
                  onToggle={() => toggleLock("casino")}
                />
              </div>
            </FormSection>

            {/* ── Bonus on Creation ───────────────────────────────────────── */}
            <FormSection>
              <h3 className={SECTION_TITLE}>
                <span className="material-icons me-1.5 align-middle text-[20px]">
                  card_giftcard
                </span>
                Bonus on Creation
                <span className="ms-2 text-[10px] font-normal text-[#5D96BD]">
                  (Optional)
                </span>
              </h3>

              <div className={FORM_ROW + " items-center"}>
                <div className="flex-none p-1">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-headings dark:text-[#bde1ff]">
                    <input
                      type="checkbox"
                      checked={enableInitialBonus}
                      onChange={(event) => setEnableInitialBonus(event.target.checked)}
                    />
                    Grant a bonus immediately after user is created
                  </label>
                </div>
              </div>

              {enableInitialBonus && (
                <>
                  <div className={FORM_ROW}>
                    <FormField label="Bonus Plan">
                      <select className={SELECT_CONTROL + " !pl-3.5"} defaultValue="">
                        <option value="">-- Select Bonus Type --</option>
                      </select>
                    </FormField>
                  </div>

                  <div className={FORM_ROW}>
                    <div className={FORM_GROUP}>
                      <label className={FORM_LABEL}>Bonus Amount Mode</label>
                      <RadioGroup
                        name="initBonusMode"
                        options={[
                          { value: "amount", label: "Fixed Amount" },
                          { value: "percent", label: "% of Initial Deposit" },
                        ]}
                        value={bonusMode}
                        onChange={setBonusMode}
                      />
                    </div>
                  </div>

                  <div className={FORM_ROW}>
                    {bonusMode === "amount" ? (
                      <FormField label="Bonus Amount (₹)" icon="currency_rupee">
                        <input
                          type="number"
                          min={1}
                          placeholder="e.g. 500"
                          className={FORM_CONTROL}
                        />
                      </FormField>
                    ) : (
                      <FormField label="Bonus % (of initial deposit)" icon="percent">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          placeholder="e.g. 10"
                          className={FORM_CONTROL}
                        />
                      </FormField>
                    )}
                    <FormField label="Priority" helper="Lower = used first">
                      <input
                        type="number"
                        min={1}
                        placeholder="1"
                        className={FORM_CONTROL + " !pl-3.5"}
                      />
                    </FormField>
                  </div>
                </>
              )}
            </FormSection>

            {/* ── Platform Access ─────────────────────────────────────────── */}
            <div className={FORM_ROW}>
              <div className={FORM_GROUP + " flex-none basis-full"}>
                <label className={FORM_LABEL}>Platform Access</label>
                <div className="flex flex-col gap-2 rounded-lg border border-[rgba(66,133,244,0.15)] bg-transparent px-3.5 pt-3 pb-2.5 transition-[border-color,box-shadow] duration-250 hover:border-[rgba(66,133,244,0.3)] hover:shadow-[0_2px_8px_rgba(66,133,244,0.08)] dark:border-[rgba(158,212,255,0.15)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="material-icons text-[18px] text-[#5D96BD] dark:text-[#bde1ff]">
                        apps
                      </span>
                      <span className="text-[13px] text-headings dark:text-[#bde1ff]">
                        Select platforms (leave empty to inherit all)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className={MINI_ACTION}>
                        Select All
                      </button>
                      <button type="button" className={MINI_ACTION}>
                        Reload
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {PLATFORMS.map((platform) => (
                      <label key={platform} className={PLATFORM_OPTION}>
                        <input type="checkbox" />
                        <span className={styles.check} />
                        <span className="font-medium">{platform}</span>
                      </label>
                    ))}
                  </div>

                  <HelperText>Will inherit parent&apos;s full platform access</HelperText>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── actions ───────────────────────────────────────────────────── */}
        <div className="mb-4 flex shrink-0 justify-end gap-3">
          <button type="button" className={ACTION_BUTTON}>
            Reset
          </button>
          <button type="submit" className={ACTION_BUTTON}>
            <span className="material-icons me-2 text-[18px]">add_circle</span>
            Create User
          </button>
        </div>
      </form>
    </div>
  );
}
