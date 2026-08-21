import { request } from "./apiClient";
import { getDeleteParams } from "./apiContracts";
import { mapChapter } from "./mappers";

export async function getChaptersBySubject(subjectId) {
  const chapters = await request({ method: "GET", url: `/api/subjects/${subjectId}/chapters` });
  return (chapters || []).map(mapChapter).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getAllChapters() {
  const chapters = await request({ method: "GET", url: "/api/chapters" });
  return (chapters || []).map(mapChapter).sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Full non-bank chapter catalog for admin UI.
 * Uses per-subject endpoints so counts/placement stay complete even if
 * GET /api/chapters is filtered (e.g. view-as user).
 */
export async function getAllChaptersForAdmin(subjects = []) {
  const subjectIds = (subjects || [])
    .map((subject) => subject?.subjectId ?? subject?.subject_id ?? subject?.id)
    .filter(Boolean);
  const results = await Promise.allSettled(subjectIds.map((subjectId) => getChaptersBySubject(subjectId)));
  const chapters = results.flatMap((result) => (result.status === "fulfilled" ? result.value || [] : []));

  if (chapters.length || !subjectIds.length) {
    return chapters.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return getAllChapters();
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

export async function deleteChapter(chapterId, hard = false) {
  return request({
    method: "DELETE",
    url: `/api/chapters/${chapterId}`,
    params: getDeleteParams(hard),
  });
}

export async function reorderChapters(subjectId, chapters) {
  return request({
    method: "PUT",
    url: `/api/subjects/${subjectId}/chapters/display-order`,
    data: { items: chapters.map((chapter) => ({ id: chapter.chapterId, displayOrder: chapter.displayOrder })) },
  });
}
