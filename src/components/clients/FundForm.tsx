"use client";

import { useMemo, useState, type ReactNode } from "react";

import type { Client } from "@/lib/clients";
import { formatIndianCurrency } from "./client-directory.config";
import styles from "./FundForm.module.css";

export type FundFormKind = "deposit" | "withdrawal";

/* `paymentModes` from each form's component class. */
const PAYMENT_MODES: Record<FundFormKind, Array<{ value: string; label: string }>> = {
  deposit: [
    { value: "CREDIT_REFERENCE", label: "Credit Reference" },
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "UPI", label: "UPI" },
    { value: "BONUS", label: "Bonus" },
  ],
  withdrawal: [
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "UPI", label: "UPI" },
    { value: "CASH", label: "Cash" },
  ],
};

const HAIRLINE = "border-[#D9E3E8] dark:border-white/8";

const ROW_LABEL = "text-[15px] font-normal text-[#1D4268] dark:text-[#D8EEFF]";

const COLUMN_HEAD = "text-[14px] font-normal text-[#6a95b9] dark:text-[#9ED4FF]";

/** One `Label ......... value` row, separated by the form's hairline. */
function AmountRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={"flex items-center justify-between border-t px-4 pt-4 " + HAIRLINE}>
      <span className={ROW_LABEL}>{label}</span>
      {children}
    </div>
  );
}

export interface FundFormProps {
  kind: FundFormKind;
  client: Client;
  /** The signed-in user the funds move from / to. */
  counterparty?: string;
  onClose: () => void;
}

export function FundForm({ kind, client, counterparty = "—", onClose }: FundFormProps) {
  const isDeposit = kind === "deposit";
  const [paymentMode, setPaymentMode] = useState(
    isDeposit ? "UPI" : "BANK_TRANSFER",
  );
  const [chipAmount, setChipAmount] = useState("");
  const [bonusPercent, setBonusPercent] = useState("");

  /** 1₹ = `chipRate` chips; `depositTargetDl?.chipRate ?? 1` in the reference. */
  const chipRate = client.chipRate ?? 1;
  const balance = client.balance ?? 0;

  const chips = Number(chipAmount.replace(/,/g, "")) || 0;
  const currencyAmount = chipRate ? chips / chipRate : 0;

  const balanceAfter = useMemo(
    () => (isDeposit ? balance + chips : balance - chips),
    [isDeposit, balance, chips],
  );

  const totalDeposit = chips + (chips * (Number(bonusPercent) || 0)) / 100;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* `.deposit-dl-form-container` — the toolbar is absolutely placed 58px
          above it, so the container carries a matching top margin. */}
      <div className="absolute top-0 left-0 z-[5] flex h-[42px] items-center gap-5 text-headings dark:text-[#BDE1FF]">
        <span className="text-[15px] font-medium">
          {isDeposit ? "Deposit" : "Withdrawal"}
        </span>
      </div>

      <div className="mt-[58px] flex max-h-[888px] min-h-0 w-full flex-1 overflow-visible rounded-[10px] border border-white bg-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 dark:border-white/8 dark:bg-transparent dark:text-[#D8EEFF]">
        <div className="shell-scroll m-auto my-2.5 w-[799px] max-w-full flex-1 overflow-y-auto rounded-2xl border border-white/70 bg-white/50 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.04)] backdrop-blur-[12px] dark:border-white/8 dark:bg-[#0091ff0d]">
          <div className="rounded-lg p-5 dark:bg-[rgba(0,145,255,0.102)]">
            {/* ── balance pill + close ─────────────────────────────────── */}
            <div className="mb-6 flex items-center justify-between">
              <div className="m-0 inline-flex h-[38px] min-w-[116px] items-center justify-center rounded border-2 border-headings px-5 text-sm font-medium text-body dark:border-[#BDE1FF] dark:bg-transparent dark:text-[#9ED4FF]">
                ₹ {formatIndianCurrency(balance, 0)}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D9E3E8] bg-white text-[#B8C4D0] transition-all hover:border-[#2140554D] hover:text-[#214055] dark:border-[#0A66C2] dark:bg-transparent dark:text-[#BDE1FF] dark:hover:border-[#0A66C2] dark:hover:text-[#D8EEFF]"
              >
                <span className="material-icons text-[24px]">close</span>
              </button>
            </div>

            {/* ── who / whom ───────────────────────────────────────────── */}
            <div
              className={
                "mb-5 flex min-h-[68px] items-start justify-between border-b py-2.5 " +
                HAIRLINE
              }
            >
              <div className="flex flex-col items-start">
                <h3 className={COLUMN_HEAD}>
                  {isDeposit ? "Deposit to:" : "Withdrawal From:"}
                </h3>
                <h1 className="mt-1 text-[15px] font-normal text-[#1D4268] dark:text-[#D8EEFF]">
                  {client.username}
                </h1>
              </div>

              <div className="flex flex-col items-end">
                <h3 className={COLUMN_HEAD}>
                  {isDeposit ? "Deposit From:" : "Withdrawal To:"}
                </h3>
                <h1 className="mt-1 text-[15px] font-normal text-[#1D4268] dark:text-[#D8EEFF]">
                  {counterparty}
                </h1>
              </div>
            </div>

            {/* ── payment mode ─────────────────────────────────────────── */}
            <div className="mb-2">
              <span className="mb-2 block text-[15px] font-normal text-[#1D4268] dark:text-[#D8EEFF]">
                Payment Mode
              </span>
              <div className="grid grid-cols-5 gap-2.5 max-[1100px]:grid-cols-2">
                {PAYMENT_MODES[kind].map((mode) => (
                  <div key={mode.value} className={styles.option}>
                    <input
                      type="radio"
                      id={`paymentMode_${mode.value}`}
                      name="paymentMode"
                      value={mode.value}
                      checked={paymentMode === mode.value}
                      onChange={() => setPaymentMode(mode.value)}
                    />
                    <label htmlFor={`paymentMode_${mode.value}`} className={styles.label}>
                      <span className={styles.icon} />
                      <span className={styles.text}>{mode.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* ── chip rate ────────────────────────────────────────────── */}
            <div className={"mt-4 border-b " + HAIRLINE}>
              <div className="flex justify-between px-4 py-3">
                <h3 className={COLUMN_HEAD}>Chip Rate (1₹ = {chipRate} chips)</h3>
                <h3 className={COLUMN_HEAD}>Amount</h3>
              </div>

              <AmountRow label="Chips Amount">
                <input
                  type="text"
                  value={chipAmount}
                  onChange={(event) => setChipAmount(event.target.value)}
                  placeholder={isDeposit ? "0.00" : "Enter chip amount"}
                  className={styles.amount}
                />
              </AmountRow>

              <AmountRow label="Currency Amount">
                <input
                  type="text"
                  readOnly
                  value={chips ? formatIndianCurrency(currencyAmount) : ""}
                  placeholder={isDeposit ? "0.00" : "Auto-calculated amount"}
                  className={styles.amount}
                />
              </AmountRow>

              {isDeposit ? (
                <AmountRow label="Receiver Balance">
                  <input
                    type="text"
                    readOnly
                    value={`${formatIndianCurrency(balance, 0)} → ${formatIndianCurrency(balanceAfter, 0)}`}
                    className={styles.amount}
                  />
                </AmountRow>
              ) : (
                <>
                  <AmountRow label="Available Balance">
                    <input
                      type="text"
                      readOnly
                      value={formatIndianCurrency(balance, 0)}
                      className={styles.amount}
                    />
                  </AmountRow>
                  <AmountRow label="Balance After Withdrawal">
                    <input
                      type="text"
                      readOnly
                      value={formatIndianCurrency(balanceAfter, 0)}
                      className={styles.amount}
                    />
                  </AmountRow>
                </>
              )}
            </div>

            {/* ── amount ───────────────────────────────────────────────── */}
            <div className={"mt-4 mb-4 border-b " + HAIRLINE}>
              <div className="flex justify-end px-4 py-3">
                <h3 className={COLUMN_HEAD}>Amount</h3>
              </div>

              <AmountRow label={isDeposit ? "Deposit Amount" : "Withdrawal Amount"}>
                <input
                  type="text"
                  readOnly
                  value={chips ? formatIndianCurrency(chips) : ""}
                  placeholder="0.00"
                  className={styles.amount}
                />
              </AmountRow>

              {isDeposit && (
                <>
                  <AmountRow label="Bonus %">
                    <input
                      type="text"
                      value={bonusPercent}
                      onChange={(event) => setBonusPercent(event.target.value)}
                      className={styles.amount}
                    />
                  </AmountRow>
                  <AmountRow label="Total Deposit Amount">
                    <input
                      type="text"
                      readOnly
                      value={formatIndianCurrency(totalDeposit)}
                      className={styles.amount}
                    />
                  </AmountRow>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
