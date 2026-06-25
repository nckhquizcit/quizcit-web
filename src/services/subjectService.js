import { request } from "./apiClient";
import { mapSubject } from "./mappers";

export async function getSubjects() {
  const subjects = await request({ method: "GET", url: "/api/subjects" });
  return (subjects || []).map(mapSubject);
}

export async function getSubjectById(subjectId) {
  return mapSubject(await request({ method: "GET", url: `/api/subjects/${subjectId}` }));
}

export async function createSubject(payload) {
  return mapSubject(await request({ method: "POST", url: "/api/subjects", data: payload }));
}

export async function updateSubject(subjectId, payload) {
  const result = await request({ method: "PUT", url: `/api/subjects/${subjectId}`, data: payload });
  return result ? mapSubject(result) : null;
}

export async function deleteSubject(subjectId) {
  return request({ method: "DELETE", url: `/api/subjects/${subjectId}` });
}
