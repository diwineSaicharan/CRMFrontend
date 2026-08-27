import { api, type ApiResponse } from "@/lib/api";

/** One settled deposit or withdrawal, from either table. */
export interface CompletedTransaction {
  id: string;
  username: string | null;
  platform: string | null;
  type: "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  paymentMode: string | null;
  utrNumber: string | null;
  remarks: string | null;
  description: string | null;
  settledAt: string | null;
  /** The admin stage for root rows, the banker otherwise. */
  settledBy: string | null;
  isDummyRequest: boolean;
}

export interface CompletedPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type CompletedTab = "ALL" | "DEPOSIT" | "WITHDRAWAL";

export interface CompletedFilters {
  type?: CompletedTab;
  platformId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CompletedResponse extends ApiResponse<CompletedTransaction[]> {
  pagination?: CompletedPagination;
}

export const completedTransactionsApi = {
  list: (filters: CompletedFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.type && filters.type !== "ALL") params.set("type", filters.type);
    if (filters.platformId) params.set("platformId", filters.platformId);
    if (filters.search?.trim()) params.set("search", filters.search.trim());
    params.set("page", String(filters.page ?? 1));
    params.set("limit", String(filters.limit ?? 25));

    return api.get<CompletedResponse>(
      `/admin/deposit-withdrawal/completed?${params.toString()}`,
    );
  },
};
