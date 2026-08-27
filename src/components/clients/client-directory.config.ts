import type { ClientEntityKey } from "@/lib/clients";

/** Ported verbatim from client-directory.config.ts in diwine_admin_ui. */
export interface ClientDirectoryEntityConfig {
  key: ClientEntityKey;
  listTitle: string;
  createLabel: string;
  noDataMessage: string;
  showJoinedDate: boolean;
  showBonus: boolean;
  showPhone: boolean;
  showBulkUpload: boolean;
}

export const CLIENT_DIRECTORY_CONFIGS: Record<
  ClientEntityKey,
  ClientDirectoryEntityConfig
> = {
  users: {
    key: "users",
    listTitle: "User List",
    createLabel: "Create New User",
    noDataMessage: "No User data found matching your search",
    showJoinedDate: true,
    showBonus: true,
    showPhone: true,
    showBulkUpload: true,
  },
};

/**
 * Left column, from admin.component.ts `refreshClientNavOptions`. The glyphs
 * are inlined in components/ui/icons.tsx (CLIENT_NAV_ICONS) rather than named
 * here, so they take `currentColor` instead of needing a recolour filter.
 *
 * The CRM directory only surfaces end users, so this is a single entry and
 * /clients is a static route — there is no rung to switch to.
 */
export const CLIENT_NAV_OPTIONS: Array<{
  value: ClientEntityKey;
  label: string;
}> = [{ value: "users", label: "Users" }];

/** Palette and hash copied from avatar-image.util.ts, so a given username gets
    the same colour here as it does in the admin panel. */
const AVATAR_COLORS = [
  "#295B83",
  "#7C3AED",
  "#DC2626",
  "#059669",
  "#EA580C",
  "#0284C7",
  "#BE185D",
  "#4F46E5",
];

export function getClientAvatarColor(username: string): string {
  const hash = Array.from(username ?? "").reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getClientInitials(username: string): string {
  const parts = (username || "Client").trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/** Indian digit grouping, as the `indianCurrency` pipe renders it. */
export function formatIndianCurrency(
  value: number | null | undefined,
  fractionDigits = 2,
): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatShortDate(value?: string | null): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
