import {
  changeCurrentUserPassword,
  getCurrentUser,
  getUserById,
  updateCurrentUserProfile,
} from "../../../services/userService";
import {
  confirmEmailChange,
  requestEmailChange,
  verifyOldEmail,
} from "../../../services/emailChangeService";
import { getStoredUser, request, setStoredUser } from "../../../services/apiClient";

const fallbackAdmin = {
  username: "admin",
  email: "admin@quizcit.vn",
  displayName: "Admin",
  role: "ADMINISTRATOR",
};

function syncStoredUser(updatedUser) {
  const current = getStoredUser() || {};
  const merged = { ...current, ...updatedUser };
  setStoredUser(merged);
  return merged;
}

export const adminProfileService = {
  async getCurrentAdmin() {
    const storedUser = getStoredUser();

    try {
      const freshUser = await getCurrentUser();
      if (freshUser) {
        return syncStoredUser(freshUser);
      }
    } catch {
      if (storedUser?.userId) {
        try {
          const freshUser = await getUserById(storedUser.userId);
          if (freshUser) {
            return syncStoredUser(freshUser);
          }
        } catch {
          // Graceful fallback to stored user
        }
      }
    }

    return storedUser || fallbackAdmin;
  },

  async updateAdminProfile(payload) {
    const updatedUser = await updateCurrentUserProfile(payload);
    return syncStoredUser(updatedUser);
  },

  async changeAdminPassword(currentPassword, newPassword) {
    return changeCurrentUserPassword(currentPassword, newPassword);
  },

  async requestEmailChange() {
    return requestEmailChange();
  },

  async verifyOldEmail({ challengeId, otp, newEmail }) {
    return verifyOldEmail({ challengeId, otp, newEmail });
  },

  async confirmEmailChange({ challengeId, otp }) {
    const result = await confirmEmailChange({ challengeId, otp });
    if (result) {
      syncStoredUser(result);
    }
    return result;
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
