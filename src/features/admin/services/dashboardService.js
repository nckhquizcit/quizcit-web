import { request } from "../../../services/apiClient";

export const adminDashboardService = {
  async getStats() {
    const stats = await request({ method: "GET", url: "/api/admin/data-stats" });
    return {
      totalUsers: Number(stats?.totalUsers || 0),
      totalSubjects: Number(stats?.totalSubjects || 0),
      totalQuestions: Number(stats?.totalQuestions || 0),
      totalQuizzes: Number(stats?.totalQuizzes || 0),
    };
  },
};
