import { request } from "./apiClient";
import { getDeleteParams } from "./apiContracts";
import { mapChapter, mapTheory } from "./mappers";

export async function getChaptersBySubject(subjectId) {
  const chapters = await request({ method: "GET", url: `/api/subjects/${subjectId}/chapters` });
  return (chapters || []).map(mapChapter).sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Optimized chapter summary endpoint for admin UI (includes questionCount and theoryCount).
 * Resilient fallback to getChaptersBySubject if endpoint is unavailable.
 */
export async function getChaptersSummary(subjectId) {
  try {
    const chapters = await request({
      method: "GET",
      url: `/api/admin/subjects/${subjectId}/chapters-summary`,
    });
    return (chapters || []).map(mapChapter).sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (err) {
    console.warn("Failed to get chapters summary, falling back to getChaptersBySubject:", err);
    return getChaptersBySubject(subjectId);
  }
}

export async function getAllChapters() {
  const chapters = await request({ method: "GET", url: "/api/chapters" });
  return (chapters || []).map(mapChapter).sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Full non-bank chapter catalog for admin UI.
 * Calls flattened GET /api/admin/chapters-flat in 1 request (avoiding N+1 loops).
 * Resilient fallback to per-subject queries if chapters-flat is unavailable.
 */
export async function getAllChaptersForAdmin(subjects = []) {
  try {
    const flatChapters = await request({ method: "GET", url: "/api/admin/chapters-flat" });
    if (Array.isArray(flatChapters) && flatChapters.length > 0) {
      return flatChapters.map(mapChapter).sort((a, b) => a.displayOrder - b.displayOrder);
    }
  } catch (err) {
    console.warn("Failed to fetch flat chapters, falling back to per-subject fetch:", err);
  }

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

/**
 * Full edit context for a chapter (including subject name, sibling chapters count/list, available skills, and theories).
 * Allows AdminChapterEdit to load in 1 single HTTP roundtrip instead of 5.
 */
export async function getChapterEditContext(chapterId) {
  const data = await request({
    method: "GET",
    url: `/api/v1/admin/chapters/${chapterId}/edit-context`,
  });
  return {
    chapter: mapChapter(data?.chapter),
    subjectId: data?.subjectId,
    subjectName: data?.subjectName,
    siblingChaptersCount: Number(data?.siblingChaptersCount || 0),
    siblingChapters: (data?.siblingChapters || []).map(mapChapter).sort((a, b) => a.displayOrder - b.displayOrder),
    availableSkills: data?.availableSkills || [],
    theories: (data?.theories || []).map(mapTheory),
  };
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
  return request({
    method: "DELETE",
    url: `/api/chapters/${chapterId}`,
    params: getDeleteParams(),
  });
}

export async function reorderChapters(subjectId, chapters) {
  return request({
    method: "PUT",
    url: `/api/subjects/${subjectId}/chapters/display-order`,
    data: { items: chapters.map((chapter) => ({ id: chapter.chapterId, displayOrder: chapter.displayOrder })) },
  });
}
