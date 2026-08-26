"use client";

import type { ParentHierarchyEntry } from "@/lib/clients";

/* Material ligature per role, from `getRoleIcon` in
   client-directory-panel.component.ts. SUPER and PLAYER are the CRM spellings
   of the reference's SUPER_MASTER / PLAYER slots. */
const ROLE_ICONS: Record<string, string> = {
  ADMIN: "admin_panel_settings",
  MASTER: "stars",
  SUPER: "verified",
  SUPER_MASTER: "verified",
  DL: "people",
  USER: "person",
  PLAYER: "person",
  TEAMMATE: "badge",
};

function roleIcon(role: string): string {
  return ROLE_ICONS[(role || "").toUpperCase()] ?? "person";
}

/* `.user-detail-card__section-icon`: 35px, accent-tinted in light; the dark
   override swaps the fill to white/10 and the ink to #9ED4FF. */
const SECTION_ICON =
  "flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-lg " +
  "bg-accent/10 text-headings dark:bg-white/10 dark:text-[#9ED4FF]";

/* `.hierarchy-chip` — a translucent card in light, a blurred navy pane in
   dark (`rgba(2,51,94,0.3)` + a white/8 hairline). */
const CHIP =
  "min-w-[200px] shrink-0 rounded-lg border-[0.5px] border-[#e5e7eb] bg-card px-4 py-3 " +
  "dark:border-white/8 dark:bg-[rgba(2,51,94,0.3)] dark:backdrop-blur-[8px]";

const CHIP_ICON =
  "flex h-10 w-10 min-w-10 shrink-0 items-center justify-center rounded-lg " +
  "border border-white/80 bg-accent/10 text-headings " +
  "dark:border-white/8 dark:bg-white/10 dark:text-[#bde1ff]";

export function ClientHierarchy({ parents }: { parents: ParentHierarchyEntry[] }) {
  return (
    <div className="px-5 pb-5">
      <div className="flex items-center gap-3 py-4">
        <div className={SECTION_ICON}>
          <span className="material-icons text-[18px]">account_tree</span>
        </div>
        {/* `.user-detail-card__section h3` goes pure white in dark. */}
        <h3 className="m-0 text-[15px] font-medium text-headings dark:text-white">
          Parent Hierarchy
        </h3>
      </div>

      {parents.length === 0 ? (
        <p className="m-0 text-xs text-muted dark:text-[rgba(158,212,255,0.72)]">
          No parent hierarchy available for this user.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {parents.map((parent, index) => (
            <div key={parent.id ?? `${parent.username}-${index}`} className={CHIP}>
              <div className="flex items-center gap-3">
                <div className={CHIP_ICON}>
                  <span className="material-icons text-[16px] leading-4">
                    {roleIcon(parent.role)}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 mb-1 truncate text-sm font-normal text-muted dark:text-[#bde1ff]">
                      {parent.username}
                    </p>
                    {/* `.hierarchy-role` loses its teal pill in dark for white/10. */}
                    <span className="inline-flex rounded-full bg-[#B2CCCB]/20 px-3 py-1 text-[10px] font-normal uppercase text-[#1D4368] dark:bg-white/10 dark:text-[#bde1ff]">
                      {parent.role}
                    </span>
                  </div>

                  <span className="ms-auto inline-flex h-6 shrink-0 items-center rounded-full border border-transparent bg-emerald-500/10 px-1.5 py-0.5 text-[0.65rem] leading-none text-emerald-500">
                    SR: {parent.sharingRatio ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
