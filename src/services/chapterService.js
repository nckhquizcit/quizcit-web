import { request } from "./apiClient";
import { mapChapter } from "./mappers";

export async function getChaptersBySubject(subjectId) {
  const chapters = await request({ method: "GET", url: `/api/subjects/${subjectId}/chapters` });
  return (chapters || []).map(mapChapter);
}

export async function getChapterById(chapterId) {
  return mapChapter(await request({ method: "GET", url: `/api/chapters/${chapterId}` }));
}

export async function createChapter(subjectId, payload) {
  return mapChapter(
    await request({ method: "POST", url: `/api/subjects/${subjectId}/chapters`, data: payload }),
  );
}

export async function updateChapter(chapterId, payload) {
  const result = await request({ method: "PUT", url: `/api/chapters/${chapterId}`, data: payload });
  return result ? mapChapter(result) : null;
}

export async function deleteChapter(chapterId) {
  return request({ method: "DELETE", url: `/api/chapters/${chapterId}` });
}
