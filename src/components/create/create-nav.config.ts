/**
 * The Create tab makes platform users. DL, Super, Master, Platform and Party
 * all live in diwine_admin.
 *
 * CRM teammates are not here: they are staff rather than players, and managing
 * them is its own sidebar section (/teammates).
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
