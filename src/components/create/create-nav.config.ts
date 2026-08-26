export type CreateEntityKey =
  | "dl"
  | "super"
  | "master"
  | "user"
  | "teammate"
  | "platform"
  | "party";

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
}> = [
  { value: "dl", label: "DL", icon: "/assets/icons/dls.svg" },
  { value: "super", label: "Super", icon: "/assets/icons/supers.svg" },
  { value: "master", label: "Master", icon: "/assets/icons/usert.svg" },
  { value: "user", label: "User", icon: "/assets/icons/masters.svg" },
  { value: "teammate", label: "TeamMate", icon: "/assets/icons/teamm.svg" },
  { value: "platform", label: "Platform", icon: "dns", ligature: true },
  { value: "party", label: "Party", icon: "account_tree", ligature: true },
];

export const CREATE_LABELS: Record<CreateEntityKey, string> = {
  dl: "Dl",
  super: "Super",
  master: "Master",
  user: "User",
  teammate: "Teammate",
  platform: "Platform",
  party: "Party",
};

export const PLAYER_CATEGORIES = ["D1", "D2", "D3", "D4"];
