import { api, type ApiResponse } from "@/lib/api";

/**
 * Endpoints mirror diwine_admin_ui/src/app/admin/services/deposit-withdrawal.service.ts,
 * which hangs everything off `${apiUrl}/admin/deposit-withdrawal`.
 */
const BASE = "/admin/deposit-withdrawal";

export interface DwUser {
  id: string;
  username: string;
  fullName?: string | null;
  mobileNumber?: string | null;
  category?: string | null;
  balance?: number;
}

export interface OperationBank {
  id: string;
  bankName: string;
  accountNumber?: string | null;
  ifscCode?: string | null;
  upiId?: string | null;
  minDepositAmount?: number | null;
  maxDepositAmount?: number | null;
}

export interface PayoutProfile {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName?: string;
  ifscCode?: string;
}

export interface UserPlatform {
  id: string;
  name: string;
}

export interface BonusPreview {
  bonusEligible: boolean;
  bonusPlanName?: string;
  bonusAmount: number;
  totalAmount: number;
}

export type QuickCreateKind = "user" | "deposit" | "withdrawal";

export const dwApi = {
  searchUsers: (query: string) =>
    api.get<ApiResponse<DwUser[]>>(
      `${BASE}/search-users?query=${encodeURIComponent(query)}`,
    ),

  getBanks: () => api.get<ApiResponse<OperationBank[]>>(`${BASE}/banks`),

  getPayoutProfiles: (userId: string) =>
    api.get<ApiResponse<PayoutProfile[]>>(
      `${BASE}/user-payout-profiles?userId=${encodeURIComponent(userId)}`,
    ),

  addPayoutProfile: (input: {
    userId: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  }) => api.post<ApiResponse<PayoutProfile>>(`${BASE}/user-payout-profiles`, input),

  getUserPlatforms: (userId?: string) =>
    api.get<ApiResponse<UserPlatform[]>>(
      userId
        ? `${BASE}/user-platforms?userId=${encodeURIComponent(userId)}`
        : `${BASE}/user-platforms`,
    ),

  previewBonus: (input: { userId: string; amount: number; platformId?: string }) =>
    api.post<ApiResponse<BonusPreview>>(`${BASE}/preview-bonus`, input),

  /**
   * Root ("dummy") player: no DL, Super or Master above them, so their funds
   * never move chips from anyone else. Password is generated server-side.
   */
  createDummyUser: (input: {
    username: string;
    fullName?: string;
    mobileNumber?: string;
    category?: string;
    /** First of `platformIds`; the controller's single-platform column. */
    platformId?: string;
    platformIds?: string[];
    alternateMobileNumber?: string;
    dateOfJoining?: string;
    location?: string;
    leadSource?: string;
  }) =>
    api.post<ApiResponse<{ id: string; username: string }>>(
      `${BASE}/create-dummy-user`,
      input,
    ),

  createRequest: (input: Record<string, unknown>) =>
    api.post<ApiResponse<{ id: string }>>(`${BASE}/create`, input),
};
