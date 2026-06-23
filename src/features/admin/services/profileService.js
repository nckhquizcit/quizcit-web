import { getUserById, getUsers } from "../../../services/userService";
import { getChaptersBySubject, getSubjects } from "../../../services/contentService";
import { getQuestionsByChapter, getUserAttempts } from "../../../services/quizService";

const fallbackAdmin = {
  username: "admin",
  email: "admin@quizcit.vn",
  displayName: "Admin",
  role: "ADMINISTRATOR",
};

function countItems(items) {
  return Array.isArray(items) ? items.length : 0;
}

function countFulfilledItems(results) {
  return results.reduce((total, result) => {
    if (result.status !== "fulfilled") {
      return total;
    }

    return total + countItems(result.value);
  }, 0);
}

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
    const [users, subjects] = await Promise.all([getUsers(), getSubjects()]);
    const safeUsers = Array.isArray(users) ? users : [];
    const safeSubjects = Array.isArray(subjects) ? subjects : [];

    const chaptersBySubject = await Promise.all(
      safeSubjects.map((subject) => getChaptersBySubject(subject.subjectId)),
    );
    const chapters = chaptersBySubject.flatMap((items) =>
      Array.isArray(items) ? items : [],
    );

    const usersWithId = safeUsers.filter((user) => user?.userId);

    const [questionsByChapter, attemptsByUser] = await Promise.all([
      Promise.all(chapters.map((chapter) => getQuestionsByChapter(chapter.chapterId))),
      Promise.allSettled(usersWithId.map((user) => getUserAttempts(user.userId))),
    ]);

    return {
      totalUsers: safeUsers.length,
      totalSubjects: safeSubjects.length,
      totalQuestions: questionsByChapter.reduce(
        (total, questions) => total + countItems(questions),
        0,
      ),
      totalAttempts: countFulfilledItems(attemptsByUser),
    };
  },
};
