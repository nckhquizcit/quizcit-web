import { request } from "./apiClient";
import { mapAttempt, mapQuiz, mapQuizResult } from "./mappers";
import { enrichSkillNames, getSkills } from "./skillService";
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getAllQuestions,
  getQuestionsByChapter,
  getQuestionsByQuiz,
  updateQuestion,
} from "./questionService";

const QUIZ_DRAFT_PREFIX = "quizcit:quiz-draft:";

async function mapResultWithSkillNames(rawResult) {
  const result = mapQuizResult(rawResult);
  if (!result.skillResults.length) return result;
  const skills = await getSkills().catch(() => []);
  return { ...result, skillResults: enrichSkillNames(result.skillResults, skills) };
}

function mapQuizPayload(payload = {}) {
  return {
    subjectId: payload.subjectId,
    chapterId: payload.chapterId,
    name: payload.name,
    totalQuestion: Number(payload.totalQuestion ?? payload.questionIds?.length ?? 0),
    duration: Number(payload.duration ?? payload.durationMinutes ?? 0),
    type: payload.type || "CHAPTER",
    questionIds: payload.questionIds || [],
    displayOrder: payload.displayOrder ? Number(payload.displayOrder) : null,
  };
}

export async function getQuizzesByChapter(chapterId) {
  const quizzes = await request({ method: "GET", url: `/api/chapters/${chapterId}/quizzes` });
  return (quizzes || []).map(mapQuiz).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getQuizzesBySubject(subjectId) {
  const quizzes = await request({ method: "GET", url: `/api/subjects/${subjectId}/quizzes` });
  return (quizzes || []).map(mapQuiz).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getQuizById(quizId) {
  return mapQuiz(await request({ method: "GET", url: `/api/quizzes/${quizId}` }));
}

export async function createQuiz(payload) {
  return mapQuiz(await request({ method: "POST", url: "/api/quizzes", data: mapQuizPayload(payload) }));
}

export async function updateQuiz(quizId, payload) {
  const result = await request({
    method: "PUT",
    url: `/api/quizzes/${quizId}`,
    data: {
      name: payload.name,
      duration: payload.duration ?? payload.durationMinutes,
      chapterId: payload.chapterId,
      displayOrder: payload.displayOrder ? Number(payload.displayOrder) : null,
      questionIds: payload.questionIds,
    },
  });
  return result ? mapQuiz(result) : mapQuiz({ quizId, ...payload });
}

export async function deleteQuiz(quizId) {
  return request({ method: "DELETE", url: `/api/quizzes/${quizId}` });
}

export async function reorderQuizzes(chapterId, quizzes) {
  return request({
    method: "PUT",
    url: `/api/chapters/${chapterId}/quizzes/display-order`,
    data: { items: quizzes.map((quiz) => ({ id: quiz.quizId, displayOrder: quiz.displayOrder })) },
  });
}

export async function startQuiz(quizId, userId) {
  return request({ method: "POST", url: `/api/quizzes/${quizId}/start`, params: { userId } });
}

export async function startAdaptiveQuiz(subjectId, totalQuestion) {
  return request({
    method: "POST",
    url: `/api/subjects/${subjectId}/adaptive-attempts`,
    data: { totalQuestion: Number(totalQuestion) },
  });
}

export async function getAdaptiveAttempt(attemptId) {
  return request({ method: "GET", url: `/api/adaptive-attempts/${attemptId}` });
}

export async function submitAdaptiveBatch(attemptId, answers) {
  return request({
    method: "POST",
    url: `/api/adaptive-attempts/${attemptId}/answers`,
    data: { answers },
  });
}

export async function submitAttempt(payload) {
  const { quizId, attemptId, answers = [] } = payload || {};
  const data = { quizId, attemptId, answers };

  const result =
    quizId && attemptId
      ? await request({
          method: "POST",
          url: `/api/quizzes/${quizId}/attempts/${attemptId}/submit`,
          data,
        })
      : await request({ method: "POST", url: "/api/attempts/submit", data });

  return mapResultWithSkillNames(result);
}

export async function getAttemptResult(attemptId) {
  return mapResultWithSkillNames(
    await request({ method: "GET", url: `/api/attempts/${attemptId}/result` }),
  );
}

export async function getUserAttempts(userId) {
  const attempts = await request({ method: "GET", url: `/api/users/${userId}/attempts` });
  return (attempts || []).map(mapAttempt);
}

export function getQuizDraftKey(quizId, userId) {
  return `${QUIZ_DRAFT_PREFIX}${userId || "anonymous"}:${quizId}`;
}

export function loadQuizDraft(quizId, userId) {
  try {
    const rawDraft = sessionStorage.getItem(getQuizDraftKey(quizId, userId));
    return rawDraft ? JSON.parse(rawDraft) : null;
  } catch {
    return null;
  }
}

export function saveQuizDraft(quizId, userId, draft) {
  try {
    sessionStorage.setItem(getQuizDraftKey(quizId, userId), JSON.stringify(draft));
  } catch {
    // Best-effort only; backend currently has no save-draft API.
  }
}

export function clearQuizDraft(quizId, userId) {
  try {
    sessionStorage.removeItem(getQuizDraftKey(quizId, userId));
  } catch {
    // Nuốt lỗi: hàm này chạy giữa lúc nộp bài thành công và điều hướng sang trang
    // kết quả, ném ra đây sẽ báo "nộp bài thất bại" cho một lượt nộp đã thành công.
  }
}

export { createQuestion, deleteQuestion, getAllQuestions, getQuestionById, getQuestionsByChapter, getQuestionsByQuiz, updateQuestion };
