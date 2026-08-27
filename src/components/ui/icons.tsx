import type { SVGProps } from "react";

/**
 * Inline copies of the SVG assets that are real vector artwork, so the paths
 * can be edited here and the glyph takes `currentColor` in both themes — the
 * pattern sidebar.component.html uses for its lucide icons.
 *
 * Not every asset qualifies. `public/assets/action/*.svg` and the create-nav
 * glyphs (dls / supers / usert / masters / teamm) are Figma exports that wrap a
 * base64 PNG in an <svg>, so there is nothing to inline and nothing to recolour
 * by `currentColor`. Those stay <img> and are tinted with the `.icon-img`
 * filter instead.
 */

type IconProps = SVGProps<SVGSVGElement>;

/**
 * The lucide frame: 24px box, `currentColor` stroke, round caps. Spreading
 * props last lets a caller override any of it — and, crucially, lets the
 * caller's `className` through, which is where the size and theme colours come
 * from. An icon that drops the spread renders at 24px in whatever colour it
 * happens to inherit.
 */
function LucideIcon({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ── right rail: create shortcuts (assets/icons/create-*.svg) ─────────────── */

export function CreateUserIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="M8.4 9.6a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z" fill="currentColor" />
      <path
        d="M8.4 11c-3.1 0-5.6 1.7-5.6 3.8v1a.6.6 0 0 0 .6.6h9.2a.6.6 0 0 0 .6-.6v-1c0-2.1-2.5-3.8-4.8-3.8Z"
        fill="currentColor"
      />
      <path
        d="M15.6 5.6v4.8M18 8h-4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** lucide-banknote-arrow-up */
/**
 * A single letter in the lucide frame's 24px box.
 *
 * Deliberately not routed through LucideIcon: that frame is `fill="none"
 * stroke="currentColor"`, which would draw a hollow outlined letter. `<text>`
 * wants the opposite — a fill and no stroke.
 *
 * The box, and the fact the colour is `currentColor`, are what matter: the
 * caller's existing `h-5 w-5 text-[#50708d] dark:text-[#bde1ff]` keeps working
 * untouched, so both themes are exactly as they were. `fontFamily: inherit`
 * picks up the app face rather than the browser's SVG default of serif.
 */
function LetterIcon({ letter, ...props }: IconProps & { letter: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <text
        x="12"
        y="12"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        stroke="none"
        // 15 rather than 22: two glyphs have to fit the same 24px box.
        style={{ fontFamily: "inherit", fontSize: 20, fontWeight: 500 }}
      >
        {letter}
      </text>
    </svg>
  );
}

/** "D+", for Create Deposit on the right rail. */
export function CreateDepositIcon(props: IconProps) {
  return <LetterIcon letter="D+" {...props} />;
}

/** "W+", for Create Withdrawal on the right rail. */
export function CreateWithdrawalIcon(props: IconProps) {
  return <LetterIcon letter="W+" {...props} />;
}

/* ── clients nav (assets/icons/newMaster|dl|super|master|teammate.svg) ─────
   Lucide strokes; the asset files carry the same paths. */

/** newMaster.svg — lucide-contact (Users) */
export function ContactIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <circle cx="12" cy="10" r="2" />
      <line x1="8" x2="8" y1="2" y2="4" />
      <line x1="16" x2="16" y1="2" y2="4" />
    </LucideIcon>
  );
}

/** dl.svg — lucide-heart */
export function HeartIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </LucideIcon>
  );
}

/** super.svg — lucide-clock */
export function ClockIcon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </LucideIcon>
  );
}

/** master.svg — lucide-layers-2 */
export function Layers2Icon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74L7.98 12" />
      <path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74Z" />
    </LucideIcon>
  );
}

/** teammate.svg — lucide-trash-2 */
export function Trash2Icon(props: IconProps) {
  return (
    <LucideIcon {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </LucideIcon>
  );
}

/* ── assets/action/add-user.svg ───────────────────────────────────────────
   The asset hard-codes #214055; inlined as currentColor so it also works on
   the dark surface. */

export function AddUserIcon(props: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <rect
        x="3.5"
        y="3.5"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M9 6.5V11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.5 9H11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Clients nav glyph per entity, keyed the way CLIENT_NAV_OPTIONS is. */
export const CLIENT_NAV_ICONS = {
  users: ContactIcon,
  dl: HeartIcon,
  super: ClockIcon,
  master: Layers2Icon,
  teammates: Trash2Icon,
} as const;
