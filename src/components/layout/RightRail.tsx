"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/lib/theme";
import { useQuickCreate } from "@/components/quick-create/QuickCreateProvider";
import {
  CreateDepositIcon,
  CreateUserIcon,
  CreateWithdrawalIcon,
} from "@/components/ui/icons";

/* Button chrome from team-summary-display.component.html, with the dark hover
   fill set to #0b3f6d — focus-visible matches it, or tabbing to a button would
   flash the old accent teal that hovering no longer uses. */
const RAIL_BUTTON =
  "inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md text-sm " +
  "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-headings " +
  "transition-[background,box-shadow] duration-300 hover:bg-white focus-visible:bg-white " +
  "hover:ring-3 hover:ring-white/30 dark:hover:ring-accent/15 dark:hover:bg-[#0b3f6d] " +
  "dark:focus-visible:bg-[#0b3f6d] h-9 w-9 p-0";

/* The icons are inline SVG drawn with `currentColor`, so their colour is set
   here on the element, not inside the icon component — one constant per role,
   applied via `className`. #50708d / #bde1ff is `.toolbar-svg` from
   team-summary-display.component.scss, the rail's stroked-icon ink. */
const CREATE_ICON = "h-5 w-5 shrink-0 text-[#50708d] dark:text-[#bde1ff]";

const TOOLBAR_SVG = "toolbar-svg h-[22px] w-[22px] shrink-0 text-[#50708d] dark:text-[#bde1ff]";

export function RightRail() {
  const { isDark, toggleTheme } = useTheme();
  const quickCreate = useQuickCreate();
  const { user, logout, permissions } = useAuth();

  // `h-screen` so the account block at the bottom can sit on `mt-auto`.
  return (
    <div
      className="team-summary-container fixed top-0 right-0 z-[1095] flex h-screen w-16 flex-col items-center gap-5 overflow-hidden bg-transparent px-[5px] pt-4 backdrop-blur-[18px]"
      role="toolbar"
      aria-label="Quick actions"
    >
      {permissions.create && (
        <button
          type="button"
          className={RAIL_BUTTON}
          onClick={() => quickCreate.open("user")}
          title="Create User"
          aria-label="Create User"
        >
          <CreateUserIcon className={CREATE_ICON} />
        </button>
      )}

      {permissions.deposit && (
        <button
          type="button"
          className={RAIL_BUTTON}
          onClick={() => quickCreate.open("deposit")}
          title="Create Deposit"
          aria-label="Create Deposit"
        >
          <CreateDepositIcon className={CREATE_ICON} />
        </button>
      )}
      {permissions.withdrawal && (
        <button
          type="button"
          className={RAIL_BUTTON}
          onClick={() => quickCreate.open("withdrawal")}
          title="Create Withdrawal"
          aria-label="Create Withdrawal"
        >
          <CreateWithdrawalIcon className={CREATE_ICON} />
        </button>
      )}

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

      {/* Pushed to the bottom of the rail — the account, then the way out. */}
      <div className="mt-auto flex flex-col items-center gap-3 pb-4">
        {user && (
          <span
            className="grid h-9 w-9 place-items-center rounded-full bg-[#295B83] text-[13px] font-semibold text-white select-none"
            title={`${user.username}${user.role ? ` · ${user.role}` : ""}`}
          >
            {user.username.slice(0, 2).toUpperCase()}
          </span>
        )}

        <button
          type="button"
          className={RAIL_BUTTON}
          onClick={() => void logout()}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={TOOLBAR_SVG}
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
