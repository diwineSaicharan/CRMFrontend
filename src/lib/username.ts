import { api } from "@/lib/api";

/**
 * Ported from diwine_admin_ui/src/app/admin/utils/username-form.util.ts, plus
 * the availability call from AuthService. The Angular original is expressed as
 * Angular validators; the rules themselves are carried over unchanged.
 */

export const USERNAME_SPACES_MESSAGE = "Space is not allow in username";
export const USERNAME_MIN_LENGTH = 4;

export interface UsernameCheckResult {
  available: boolean;
  username: string;
  suggestions?: string[];
}

/** `usernameCreateValidators`: required, min length 4, and no whitespace. */
export function validateUsername(value: string): string | null {
  if (!value) return "This field is required";
  if (/\s/.test(value)) return USERNAME_SPACES_MESSAGE;
  if (value.length < USERNAME_MIN_LENGTH)
    return `Minimum length is ${USERNAME_MIN_LENGTH} characters`;
  return null;
}

/** `usernameFromFullName` — lowercase, strip spaces, keep [a-z0-9._]. */
export function usernameFromFullName(fullName: string): string {
  return String(fullName ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._]/g, "");
}

/** `generateRandomUsername` — base name plus a 3-digit suffix (100-999). */
export function generateRandomUsername(fullName: string): string {
  const base = usernameFromFullName(fullName);
  if (!base) return "";
  return base + (Math.floor(Math.random() * 900) + 100);
}

/** `setupUsernameEdgeTrim` — the stored value never has edge whitespace. */
export function trimUsernameEdges(value: string): string {
  return typeof value === "string" ? value.trim() : value;
}

/** `normalizeUsernameForStorage` — lowercase, no spaces at all. */
export function normalizeUsernameForStorage(username: string): string {
  return String(username ?? "")
    .replace(/\s/g, "")
    .toLowerCase();
}

/** `blockUsernameSpaceKeydown` — the space bar does nothing in this field. */
export function isSpaceKey(key: string, code?: string): boolean {
  return key === " " || code === "Space";
}

export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameCheckResult> {
  return api.get<UsernameCheckResult>(
    `/auth/users/check-username?username=${encodeURIComponent(username)}`,
  );
}
