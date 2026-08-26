"use client";

import type { ReactNode } from "react";

import styles from "./CreateForm.module.css";

/* Class strings ported from create-user-form.component.scss. */

export const FORM_ROW = "mb-3.5 flex gap-3.5 max-lg:flex-col max-lg:gap-4";

export const FORM_GROUP = "flex-1 p-1";

export const FORM_LABEL =
  "mb-2 block leading-[1.3] font-normal break-words text-headings dark:text-[#bde1ff]";

export const FORM_CONTROL =
  "box-border h-10 w-full rounded-lg border-[0.5px] border-[rgba(93,150,189,0.3)] bg-transparent " +
  "py-3 pr-3 pl-10 text-[13px] text-[#5D96BD] transition-all duration-300 " +
  "placeholder:text-[#5D96BD] placeholder:opacity-100 " +
  "hover:border-[rgba(66,133,244,0.5)] " +
  "focus:border-[#4285F4] focus:shadow-[0_0_0_2px_rgba(66,133,244,0.12)] focus:outline-none " +
  "disabled:cursor-not-allowed disabled:bg-[rgba(245,245,245,0.5)] " +
  "dark:border-[rgba(142,214,255,0.3)] dark:bg-[rgba(3,53,97,1)] dark:text-[#bde1ff] " +
  "dark:placeholder:text-[#bde1ff]";

export const SELECT_CONTROL =
  FORM_CONTROL +
  " " +
  styles.select +
  " appearance-none pr-9 [&>option]:bg-white [&>option]:text-[#5D96BD] " +
  "dark:[&>option]:bg-[#033561] dark:[&>option]:text-[#bde1ff]";

export const HELPER_TEXT =
  "mt-1.5 flex items-center gap-1 text-[10px] text-[#5D96BD] dark:text-[#8ed6ff]";

export const SECTION_TITLE =
  "relative mb-1 text-[16px] leading-[1.2] font-bold tracking-[-0.2px] text-headings dark:text-[#bde1ff]";

export const SECTION_DESCRIPTION =
  "m-0 p-0 text-[10px] italic text-[#5D96BD] dark:text-[#8ed6ff]";

/** `.form-section` — a translucent card with a hairline and a lifting shadow. */
export function FormSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "mb-3.5 rounded-[10px] border border-[rgba(66,133,244,0.08)] bg-white/40 p-3.5 " +
        "shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 " +
        "hover:border-[rgba(66,133,244,0.15)] hover:shadow-[0_4px_16px_rgba(66,133,244,0.08)] " +
        "dark:border-[rgba(0,145,255,0.15)] dark:bg-[rgba(0,145,255,0.06)] " +
        className
      }
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className={styles.sectionRule + " relative mb-0 pb-1.5"}>
      <h2 className={SECTION_TITLE}>{title}</h2>
      {description && <p className={SECTION_DESCRIPTION}>{description}</p>}
    </div>
  );
}

/** Icon-prefixed control shell — the icon is absolute inside a relative box. */
export function InputShell({
  icon,
  children,
}: {
  icon?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative bg-transparent">
      {icon && (
        <span className="material-icons pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[18px] text-[#5D96BD] dark:text-[#8ed6ff]">
          {icon}
        </span>
      )}
      {children}
    </div>
  );
}

export function HelperText({ children }: { children: ReactNode }) {
  return (
    <div className={HELPER_TEXT}>
      <span className="material-icons text-[14px]">info</span>
      <span>{children}</span>
    </div>
  );
}

export function FormField({
  label,
  required,
  icon,
  helper,
  children,
  fullWidth,
}: {
  label: string;
  required?: boolean;
  icon?: string;
  helper?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={FORM_GROUP + (fullWidth ? " flex-none basis-full" : "")}>
      <label className={FORM_LABEL}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <InputShell icon={icon}>{children}</InputShell>
      {helper && <HelperText>{helper}</HelperText>}
    </div>
  );
}
