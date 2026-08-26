"use client";

import { useState } from "react";

/** The seven icon buttons under the detail avatar (row-actions.component). */
const ACTIONS = [
  { id: "deposit", src: "/assets/action/dep.svg", title: "Deposit", label: "Deposit" },
  { id: "withdraw", src: "/assets/action/whid.svg", title: "Withdrawal", label: "Withdrawal" },
  { id: "unsettled", src: "/assets/action/uns.svg", title: "Unsettled Bets", label: "Unsettled Bets" },
  { id: "statement", src: "/assets/action/sat.svg", title: "Statement", label: "Statement" },
  { id: "password", src: "/assets/action/psd.svg", title: "Password Change", label: "Password" },
  { id: "edit", src: "/assets/action/edt.svg", title: "Edit User", label: "Edit" },
  { id: "settings", src: "/assets/action/sys.svg", title: "Game Setting", label: "Game Setting" },
] as const;

export type RowActionId = (typeof ACTIONS)[number]["id"];

export function RowActions({ onAction }: { onAction?: (id: RowActionId) => void }) {
  const [hovered, setHovered] = useState<RowActionId | null>(null);

  return (
    <div
      className="relative z-[1] flex w-full max-w-full min-w-0 max-h-10 flex-nowrap justify-center gap-1 overflow-visible py-1"
      role="group"
      aria-label="Row action buttons"
    >
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          title={action.title}
          onClick={() => onAction?.(action.id)}
          onMouseEnter={() => setHovered(action.id)}
          onMouseLeave={() => setHovered(null)}
          className="group relative mx-0.5 flex h-8 w-8 min-w-8 flex-none cursor-pointer items-center justify-center overflow-visible rounded-lg border border-[#9CB4C2] p-0 text-[#555] transition-all duration-200 hover:z-20 dark:border-[#0A66C2]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={action.src}
            alt={action.title}
            className="h-5 w-5 transition-all duration-200 group-hover:scale-115"
          />
          {hovered === action.id && (
            <span className="absolute top-full left-1/2 z-30 mt-1 min-w-[60px] -translate-x-1/2 rounded-md border border-black/8 bg-white/95 px-1.5 py-[3px] text-center text-[11px] font-medium whitespace-nowrap text-[#222] shadow-[0_4px_12px_rgba(0,0,0,0.1)] backdrop-blur-[6px]">
              {action.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
