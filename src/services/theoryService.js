import { request } from "./apiClient";
import { getDeleteParams } from "./apiContracts";
import { mapTheory } from "./mappers";

export async function getTheoriesByChapter(chapterId) {
  const theories = await request({ method: "GET", url: `/api/chapters/${chapterId}/theories` });
  return (theories || []).map(mapTheory);
}

export async function getTheoriesBySubject(subjectId) {
  const theories = await request({ method: "GET", url: `/api/subjects/${subjectId}/theories` });
  return (theories || []).map(mapTheory);
}

export async function getTheoryById(theoryId) {
  return mapTheory(await request({ method: "GET", url: `/api/theories/${theoryId}` }));
}

export async function createTheory(chapterId, payload) {
  return mapTheory(
    await request({ method: "POST", url: `/api/chapters/${chapterId}/theories`, data: payload }),
  );
}

export async function updateTheory(theoryId, payload) {
  const result = await request({ method: "PUT", url: `/api/theories/${theoryId}`, data: payload });
  return result ? mapTheory(result) : null;
}

export async function deleteTheory(theoryId) {
  return request({
    method: "DELETE",
    url: `/api/theories/${theoryId}`,
    params: getDeleteParams(),
  });
}

export async function reindexTheoriesBySubject(subjectId) {
  return request({ method: "POST", url: `/api/subjects/${subjectId}/theories/reindex` });
}
