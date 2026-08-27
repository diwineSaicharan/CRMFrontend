import { api } from "@/lib/api";

/**
 * Lead-source options for the create-user form.
 *
 * Plain names: the value is stored as text on `user_master."leadSource"`, so
 * there is no lookup table and no id to carry. Served by the API rather than
 * hard-coded here so the list has one definition.
 */
interface LeadSourceListResponse {
  success: boolean;
  data: string[];
}

export async function getLeadSources(): Promise<string[]> {
  const response = await api.get<LeadSourceListResponse>("/lead-sources");
  return Array.isArray(response?.data) ? response.data : [];
}
