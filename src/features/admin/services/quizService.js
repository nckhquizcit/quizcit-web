import { request } from "../../../services/apiClient";

export async function getQuizzesByChapter(chapterId) {
  return request({ method: "GET", url: `/api/chapters/${chapterId}/quizzes` });
}

export async function getQuestionsByChapter(chapterId) {
  return request({ method: "GET", url: `/api/chapters/${chapterId}/questions` });
}

export async function createQuiz(payload) {
  return request({ method: "POST", url: "/api/quizzes", data: payload });
}

export async function deleteQuiz(quizId) {
  return request({ method: "DELETE", url: `/api/quizzes/${quizId}` });
}
