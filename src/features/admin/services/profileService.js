import { getUserById } from "../../../services/userService";
import { request } from "../../../services/apiClient";

const fallbackAdmin = {
  username: "admin",
  email: "admin@quizcit.vn",
  displayName: "Admin",
  role: "ADMINISTRATOR",
};

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

export const adminProfileService = {
  async getCurrentAdmin() {
    const storedUser = getStoredUser();

    if (!storedUser?.userId) {
      return storedUser || fallbackAdmin;
    }

    const freshUser = await getUserById(storedUser.userId);
    return { ...storedUser, ...freshUser };
  },

  async getAdminProfileStats() {
    const stats = await request({ method: "GET", url: "/api/admin/data-stats" });
    return {
      totalUsers: Number(stats?.totalUsers || 0),
      totalSubjects: Number(stats?.totalSubjects || 0),
      totalQuestions: Number(stats?.totalQuestions || 0),
      totalAttempts: Number(stats?.totalAttempts || 0),
    };
  },
};
