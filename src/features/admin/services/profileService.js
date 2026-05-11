import { questions, subjects } from "../../../mock/mockData";
import { mockAttempts } from "../../../mock/mockAttempt";
import { mockUsers } from "../../../mock/mockUser";

export const adminProfileService = {
  getCurrentAdmin() {
    return (
      mockUsers.find((user) => user.role === "ADMINISTRATOR") || {
        username: "admin",
        email: "admin@quizcit.vn",
        role: "ADMINISTRATOR",
      }
    );
  },

  getAdminProfileStats() {
    return {
      totalUsers: mockUsers.length,
      totalSubjects: subjects.length,
      totalQuestions: questions.length,
      totalAttempts: mockAttempts.length,
    };
  },
};
