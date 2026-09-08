import { request } from "../../../services/apiClient";
import { getSkills } from "../../../services/skillService";
import { normalizeAdminStats } from "../utils/adminDashboardLogic";

export { normalizeAdminStats };

export const adminDashboardService = {
  async getStats() {
    const stats = await request({ method: "GET", url: "/api/admin/data-stats" });
    let fallbackSkillsCount = 0;

    if (stats?.totalSkills === undefined || stats?.totalSkills === null) {
      try {
        const skills = await getSkills();
        fallbackSkillsCount = Array.isArray(skills) ? skills.length : 0;
      } catch {
        fallbackSkillsCount = 0;
      }
    }

    return normalizeAdminStats(stats, fallbackSkillsCount);
  },
};
