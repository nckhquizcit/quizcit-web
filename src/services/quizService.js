import { request } from "./apiClient";

export async function getQuestionsByChapter(chapterId) {
  return request({ method: "GET", url: `/api/chapters/${chapterId}/questions` });
}

export async function createQuestion(payload) {
  return request({ method: "POST", url: "/api/questions", data: payload });
}

export async function updateQuestion(questionId, payload) {
  return request({ method: "PUT", url: `/api/questions/${questionId}`, data: payload });
}

export async function deleteQuestion(questionId) {
  return request({ method: "DELETE", url: `/api/questions/${questionId}` });
}

export async function getQuizzesByChapter(chapterId) {
  return request({ method: "GET", url: `/api/chapters/${chapterId}/quizzes` });
}

export async function createQuiz(payload) {
  return request({ method: "POST", url: "/api/quizzes", data: payload });
}

export async function updateQuiz(quizId, payload) {
  return request({ method: "PUT", url: `/api/quizzes/${quizId}`, data: payload });
}

export async function deleteQuiz(quizId) {
  return request({ method: "DELETE", url: `/api/quizzes/${quizId}` });
}

export async function getUserAttempts(userId) {
  return request({ method: "GET", url: `/api/users/${userId}/attempts` });
}
