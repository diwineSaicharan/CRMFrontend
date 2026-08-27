import { api } from "@/lib/api";

/** Mirrors diwine_admin_ui/src/app/core/services/dl-user.service.ts. */
export interface DlUser {
  id: string;
  username: string;
  fullName: string | null;
  isActive: boolean;
  totalBalance: number;
  balance: number;
}

interface DlUserListResponse {
  success: boolean;
  data: DlUser[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getDlUsers(page = 1, limit = 100, search?: string): Promise<DlUser[]> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);

  const response = await api.get<DlUserListResponse>(`/dl-users?${params.toString()}`);
  return Array.isArray(response?.data) ? response.data : [];
}

/** `indianCurrency` pipe — the balance format the dropdown rows use. */
export function formatIndianCurrency(value: number | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * The Master and User forms pick their parent from the tier above, and those
 * rows have the same shape as a DL row — identity plus a balance.
 */
export async function getSuperMasters(page = 1, limit = 100, search?: string): Promise<DlUser[]> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  const response = await api.get<DlUserListResponse>(`/super-masters?${params.toString()}`);
  return Array.isArray(response?.data) ? response.data : [];
}

export async function getMasters(page = 1, limit = 100, search?: string): Promise<DlUser[]> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  const response = await api.get<DlUserListResponse>(`/masters?${params.toString()}`);
  return Array.isArray(response?.data) ? response.data : [];
}
