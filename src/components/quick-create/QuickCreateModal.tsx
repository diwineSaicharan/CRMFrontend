"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./QuickCreateModal.module.css";

import {
  dwApi,
  type BonusPreview,
  type DwUser,
  type OperationBank,
  type PayoutProfile,
  type QuickCreateKind,
  type UserPlatform,
} from "@/lib/deposit-withdrawal";
import { useQuickCreate } from "./QuickCreateProvider";

/* ── shared class strings (ported from quick-create.component.scss) ───────── */

const FIELD_LABEL =
  "mb-[7px] block font-condensed text-[15px] leading-none font-normal text-black dark:text-[#9ed4ff]";

const FIELD_CONTROL =
  "h-10 w-full max-w-[729px] rounded-[5px] border-[0.5px] border-[rgba(163,190,209,0.5)] " +
  "bg-white/50 px-[14px] font-condensed text-[15px] leading-none text-[#1d4268] backdrop-blur-[6px] " +
  "transition-[border-color,box-shadow] duration-200 placeholder:text-[#1d4268] placeholder:opacity-100 " +
  "focus:border-[#2f80d6] focus:shadow-[0_0_0_1px_rgba(47,128,214,0.35)] focus:outline-none " +
  "dark:border-[rgba(0,145,255,0.2)] dark:bg-[rgba(0,145,255,0.08)] dark:text-[#9ed4ff] " +
  "dark:placeholder:text-[#9ed4ff]";

/* Native selects do not inherit the popup surface, so options are coloured too
   — otherwise dark mode renders near-white text on the browser's white sheet. */
const SELECT_CONTROL =
  FIELD_CONTROL +
  " " + styles.select + " appearance-none pr-[34px] [&>option]:bg-white [&>option]:text-[#1d4268] " +
  "dark:[&>option]:bg-[#002b52] dark:[&>option]:text-[#9ed4ff]";

const TEXTAREA_CONTROL =
  FIELD_CONTROL.replace("h-10", "min-h-[74px] h-auto").replace(
    "px-[14px]",
    "px-[14px] py-[11px]",
  ) + " resize-y";

const BTN =
  "inline-flex h-10 items-center justify-center gap-[7px] rounded-[5px] border border-[#9cc9e0] " +
  "px-4 font-condensed text-[15px] leading-5 font-medium tracking-[0.015em] text-[#0e5484] " +
  "transition-[background,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-65 " +
  "dark:text-[#9ed4ff]";

const BTN_GHOST =
  BTN +
  " w-[70px] bg-white/60 hover:not-disabled:bg-white " +
  "dark:border-[rgba(0,145,255,0.22)] dark:bg-[rgba(0,145,255,0.08)]";

const BTN_PRIMARY =
  BTN +
  " min-w-[145px] bg-[rgba(185,207,209,0.5)] backdrop-blur-[6px] " +
  "dark:border-[rgba(0,145,255,0.35)] dark:bg-[rgba(0,145,255,0.22)]";

const PLAYER_CATEGORIES = ["D1", "D2", "D3", "D4"];

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className={FIELD_LABEL}>
        {label}
        {required && <span className="ml-px text-[#dc2626]">*</span>}
      </label>
      {children}
    </div>
  );
}

const TITLES: Record<QuickCreateKind, { title: string; tag: string; submit: string }> = {
  user: { title: "Create User", tag: "User", submit: "Create User" },
  deposit: { title: "Create Deposit", tag: "Deposit", submit: "Create Deposit" },
  withdrawal: {
    title: "Create Withdrawal",
    tag: "Withdrawal",
    submit: "Create Withdrawal",
  },
};

export function QuickCreateModal() {
  const { kind, close } = useQuickCreate();
  if (!kind) return null;

  // Keyed by kind, so switching forms remounts with fresh state instead of
  // needing a hand-written reset for every field.
  return <QuickCreateForm key={kind} kind={kind} close={close} />;
}

function QuickCreateForm({
  kind,
  close,
}: {
  kind: QuickCreateKind;
  close: () => void;
}) {
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Shared
  const [platformId, setPlatformId] = useState("");
  const [platforms, setPlatforms] = useState<UserPlatform[]>([]);
  const [remarks, setRemarks] = useState("");

  // User picker (deposit + withdrawal)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DwUser[]>([]);
  /** Which query `searchResults` belongs to — lets "searching" be derived. */
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DwUser | null>(null);

  // Create user
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newCategory, setNewCategory] = useState("");

  // Deposit
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [banks, setBanks] = useState<OperationBank[]>([]);
  const [bankId, setBankId] = useState("");
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [receiptDataUrl, setReceiptDataUrl] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [bonusPreview, setBonusPreview] = useState<BonusPreview | null>(null);

  // Withdrawal
  const [payoutMethod, setPayoutMethod] = useState("BANK_TRANSFER");
  const [payoutProfiles, setPayoutProfiles] = useState<PayoutProfile[]>([]);
  const [payoutProfileId, setPayoutProfileId] = useState("");
  const [showAddBank, setShowAddBank] = useState(false);
  const [addBankError, setAddBankError] = useState("");
  const [addingBank, setAddingBank] = useState(false);
  const [newBankHolder, setNewBankHolder] = useState("");
  const [newBankAccount, setNewBankAccount] = useState("");
  const [newBankIfsc, setNewBankIfsc] = useState("");
  const [newBankName, setNewBankName] = useState("");

  const copy = TITLES[kind];
  const handleClose = close;

  // Reference data. Failures are silent: an empty dropdown is a better outcome
  // than an error banner over a form the user has not filled in yet.
  useEffect(() => {
    dwApi
      .getUserPlatforms()
      .then((res) => setPlatforms(res.data ?? []))
      .catch(() => setPlatforms([]));

    if (kind === "deposit") {
      dwApi
        .getBanks()
        .then((res) => setBanks(res.data ?? []))
        .catch(() => setBanks([]));
    }
  }, [kind]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const query = searchQuery.trim();
  const queryIsSearchable = query.length >= 2;

  // Debounced user search. Nothing is set synchronously here: the results carry
  // the query they belong to, so both "searching" and "which rows are current"
  // fall out of a comparison at render time.
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!queryIsSearchable) return;

    searchTimer.current = setTimeout(() => {
      dwApi
        .searchUsers(query)
        .then((res) => setSearchResults(res.data ?? []))
        .catch(() => setSearchResults([]))
        .finally(() => setResultsFor(query));
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, queryIsSearchable]);

  const resultsAreCurrent = resultsFor === query;
  const isSearching = queryIsSearchable && !resultsAreCurrent;
  const visibleResults = queryIsSearchable && resultsAreCurrent ? searchResults : [];

  const selectUser = (user: DwUser) => {
    setSelectedUser(user);
    setSearchQuery(user.username);
    setShowSearchResults(false);

    if (kind === "withdrawal") {
      dwApi
        .getPayoutProfiles(user.id)
        .then((res) => setPayoutProfiles(res.data ?? []))
        .catch(() => setPayoutProfiles([]));
    }
  };

  const amountValue = Number(amount);
  const amountIsValid = Number.isFinite(amountValue) && amountValue > 0;

  // Bonus preview follows the amount, for deposits only. As with the search
  // above, a stale preview is hidden on render rather than cleared in state.
  const selectedUserId = selectedUser?.id;
  useEffect(() => {
    if (kind !== "deposit" || !selectedUserId || !amountIsValid) return;

    const timer = setTimeout(() => {
      dwApi
        .previewBonus({
          userId: selectedUserId,
          amount: amountValue,
          platformId: platformId || undefined,
        })
        .then((res) => setBonusPreview(res.data ?? null))
        .catch(() => setBonusPreview(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [kind, amountValue, amountIsValid, selectedUserId, platformId]);

  const visibleBonus = amountIsValid ? bonusPreview : null;

  const onReceiptSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = () => setReceiptDataUrl(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const submitAddBank = async () => {
    if (!selectedUser) {
      setAddBankError("Pick a user first");
      return;
    }
    setAddBankError("");
    setAddingBank(true);
    try {
      const res = await dwApi.addPayoutProfile({
        userId: selectedUser.id,
        accountHolderName: newBankHolder.trim(),
        accountNumber: newBankAccount.trim(),
        ifscCode: newBankIfsc.trim(),
        bankName: newBankName.trim(),
      });
      if (res.data) {
        setPayoutProfiles((profiles) => [...profiles, res.data as PayoutProfile]);
        setPayoutProfileId(res.data.id);
      }
      setShowAddBank(false);
      setNewBankHolder("");
      setNewBankAccount("");
      setNewBankIfsc("");
      setNewBankName("");
    } catch (err) {
      setAddBankError(err instanceof Error ? err.message : "Failed to save bank");
    } finally {
      setAddingBank(false);
    }
  };

  /** Show the result briefly, then close — the ops queue picks the row up live. */
  const finish = (message: string) => {
    setSuccessMessage(message);
    setTimeout(handleClose, 1200);
  };

  const submit = async () => {
    if (!kind) return;
    setError("");

    if (kind === "user") {
      const username = newUsername.trim();
      if (!username) {
        setError("Username is required");
        return;
      }
      setSubmitting(true);
      try {
        const res = await dwApi.createDummyUser({
          username,
          // Password intentionally omitted — the backend generates one.
          fullName: newFullName.trim() || undefined,
          mobileNumber: newMobile.trim() || undefined,
          category: newCategory || undefined,
          platformId: platformId || undefined,
        });
        if (res.success) finish(res.message ?? `User "${username}" created`);
        else setError(res.message ?? "Failed to create user");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create user");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!selectedUser) {
      setError("Select a user");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount");
      return;
    }

    const isDeposit = kind === "deposit";
    setSubmitting(true);
    try {
      const res = await dwApi.createRequest({
        userId: selectedUser.id,
        type: isDeposit ? "DEPOSIT" : "WITHDRAWAL",
        amount: value,
        remarks: remarks.trim() || undefined,
        platformId: platformId || undefined,
        sourceType: "MANUAL",
        ...(isDeposit
          ? {
              paymentMode,
              bankId: bankId || undefined,
              utr: utr.trim() || undefined,
              receiptImage: receiptDataUrl || undefined,
            }
          : { payoutProfileId, paymentMode: payoutMethod }),
      });
      if (res.success) {
        finish(res.message ?? `${isDeposit ? "Deposit" : "Withdrawal"} request created`);
      } else {
        setError(res.message ?? "Failed to create request");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const platformOptions = useMemo(
    () =>
      platforms.map((platform) => (
        <option key={platform.id} value={platform.id}>
          {platform.name}
        </option>
      )),
    [platforms],
  );

  if (!kind || !copy) return null;

  return (
    /* Stops short of both rails so the sidebar and toolbar stay usable, and
       paints the theme artwork itself rather than relying on the page beneath. */
    <div
      className={
        styles.overlay +
        " fixed top-0 right-[var(--shell-rail-width)] bottom-0 left-[var(--shell-sidebar-minimized-width)] z-[150] flex items-center justify-center p-4"
      }
      onClick={handleClose}
      role="presentation"
    >
      <div className="pointer-events-none absolute top-[18px] left-5 inline-flex items-center gap-[9px] font-condensed text-[15px] leading-none font-medium text-[#214055] dark:text-[#d8eeff]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-[18px] w-[18px] shrink-0"
          aria-hidden="true"
        >
          <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
          <path d="M12 14c-4.42 0-8 2.24-8 5v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-2.76-3.58-5-8-5Z" />
        </svg>
        <span>{copy.tag}</span>
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        onClick={(event) => event.stopPropagation()}
        className="h-[775px] max-h-[calc(100vh-32px)] w-[799px] max-w-[calc(100vw-32px)] rounded-[10px] border border-white/45 bg-white/28 px-[7.5px] py-[9px] text-[#1d4268] shadow-[0_20px_60px_rgba(20,60,95,0.12)] backdrop-blur-[26px] backdrop-saturate-125 min-[1200px]:relative min-[1200px]:left-[66px] dark:border-[rgba(0,145,255,0.22)] dark:bg-[rgba(0,43,82,0.3)] dark:text-[#d8eeff]"
      >
        <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-white/58 dark:bg-[rgba(0,43,82,0.62)]">
          <div className="flex items-center justify-between gap-4 px-[27.5px] pt-[26px] pb-[18px]">
            <h2 className="font-condensed text-[20px] leading-none font-semibold text-[#214055] dark:text-[#d8eeff]">
              {copy.title}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D9E3E8] bg-white text-[#B8C4D0] transition-all hover:border-[#2140554D] hover:text-[#214055] dark:border-[#0A66C2] dark:bg-transparent dark:text-[#BDE1FF] dark:hover:border-[#0A66C2] dark:hover:text-[#D8EEFF]"
            >
              <span className="material-icons text-[24px]">close</span>
            </button>
          </div>

          <div className="shell-scroll min-h-0 flex-[0_1_auto] overflow-y-auto px-[27.5px]">
            {error && (
              <div className="mb-3 rounded-lg border border-[rgba(220,38,38,0.35)] bg-[rgba(220,38,38,0.07)] px-3 py-[9px] text-[12.5px] leading-[1.45] text-[#b91c1c]">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-3 rounded-lg border border-[rgba(22,163,74,0.35)] bg-[rgba(22,163,74,0.08)] px-3 py-[9px] text-[12.5px] leading-[1.45] text-[#15803d]">
                {successMessage}
              </div>
            )}

            {kind !== "user" && (
              <Field label="User" required>
                <div className="relative">
                  <input
                    type="text"
                    className={FIELD_CONTROL}
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setShowSearchResults(true);
                    }}
                    onFocus={() => setShowSearchResults(true)}
                    placeholder="Enter username or mobile number"
                    autoComplete="off"
                  />
                  {showSearchResults && searchQuery.trim().length >= 2 && (
                    <div className="shell-scroll absolute top-[calc(100%+4px)] right-0 left-0 z-[5] max-h-[220px] overflow-y-auto rounded-[10px] border border-white/90 bg-white/92 shadow-[0_12px_30px_rgba(20,60,95,0.16)] backdrop-blur-[12px] dark:border-[rgba(0,145,255,0.22)] dark:bg-[rgba(0,43,82,0.96)]">
                      {isSearching && (
                        <div className="px-[13px] py-[10px] font-condensed text-[13px] text-[#1d4268] dark:text-[#9ed4ff]">
                          Searching…
                        </div>
                      )}
                      {!isSearching && visibleResults.length === 0 && (
                        <div className="px-[13px] py-[10px] font-condensed text-[13px] text-[#1d4268] dark:text-[#9ed4ff]">
                          No users found
                        </div>
                      )}
                      {visibleResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="flex w-full items-center justify-between gap-3 px-[13px] py-[9px] text-left text-[13px] text-[#1d4268] hover:bg-[rgba(178,204,203,0.25)] dark:text-[#9ed4ff] dark:hover:bg-[rgba(0,145,255,0.14)]"
                        >
                          <span>{user.username}</span>
                          {user.mobileNumber && (
                            <span className="text-[12px] text-[#6a95b9] dark:text-[rgba(158,212,255,0.75)]">
                              {user.mobileNumber}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <p className="mt-1.5 font-condensed text-[12px] text-[#1d4268] dark:text-[#9ed4ff]">
                    {selectedUser.username}
                    {selectedUser.category && <> · {selectedUser.category}</>}
                    <> · Balance {(selectedUser.balance ?? 0).toFixed(2)}</>
                  </p>
                )}
              </Field>
            )}

            {kind === "user" && (
              <>
                <Field label="Username" required>
                  <input
                    type="text"
                    className={FIELD_CONTROL}
                    value={newUsername}
                    onChange={(event) => setNewUsername(event.target.value)}
                    placeholder="Enter username"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Full Name">
                  <input
                    type="text"
                    className={FIELD_CONTROL}
                    value={newFullName}
                    onChange={(event) => setNewFullName(event.target.value)}
                    placeholder="Optional"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Mobile Number">
                  <input
                    type="tel"
                    className={FIELD_CONTROL}
                    value={newMobile}
                    onChange={(event) => setNewMobile(event.target.value)}
                    placeholder="Optional"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Category">
                  <select
                    className={SELECT_CONTROL}
                    value={newCategory}
                    onChange={(event) => setNewCategory(event.target.value)}
                  >
                    <option value="">Select Category</option>
                    {PLAYER_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            <Field label="Platform">
              <select
                className={SELECT_CONTROL}
                value={platformId}
                onChange={(event) => setPlatformId(event.target.value)}
              >
                <option value="">Select Platform</option>
                {platformOptions}
              </select>
            </Field>

            {kind === "user" && (
              <p className="mb-4 font-condensed text-[12.5px] leading-[1.5] text-[#1d4268] dark:text-[rgba(158,212,255,0.75)]">
                This user has no DL, Super or Master above them &mdash; they are the root
                of their own tree, so deposits and withdrawals never move chips from
                anyone else. A random password is generated automatically; these accounts
                are not meant to log in.
              </p>
            )}

            {kind === "deposit" && (
              <>
                <Field label="Payment Mode">
                  <select
                    className={SELECT_CONTROL}
                    value={paymentMode}
                    onChange={(event) => setPaymentMode(event.target.value)}
                  >
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </Field>

                <Field label="Bank">
                  <select
                    className={SELECT_CONTROL}
                    value={bankId}
                    onChange={(event) => setBankId(event.target.value)}
                  >
                    <option value="">Select Bank</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bankName}
                        {bank.accountNumber ? ` — ${bank.accountNumber}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Deposit Amount">
                  <input
                    type="number"
                    min={0}
                    className={FIELD_CONTROL}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0"
                  />
                </Field>

                {visibleBonus && (
                  <div className="mt-[-4px] mb-3 flex items-center justify-between gap-3 rounded-[5px] border-[0.5px] border-[rgba(163,190,209,0.5)] bg-white/45 px-3 py-2 font-condensed text-[12.5px] dark:border-[rgba(0,145,255,0.2)] dark:bg-[rgba(0,145,255,0.06)]">
                    <span>
                      Bonus:{" "}
                      {visibleBonus.bonusEligible
                        ? `${visibleBonus.bonusPlanName} +${visibleBonus.bonusAmount.toFixed(2)}`
                        : "Not eligible"}
                    </span>
                    <strong>Total: {visibleBonus.totalAmount.toFixed(2)}</strong>
                  </div>
                )}

                <Field label="Receipt Image">
                  <div className="flex items-center gap-3 rounded-[5px] border-[0.5px] border-[rgba(163,190,209,0.5)] bg-white/50 px-[10px] py-2 dark:border-[rgba(0,145,255,0.2)] dark:bg-[rgba(0,145,255,0.06)]">
                    <label className="cursor-pointer rounded-[5px] border border-[#9cc9e0] bg-white/85 px-3 py-1.5 font-condensed text-[13px] leading-none font-medium whitespace-nowrap text-[#0e5484] hover:bg-white dark:border-[rgba(0,145,255,0.25)] dark:bg-[rgba(0,145,255,0.14)] dark:text-[#9ed4ff]">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onReceiptSelected}
                        hidden
                      />
                    </label>
                    <span className="overflow-hidden font-condensed text-[15px] leading-none text-ellipsis text-[#1d4268] dark:text-[#9ed4ff]">
                      {receiptName || "no file selected"}
                    </span>
                    {receiptDataUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptDataUrl("");
                          setReceiptName("");
                        }}
                        title="Remove receipt"
                        className="ml-auto text-lg leading-none text-[#6a95b9]"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                  {receiptDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={receiptDataUrl}
                      alt="Receipt"
                      className="mt-2 max-h-40 rounded-[5px] border border-white/60"
                    />
                  )}
                </Field>

                <Field label="UTR">
                  <input
                    type="text"
                    className={FIELD_CONTROL}
                    value={utr}
                    onChange={(event) => setUtr(event.target.value)}
                    placeholder="UTR Number"
                    autoComplete="off"
                  />
                </Field>
              </>
            )}

            {kind === "withdrawal" && (
              <>
                <Field label="Payout Method">
                  <select
                    className={SELECT_CONTROL}
                    value={payoutMethod}
                    onChange={(event) => setPayoutMethod(event.target.value)}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </Field>

                <Field label="Withdrawal Amount">
                  <input
                    type="number"
                    min={0}
                    className={FIELD_CONTROL}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0"
                  />
                </Field>

                <Field label="User's Bank Account">
                  <select
                    className={SELECT_CONTROL}
                    value={payoutProfileId}
                    onChange={(event) => setPayoutProfileId(event.target.value)}
                  >
                    <option value="">Select Bank</option>
                    {payoutProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.bankName} — {profile.accountNumber}
                      </option>
                    ))}
                  </select>
                </Field>

                <button
                  type="button"
                  onClick={() => setShowAddBank((open) => !open)}
                  className="mb-3 rounded-[5px] border border-[#9cc9e0] bg-white/60 px-3 py-2 font-condensed text-[13px] leading-none font-medium text-[#0e5484] dark:border-[rgba(0,145,255,0.3)] dark:bg-[rgba(0,145,255,0.06)] dark:text-[#9ed4ff]"
                >
                  {showAddBank ? "Cancel" : "+ Add Bank"}
                </button>

                {/* Kept mounted and collapsed by max-height so it can animate. */}
                <div
                  className={
                    "overflow-hidden transition-[max-height,opacity] duration-300 " +
                    (showAddBank ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0")
                  }
                >
                  <div className="mb-4 rounded-[5px] border-[0.5px] border-[rgba(163,190,209,0.5)] bg-white/45 p-3 dark:border-[rgba(0,145,255,0.2)] dark:bg-[rgba(0,145,255,0.06)]">
                    {addBankError && (
                      <div className="mb-3 rounded-lg border border-[rgba(220,38,38,0.35)] bg-[rgba(220,38,38,0.07)] px-3 py-[9px] text-[12.5px] text-[#b91c1c]">
                        {addBankError}
                      </div>
                    )}
                    <Field label="Account Holder">
                      <input
                        type="text"
                        className={FIELD_CONTROL}
                        value={newBankHolder}
                        onChange={(event) => setNewBankHolder(event.target.value)}
                        placeholder="Name on the account"
                      />
                    </Field>
                    <Field label="Account Number">
                      <input
                        type="text"
                        className={FIELD_CONTROL}
                        value={newBankAccount}
                        onChange={(event) => setNewBankAccount(event.target.value)}
                        placeholder="Account number"
                      />
                    </Field>
                    <Field label="IFSC">
                      <input
                        type="text"
                        className={FIELD_CONTROL}
                        value={newBankIfsc}
                        onChange={(event) => setNewBankIfsc(event.target.value)}
                        placeholder="IFSC code"
                      />
                    </Field>
                    <Field label="Bank Name">
                      <input
                        type="text"
                        className={FIELD_CONTROL}
                        value={newBankName}
                        onChange={(event) => setNewBankName(event.target.value)}
                        placeholder="Bank name"
                      />
                    </Field>
                    <button
                      type="button"
                      disabled={addingBank}
                      onClick={submitAddBank}
                      className={BTN_PRIMARY + " w-full"}
                    >
                      {addingBank ? "Saving…" : "Save Bank"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {kind !== "user" && (
              <Field label="Remarks">
                <textarea
                  rows={3}
                  className={TEXTAREA_CONTROL}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Add details for the audit log..."
                />
              </Field>
            )}
          </div>

          <div className="flex justify-end gap-[15px] px-[27.5px] pt-5">
            <button type="button" onClick={handleClose} className={BTN_GHOST}>
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className={BTN_PRIMARY}
            >
              {submitting ? (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[18px] w-[18px]"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              )}
              {submitting ? "Working…" : copy.submit}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
