"use client";

import { useTheme } from "@/lib/theme";
import { useQuickCreate } from "@/components/quick-create/QuickCreateProvider";

/* Button chrome copied from team-summary-display.component.html. */
const RAIL_BUTTON =
  "inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm " +
  "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-headings " +
  "transition-[background,box-shadow] duration-300 hover:bg-white focus-visible:bg-white " +
  "hover:ring-3 hover:ring-white/30 dark:hover:ring-accent/15 dark:hover:bg-accent/50 " +
  "dark:focus-visible:bg-accent h-9 w-9 p-0";

/* <img> cannot inherit currentColor, so the create glyphs are recoloured with
   the same filters team-summary-display.component.scss uses. */
const CREATE_ICON =
  "toolbar-create-icon h-5 w-5 " +
  "[filter:brightness(0)_saturate(100%)_invert(20%)_sepia(23%)_saturate(1470%)_hue-rotate(169deg)_brightness(94%)_contrast(88%)] " +
  "dark:[filter:brightness(0)_saturate(100%)_invert(84%)_sepia(20%)_saturate(900%)_hue-rotate(180deg)_brightness(105%)_contrast(101%)]";

const TOOLBAR_SVG = "toolbar-svg h-[22px] w-[22px] shrink-0 text-[#50708d] dark:text-[#bde1ff]";

export function RightRail() {
  const { isDark, toggleTheme } = useTheme();
  const quickCreate = useQuickCreate();

  return (
    <div
      className="team-summary-container fixed top-0 right-0 z-[1095] flex w-16 flex-col items-center gap-5 overflow-hidden bg-transparent px-[5px] pt-4 backdrop-blur-[18px]"
      role="toolbar"
      aria-label="Quick actions"
    >
      <button
        type="button"
        className={RAIL_BUTTON}
        onClick={() => quickCreate.open("user")}
        title="Create User"
        aria-label="Create User"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icons/create-user.svg" alt="" aria-hidden="true" className={CREATE_ICON} />
      </button>

      <button
        type="button"
        className={RAIL_BUTTON}
        onClick={() => quickCreate.open("deposit")}
        title="Create Deposit"
        aria-label="Create Deposit"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icons/create-deposit.svg" alt="" aria-hidden="true" className={CREATE_ICON} />
      </button>

      <button
        type="button"
        className={RAIL_BUTTON}
        onClick={() => quickCreate.open("withdrawal")}
        title="Create Withdrawal"
        aria-label="Create Withdrawal"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/icons/create-withdrawal.svg"
          alt=""
          aria-hidden="true"
          className={CREATE_ICON}
        />
      </button>

      <button
        type="button"
        className={"relative " + RAIL_BUTTON}
        onClick={toggleTheme}
        title={isDark ? "Light Mode" : "Dark Mode"}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {/* Both glyphs stay mounted and cross-fade by scale/rotation, as in the
            Angular toolbar — the transition is the point of keeping both. */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            TOOLBAR_SVG +
            " absolute rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0"
          }
          aria-hidden="true"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            TOOLBAR_SVG +
            " absolute rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100"
          }
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </button>
    </div>
  );
}
