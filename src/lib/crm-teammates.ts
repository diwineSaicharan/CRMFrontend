import { api, type ApiResponse } from "@/lib/api";
import type { CrmCapability, CrmPermissions } from "@/lib/auth";

/** A CRM teammate and the access they hold. */
export interface CrmTeammate {
  id: string;
  username: string;
  fullName: string | null;
  mobileNumber: string | null;
  isActive: boolean;
  createdAt: string;
  parentUsername: string | null;
  permissions: Record<CrmCapability, boolean>;
  profileName: string | null;
  /** "Deposits, Withdrawals" — derived server-side from the booleans. */
  accessSummary: string;
  permissionsActive: boolean;
}

export interface CreateTeammateInput {
  username: string;
  fullName: string;
  password: string;
  mobileNumber?: string | null;
  profileName?: string | null;
  permissions: Partial<Record<CrmCapability, boolean>>;
}

const BASE = "/crm-teammates";

export const crmTeammateApi = {
  /** The caller's own access. The profile carries this too; this is for a re-check. */
  me: () => api.get<ApiResponse<CrmPermissions>>(`${BASE}/me`),

  list: () => api.get<ApiResponse<CrmTeammate[]>>(BASE),

  create: (input: CreateTeammateInput) =>
    api.post<ApiResponse<{ id: string; username: string; accessSummary: string }>>(
      BASE,
      input,
    ),

  updatePermissions: (
    id: string,
    input: { profileName?: string | null; isActive?: boolean } & Partial<
      Record<CrmCapability, boolean>
    >,
  ) => api.put<ApiResponse<unknown>>(`${BASE}/${id}/permissions`, input),
};

/** Labels and blurbs for the permission picker, in sidebar order. */
export const CRM_CAPABILITY_INFO: Array<{
  key: CrmCapability;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: "clients",
    label: "Clients",
    description: "See the client directory and player profiles.",
    icon: "groups",
  },
  {
    key: "create",
    label: "Create",
    description: "Create platform users.",
    icon: "person_add",
  },
  {
    key: "deposit",
    label: "Deposits",
    description: "Raise, verify and reject deposit requests.",
    icon: "south_west",
  },
  {
    key: "withdrawal",
    label: "Withdrawals",
    description: "Raise, process, verify and reject withdrawals.",
    icon: "north_east",
  },
  {
    key: "transaction",
    label: "Transactions",
    description: "See every settled deposit and withdrawal.",
    icon: "receipt_long",
  },
];
