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

function fulfilledValues(results) {
  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}

export const adminDashboardService = {
  async getStats() {
    const [usersResult, subjectsResult] = await Promise.allSettled([getUsers(), getSubjects()]);
    const users = usersResult.status === "fulfilled" ? usersResult.value : [];
    const safeSubjects = subjectsResult.status === "fulfilled" && Array.isArray(subjectsResult.value)
      ? subjectsResult.value
      : [];

    const chapterResults = await Promise.allSettled(
      safeSubjects.map((subject) => getChaptersBySubject(subject.subjectId)),
    );
    const chapters = fulfilledValues(chapterResults).flatMap((items) =>
      Array.isArray(items) ? items : [],
    );

    const [questionResults, quizResults] = await Promise.all([
      Promise.allSettled(chapters.map((chapter) => getQuestionsByChapter(chapter.chapterId))),
      Promise.allSettled(safeSubjects.map((subject) => getQuizzesBySubject(subject.subjectId))),
    ]);
    const questionsByChapter = fulfilledValues(questionResults);
    const quizzesBySubject = fulfilledValues(quizResults);

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
