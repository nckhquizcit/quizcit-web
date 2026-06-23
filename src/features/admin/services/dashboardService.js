import { getUsers } from "../../../services/userService";
import {
  getChaptersBySubject,
  getQuizzesBySubject,
  getSubjects,
} from "../../../services/contentService";
import { getQuestionsByChapter } from "../../../services/quizService";

function countItems(items) {
  return Array.isArray(items) ? items.length : 0;
}

export const adminDashboardService = {
  async getStats() {
    const [users, subjects] = await Promise.all([getUsers(), getSubjects()]);
    const safeSubjects = Array.isArray(subjects) ? subjects : [];

    const chaptersBySubject = await Promise.all(
      safeSubjects.map((subject) => getChaptersBySubject(subject.subjectId)),
    );
    const chapters = chaptersBySubject.flatMap((items) =>
      Array.isArray(items) ? items : [],
    );

    const [questionsByChapter, quizzesBySubject] = await Promise.all([
      Promise.all(chapters.map((chapter) => getQuestionsByChapter(chapter.chapterId))),
      Promise.all(safeSubjects.map((subject) => getQuizzesBySubject(subject.subjectId))),
    ]);

    return {
      totalUsers: countItems(users),
      totalSubjects: safeSubjects.length,
      totalQuestions: questionsByChapter.reduce(
        (total, questions) => total + countItems(questions),
        0,
      ),
      totalQuizzes: quizzesBySubject.reduce(
        (total, quizzes) => total + countItems(quizzes),
        0,
      ),
    };
  },
};
