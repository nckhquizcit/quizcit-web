import { request } from "./apiClient";

export async function getHomeSummary() {
  return request({ method: "GET", url: "/api/v1/pages/home-summary" });
}
