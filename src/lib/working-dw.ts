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
  /** The creator's id, as stored. Not shown — see `getRequestedByLabel`. */
  requestedBy?: string | null;
  /** Resolved from that id by the queue query. */
  requestedByName?: string | null;
  requestedByRole?: string | null;
  status?: string;
  /** A legacy lien shows as closing < opening — the banker stage reads this to
   *  tell an already-debited withdrawal from one still waiting to be processed. */
  openingBalance?: number | null;
  closingBalance?: number | null;
  /** DEPOSIT | WITHDRAWAL, as stored on the row. */
  type?: string;
  /** Shown in the verification modal's detail grid. */
  mobile?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
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

  /** body: { remarks?, utrNumber?, bankId?, receiptImage? } — see DwVerifyModal. */
  approve: (requestId: string, body: Record<string, unknown> = {}) =>
    api.put<ApiResponse<DwRequest>>(`${BASE}/${requestId}/approve`, body),

  reject: (requestId: string, body: Record<string, unknown> = {}) =>
    api.put<ApiResponse<DwRequest>>(`${BASE}/${requestId}/reject`, body),

  adminApprove: (requestId: string, body: Record<string, unknown> = {}) =>
    api.put<ApiResponse<DwRequest>>(`${BASE}/${requestId}/admin-approve`, body),

  /** Withdrawals only: PENDING -> PROCESSING, debiting the player now. */
  process: (requestId: string, body: Record<string, unknown> = {}) =>
    api.put<ApiResponse<DwRequest>>(`${BASE}/${requestId}/process`, body),
};

/**
 * Who raised the request, as the admin panel words it.
 *
 * The row carries `created_by`, an id, which is what the By column and the
 * modal's Created By used to print — a cuid tells a banker nothing about who
 * they are approving for. The queue query resolves it, and this reproduces
 * diwine_admin_ui's `getRequestedBy` so both panels read identically.
 */
const CREATOR_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  DL: "DL",
  SUPER: "Super",
  MASTER: "Master",
};

export function getRequestedByLabel(request: DwRequest): string {
  // A self-service request was raised by the player on their own account, so
  // the creator is the player and the panel says so explicitly.
  if (request.sourceType === "SELF") {
    return `${request.username || "Player"} (Self)`;
  }

  const username = request.requestedByName;
  // An id that resolves to nobody — a deleted creator, or a row written by a
  // job rather than a person.
  if (!username) return "System";

  const roleLabel =
    CREATOR_ROLE_LABELS[String(request.requestedByRole ?? "").toUpperCase()];
  return roleLabel ? `${username} (${roleLabel})` : username;
}

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
