import { api, type ApiResponse } from "@/lib/api";

export type DwTab = "deposit" | "withdrawal";

export interface DwRequest {
  id: string;
  username: string;
  master?: string | null;
  platform?: string | null;
  category?: string | null;
  /** SELF | MANUAL — rendered as "Self" / "Manual". */
  sourceType?: string | null;
  amount: number;
  bonusEligible?: boolean;
  bonusPlanName?: string | null;
  bonusAmount?: number | null;
  totalAmount?: number | null;
  paymentMode?: string | null;
  utrNumber?: string | null;
  receiptUrl?: string | null;
  createdAt?: string;
  requestedBy?: string | null;
  status?: string;
  assignedToUserId?: string | null;
  assignedToUserName?: string | null;
  verifiedBy?: string | null;
  adminApprovalStatus?: string | null;
  /** Root platform user — the only kind needing a second, admin sign-off. */
  isDummyRequest?: boolean;
}

export interface DwPendingCounts {
  pendingDeposits: number;
  pendingWithdrawals: number;
}

const BASE = "/admin/deposit-withdrawal";

export const workingDwApi = {
  getPendingCounts: () =>
    api.get<ApiResponse<DwPendingCounts>>(`${BASE}/pending-counts`),

  getQueue: (tab: DwTab) =>
    api.get<ApiResponse<DwRequest[]>>(
      tab === "deposit" ? `${BASE}/pending-deposits` : `${BASE}/pending-withdrawals`,
    ),

  claim: (requestId: string) =>
    api.put<ApiResponse<DwRequest>>(`${BASE}/${requestId}/claim`, {}),

  release: (requestId: string) =>
    api.put<ApiResponse<DwRequest>>(`${BASE}/${requestId}/release`, {}),

  approve: (requestId: string, body: Record<string, unknown> = {}) =>
    api.put<ApiResponse<DwRequest>>(`${BASE}/${requestId}/approve`, body),

  reject: (requestId: string, body: Record<string, unknown> = {}) =>
    api.put<ApiResponse<DwRequest>>(`${BASE}/${requestId}/reject`, body),

  adminApprove: (requestId: string, body: Record<string, unknown> = {}) =>
    api.put<ApiResponse<DwRequest>>(`${BASE}/${requestId}/admin-approve`, body),
};

export function getSourceLabel(sourceType?: string | null): string {
  if (!sourceType) return "—";
  return sourceType === "SELF"
    ? "Self"
    : sourceType.charAt(0) + sourceType.slice(1).toLowerCase();
}

export function formatDwDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRupees(value: number | null | undefined): string {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
