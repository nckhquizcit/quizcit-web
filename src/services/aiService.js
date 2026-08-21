import { request } from "./apiClient";
import { mapAiEstimateResponse } from "./apiContracts";

export { buildAiEstimatePayload } from "./apiContracts";

export async function estimateAbility(payload) {
  const result = await request({ method: "POST", url: "/api/ai/estimate", data: payload });
  return mapAiEstimateResponse(result);
}
