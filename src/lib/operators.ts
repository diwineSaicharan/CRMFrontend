import { api, type ApiResponse } from "@/lib/api";

/**
 * Mirrors diwine_admin_ui/src/app/core/services/operator-commission.service.ts
 * — the two endpoints the create forms load their ratio tables from.
 */
export interface Operator {
  operatorId: string;
  operatorName: string;
  operatorType: string;
  sharingRatio?: number | null;
  gameProviderFee?: number | null;
  betfairCommission?: number | null;
  fancyCommission?: number | null;
  bookmakerCommission?: number | null;
}

export const operatorApi = {
  getCasinoOperators: () => api.get<ApiResponse<Operator[]>>("/operators/casino"),
  getSportsOperators: () => api.get<ApiResponse<Operator[]>>("/operators/sports"),
};

/**
 * Both tables load together because the form shows them together — one failing
 * should not blank the other, so each settles independently.
 */
export async function loadRatioOperators(): Promise<{
  casino: Operator[];
  sports: Operator[];
}> {
  const [casino, sports] = await Promise.allSettled([
    operatorApi.getCasinoOperators(),
    operatorApi.getSportsOperators(),
  ]);

  const unwrap = (result: PromiseSettledResult<ApiResponse<Operator[]>>): Operator[] =>
    result.status === "fulfilled" && Array.isArray(result.value?.data)
      ? result.value.data
      : [];

  return { casino: unwrap(casino), sports: unwrap(sports) };
}
