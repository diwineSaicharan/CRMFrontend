import { api } from "@/lib/api";

/**
 * Player creation. Only the dummy/root path is implemented here, deliberately:
 * it is a single-database transaction (user, wallet, platform access) with no
 * hierarchy to walk and no sikenderX mirror, which is exactly what makes it
 * safe to reimplement. Normal players are created in diwine_admin, where that
 * six-write path already exists.
 *
 * Same URL as the admin's Deposit/Withdrawal page uses.
 */
export interface CreateDummyUserInput {
  username: string;
  fullName?: string;
  mobileNumber?: string | null;
  category?: string;
  platformId?: string;
}

interface CreateDummyUserResponse {
  success: boolean;
  message?: string;
  data?: { id: string; username: string };
}

export const endUserApi = {
  createDummyUser: (input: CreateDummyUserInput) =>
    api.post<CreateDummyUserResponse>(
      "/admin/deposit-withdrawal/create-dummy-user",
      input,
    ),
};
