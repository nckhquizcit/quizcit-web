import { request } from "./apiClient";

// ===== Subject =====
export async function getSubjects() {
  return request({ method: "GET", url: "/api/subjects" });
}

export async function getSubjectById(subjectId) {
  return request({ method: "GET", url: `/api/subjects/${subjectId}` });
}

export async function getQuizzesBySubject(subjectId) {
  return request({ method: "GET", url: `/api/subjects/${subjectId}/quizzes` });
}

export async function createSubject(payload) {
  return request({ method: "POST", url: "/api/subjects", data: payload });
}

export async function updateSubject(subjectId, payload) {
  return request({ method: "PUT", url: `/api/subjects/${subjectId}`, data: payload });
}

export async function deleteSubject(subjectId) {
  return request({ method: "DELETE", url: `/api/subjects/${subjectId}` });
}

// ===== Chapter =====
export async function getChaptersBySubject(subjectId) {
  return request({ method: "GET", url: `/api/subjects/${subjectId}/chapters` });
}

export async function createChapter(subjectId, payload) {
  return request({ method: "POST", url: `/api/subjects/${subjectId}/chapters`, data: payload });
}

export async function updateChapter(chapterId, payload) {
  return request({ method: "PUT", url: `/api/chapters/${chapterId}`, data: payload });
}

export async function deleteChapter(chapterId) {
  return request({ method: "DELETE", url: `/api/chapters/${chapterId}` });
}

// ===== Theory =====
export async function getTheoriesByChapter(chapterId) {
  return request({ method: "GET", url: `/api/chapters/${chapterId}/theories` });
}

export async function createTheory(chapterId, payload) {
  return request({ method: "POST", url: `/api/chapters/${chapterId}/theories`, data: payload });
}

export async function getTheoryById(theoryId) {
  return request({ method: "GET", url: `/api/theories/${theoryId}` });
}

export async function updateTheory(theoryId, payload) {
  return request({ method: "PUT", url: `/api/theories/${theoryId}`, data: payload });
}

export async function deleteTheory(theoryId) {
  return request({ method: "DELETE", url: `/api/theories/${theoryId}` });
}
