/**
 * The Create User sheet's field and button chrome, shared.
 *
 * Lifted out of QuickCreateModal so the Clients edit page renders the same
 * controls rather than a near-copy that drifts. `SELECT_CONTROL` stays in the
 * modal: it composes these with a CSS-module class for the native select's
 * arrow, which only that file has.
 */

export const FIELD_LABEL =
  "mb-[7px] block font-condensed text-[15px] leading-none font-normal text-black dark:text-[#9ed4ff]";

export const FIELD_CONTROL =
  "h-10 w-full max-w-[729px] rounded-[5px] border-[0.5px] border-[rgba(163,190,209,0.5)] " +
  "bg-white/50 px-[14px] font-condensed text-[15px] leading-none text-[#1d4268] backdrop-blur-[6px] " +
  "transition-[border-color,box-shadow] duration-200 placeholder:text-[#1d4268] placeholder:opacity-100 " +
  "focus:border-[#2f80d6] focus:shadow-[0_0_0_1px_rgba(47,128,214,0.35)] focus:outline-none " +
  "dark:border-[rgba(0,145,255,0.2)] dark:bg-[rgba(0,145,255,0.08)] dark:text-[#9ed4ff] " +
  "dark:placeholder:text-[#9ed4ff]";

export const BTN =
  "inline-flex h-10 items-center justify-center gap-[7px] rounded-[5px] border border-[#9cc9e0] " +
  "px-4 font-condensed text-[15px] leading-5 font-medium tracking-[0.015em] text-[#0e5484] " +
  "transition-[background,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-65 " +
  "dark:text-[#9ed4ff]";

export const BTN_GHOST =
  BTN +
  " w-[70px] bg-white/60 hover:not-disabled:bg-white " +
  "dark:border-[rgba(0,145,255,0.22)] dark:bg-[rgba(0,145,255,0.08)]";

export const BTN_PRIMARY =
  BTN +
  " min-w-[145px] bg-[rgba(185,207,209,0.5)] backdrop-blur-[6px] " +
  "dark:border-[rgba(0,145,255,0.35)] dark:bg-[rgba(0,145,255,0.22)]";

/** The platform multi-select chip, as the Create User sheet draws it. */
export function platformChipClass(selected: boolean): string {
  return (
    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 " +
    "font-condensed text-[13px] leading-none transition-colors " +
    (selected
      ? "border-[#2f80d6] bg-[rgba(47,128,214,0.14)] text-[#0e5484] " +
        "dark:border-[#0a66c2] dark:bg-[rgba(0,145,255,0.22)] dark:text-[#d8eeff]"
      : "border-[rgba(163,190,209,0.5)] bg-white/50 text-[#1d4268] " +
        "hover:border-[#2f80d6] dark:border-[rgba(0,145,255,0.2)] " +
        "dark:bg-[rgba(0,145,255,0.08)] dark:text-[#9ed4ff]")
  );
}

export function platformCheckClass(selected: boolean): string {
  return (
    "grid h-3.5 w-3.5 place-items-center rounded-[3px] border text-[10px] leading-none " +
    (selected
      ? "border-[#2f80d6] bg-[#2f80d6] text-white dark:border-[#0a66c2] dark:bg-[#0a66c2]"
      : "border-[rgba(163,190,209,0.8)] dark:border-[rgba(158,212,255,0.45)]")
  );
}
