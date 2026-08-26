import { api, type ApiResponse } from "@/lib/api";

export type ClientEntityKey = "dl" | "super" | "master" | "users" | "teammates";

/** Rows fetched per page — CLIENT_DIRECTORY_PAGE_SIZE in the Angular app. */
export const CLIENT_DIRECTORY_PAGE_SIZE = 25;

export interface Client {
  id: string;
  username: string;
  fullName?: string | null;
  mobileNumber?: string | null;
  category?: string | null;
  balance?: number;
  exposure?: number;
  bonusBalance?: number;
  sharingRatio?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  betCount?: number;
  winningPercent?: number;
  lifetimePnl?: number;
  affiliateLink?: string | null;
  lastDepositDate?: string | null;
  createdAt?: string;
  isActive?: boolean;
  isBetLocked?: boolean;
  isSportsLocked?: boolean;
  isCasinoLocked?: boolean;
  sharingTree?: string;
}

/** Endpoint per entity, matching routes/index.ts mounts in diwine_admin. */
const LIST_ENDPOINT: Record<ClientEntityKey, string> = {
  dl: "/dl-users",
  super: "/super-masters",
  master: "/masters",
  users: "/end-users",
  teammates: "/admin/teammates",
};

export interface ClientListResponse {
  items: Client[];
  total: number;
}

export async function fetchClients(
  entity: ClientEntityKey,
  options: { page?: number; limit?: number; search?: string } = {},
): Promise<ClientListResponse> {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? CLIENT_DIRECTORY_PAGE_SIZE),
  });
  if (options.search) params.set("search", options.search);

  const res = await api.get<ApiResponse<Client[] | ClientListResponse>>(
    `${LIST_ENDPOINT[entity]}?${params.toString()}`,
  );

  // The admin API is inconsistent about whether `data` is the array or a
  // wrapper — normalise once here rather than at every call site.
  const data = res.data;
  if (Array.isArray(data)) return { items: data, total: data.length };
  return { items: data?.items ?? [], total: data?.total ?? 0 };
}
