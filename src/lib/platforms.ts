import { api } from "@/lib/api";

/** Mirrors diwine_admin_ui/src/app/core/services/platform.service.ts. */
export interface Platform {
  id: string;
  name: string;
  url?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  platformType?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PlatformListResponse {
  success: boolean;
  data: Platform[];
}

/**
 * `includeInactive` maps to the two query shapes the admin service sends:
 * `?includeInactive=true` for everything, `?active=true` for live ones only.
 * The create forms call it with `true`, so an inactive platform a DL is
 * already attached to still shows up rather than silently disappearing.
 */
export async function getAllPlatforms(includeInactive = false): Promise<Platform[]> {
  const queryString = includeInactive ? "includeInactive=true" : "active=true";
  const response = await api.get<PlatformListResponse>(`/platforms?${queryString}`);
  return Array.isArray(response?.data) ? response.data : [];
}
