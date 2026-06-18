import { request } from "./apiClient";

export async function getSubjects() {
  return request({ method: "GET", url: "/api/subjects" });
}

export async function getSubjectById(subjectId) {
  return request({ method: "GET", url: `/api/subjects/${subjectId}` });
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

export async function getChaptersBySubject(subjectId) {
  return request({ method: "GET", url: `/api/subjects/${subjectId}/chapters` });
}

export async function createChapter(subjectId, payload) {
  return request({ method: "POST", url: `/api/subjects/${subjectId}/chapters`, data: payload });
}

export async function getTheoriesByChapter(chapterId) {
  return request({ method: "GET", url: `/api/chapters/${chapterId}/theories` });
}
