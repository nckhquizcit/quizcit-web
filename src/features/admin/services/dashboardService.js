import { questions, subjects } from "../../../mock/mockData";
import { mockAttempts } from "../../../mock/mockAttempt";
import { mockUsers } from "../../../mock/mockUser";

export const adminDashboardService = {
  getStats() {
    return {
      totalUsers: mockUsers.length,
      totalSubjects: subjects.length,
      totalQuestions: questions.length,
      totalQuizzes: mockAttempts.length,
    };
  },

  getRecentActivities() {
    return [
      {
        id: "activity-user-created",
        title: "Người dùng mới đăng ký",
        actor: "nguyenvanb@example.com",
        timeLabel: "5 phút trước",
      },
      {
        id: "activity-quiz-created",
        title: "Đề thi mới được tạo",
        actor: "Admin",
        timeLabel: "15 phút trước",
      },
      {
        id: "activity-question-updated",
        title: "Câu hỏi được chỉnh sửa",
        actor: "Admin",
        timeLabel: "1 giờ trước",
      },
    ];
  },
};
