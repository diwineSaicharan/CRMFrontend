"use client";

import { useState } from "react";

import { PLAYER_CATEGORIES } from "./create-nav.config";
import {
  FORM_CONTROL,
  FORM_ROW,
  FormField,
  FormSection,
  SELECT_CONTROL,
  SectionHeader,
} from "./form-primitives";
import styles from "./CreateForm.module.css";

const HEADER_BUTTON =
  "flex items-center gap-2 rounded-[5px] border border-[rgba(93,150,189,0.3)] bg-white/40 px-4 py-2 " +
  "text-xs font-normal text-headings transition-all duration-200 active:translate-y-px " +
  "dark:border-[rgba(142,214,255,0.3)] dark:bg-[rgba(0,145,255,0.08)] dark:text-[#bde1ff]";

const SWITCH_OPTION =
  "relative z-[1] flex-1 basis-0 cursor-pointer rounded-full border-0 bg-transparent px-[18px] py-2 " +
  "text-[12.5px] font-medium whitespace-nowrap text-muted transition-colors duration-200 " +
  "aria-selected:font-semibold aria-selected:text-heading " +
  "dark:text-[rgba(158,212,255,0.7)] dark:aria-selected:text-[#d8eeff]";

export function CreateUserForm() {
  const [isRootUser, setIsRootUser] = useState(false);

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
                    className={FORM_CONTROL + " pr-10"}
                    placeholder="Enter password"
                  />
                  <span className="material-icons absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[18px] text-[#5D96BD] dark:text-[#8ed6ff]">
                    visibility
                  </span>
                </FormField>
                <FormField label="Confirm Password" icon="lock">
                  <input
                    type="password"
                    className={FORM_CONTROL + " pr-10"}
                    placeholder="Confirm password"
                  />
                  <span className="material-icons absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-[18px] text-[#5D96BD] dark:text-[#8ed6ff]">
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
                <div className="flex-1 p-1">
                  <label className="mb-2 block leading-[1.3] font-normal text-headings dark:text-[#bde1ff]">
                    Account Type
                  </label>
                  <div className="flex gap-6">
                    {["B2C", "B2B"].map((value) => (
                      <label
                        key={value}
                        className="flex cursor-pointer items-center gap-2 text-[13px] text-headings dark:text-[#bde1ff]"
                      >
                        <input
                          type="radio"
                          name="user-businessType"
                          value={value}
                          defaultChecked={value === "B2C"}
                          className="accent-accent"
                        />
                        {value}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection className="rounded-lg border shadow-md">
              <SectionHeader
                title="Ratio Settings"
                description="Configure percentage ratios for casino operators and sports."
              />
              <div className={FORM_ROW + " mt-2"}>
                <FormField
                  label="Sharing Ratio (%)"
                  icon="percent"
                  helper="Enter sharing ratio (0–100%)."
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
            </FormSection>
          </>
        )}
      </form>
    </div>
  );
}
