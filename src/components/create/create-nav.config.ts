/**
 * The CRM creates players and nothing else. DL, Super, Master, TeamMate,
 * Platform and Party all live in diwine_admin — the normal/dummy split is a
 * toggle inside the one User form, not separate entries here.
 */
export type CreateEntityKey = "user";

/**
 * `createNavOptionDefinitions` from admin.component.ts, icons included — note
 * the original's asset names really are crossed over (Master uses usert.svg,
 * User uses masters.svg); kept as-is so the glyphs match the shipped panel.
 */
export const CREATE_NAV_OPTIONS: Array<{
  value: CreateEntityKey;
  label: string;
  icon: string;
  /** Material Icons ligature when there is no SVG asset. */
  ligature?: boolean;
}> = [{ value: "user", label: "User", icon: "/assets/icons/masters.svg" }];

export const CREATE_LABELS: Record<CreateEntityKey, string> = {
  user: "User",
};

export const PLAYER_CATEGORIES = ["D1", "D2", "D3", "D4"];
