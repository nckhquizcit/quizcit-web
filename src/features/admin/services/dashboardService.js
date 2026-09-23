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
  async getThetaTrends() {
    return request({ method: "GET", url: "/api/admin/theta-trends" });
  },
  async getVisibleSubjectsForTrends() {
    return request({ method: "GET", url: "/api/admin/theta-trends/subjects" });
  },
  async getSubjectThetaTrendOverTime(subjectId, months = 3) {
    return request({ method: "GET", url: `/api/admin/theta-trends/subjects/${subjectId}?months=${months}` });
  },
  async getQuestionPerformanceStats() {
    return request({ method: "GET", url: "/api/admin/questions/performance-stats" });
  },
  async getDifficultyTuningPreview(x, y) {
    return request({ method: "GET", url: `/api/admin/questions/difficulty-tuning-preview?x=${x}&y=${y}` });
  },
  async applyDifficultyTuning(x, y) {
    return request({ method: "POST", url: "/api/admin/questions/apply-difficulty-tuning", data: { x, y } });
  }
};
