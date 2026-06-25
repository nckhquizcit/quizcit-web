import { request } from "./apiClient";
import { mapQuestion } from "./mappers";

function mapQuestionPayload(payload = {}) {
  return {
    subjectId: payload.subjectId,
    chapterId: payload.chapterId,
    content: payload.content,
    explanation: payload.explanation ?? payload.explaination ?? "",
    difficultyB: Number(payload.difficultyB ?? payload.difficulty ?? 0),
    options: (payload.options || []).map((option) => ({
      content: option.content,
      corrected: Boolean(option.corrected ?? option.correct ?? option.isCorrect),
    })),
    skills: (payload.skills || []).map((skill) => ({
      skillId: skill.skillId,
      weight: Number(skill.weight ?? 1),
      primary: Boolean(skill.primary),
    })),
  };
}

export async function getQuestionsByChapter(chapterId) {
  const questions = await request({ method: "GET", url: `/api/chapters/${chapterId}/questions` });
  return (questions || []).map(mapQuestion);
}

export async function getQuestionById(questionId) {
  return mapQuestion(await request({ method: "GET", url: `/api/questions/${questionId}` }));
}

export async function getQuestionsByQuiz(quizId) {
  const questions = await request({ method: "GET", url: `/api/quizzes/${quizId}/questions` });
  return (questions || []).map(mapQuestion);
}

export async function createQuestion(payload) {
  return mapQuestion(
    await request({ method: "POST", url: "/api/questions", data: mapQuestionPayload(payload) }),
  );
}

export async function updateQuestion(questionId, payload) {
  const result = await request({
    method: "PUT",
    url: `/api/questions/${questionId}`,
    data: mapQuestionPayload(payload),
  });
  return result ? mapQuestion(result) : mapQuestion({ questionId, ...payload });
}

export async function deleteQuestion(questionId) {
  return request({ method: "DELETE", url: `/api/questions/${questionId}` });
}
