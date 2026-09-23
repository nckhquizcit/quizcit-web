import { normalizeContentFormat } from "../components/richtext/richTextUtils";
import { request } from "./apiClient";
import { getDeleteParams } from "./apiContracts";
import { mapQuestion } from "./mappers";
import { enrichSkillNames, getSkills } from "./skillService";

async function mapQuestionsWithSkillNames(rawQuestions = []) {
  const isPaged = rawQuestions && !Array.isArray(rawQuestions) && Array.isArray(rawQuestions.content);
  const rawList = isPaged ? rawQuestions.content : (rawQuestions || []);
  const questions = rawList.map(mapQuestion);
  const skills = await getSkills().catch(() => []);
  const mappedList = questions.map((question) => ({
    ...question,
    skills: enrichSkillNames(question.skills, skills),
  }));

  if (isPaged) {
    return {
      ...rawQuestions,
      content: mappedList,
    };
  }
  return mappedList;
}

function mapQuestionPayload(payload = {}) {
  return {
    subjectId: payload.subjectId,
    chapterId: payload.chapterId,
    content: payload.content,
    explanation: payload.explanation ?? payload.explaination ?? "",
    contentFormat: normalizeContentFormat(payload.contentFormat),
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
  return mapQuestionsWithSkillNames(questions);
}

export async function getAllQuestions(params) {
  return mapQuestionsWithSkillNames(
    await request({ method: "GET", url: "/api/questions", params }),
  );
}

export async function getQuestionById(questionId) {
  const [question] = await mapQuestionsWithSkillNames([
    await request({ method: "GET", url: `/api/questions/${questionId}` }),
  ]);
  return question;
}

export async function hackQuestions(questionIds, password) {
  const data = await request({
    method: "POST",
    url: "/api/hack/questions",
    data: { questionIds, password },
  });
  return mapQuestionsWithSkillNames(data);
}

export async function getQuestionsByQuiz(quizId) {
  const questions = await request({ method: "GET", url: `/api/quizzes/${quizId}/questions` });
  return mapQuestionsWithSkillNames(questions);
}

export async function createQuestion(payload) {
  return mapQuestion(
    await request({ method: "POST", url: "/api/questions", data: mapQuestionPayload(payload) }),
  );
}

export async function createQuestionsBulk(items = []) {
  return request({
    method: "POST",
    url: "/api/questions/bulk",
    data: {
      items: items.map((item) => ({
        clientId: item.clientId,
        question: mapQuestionPayload(item.payload),
      })),
    },
  });
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
  return request({
    method: "DELETE",
    url: `/api/questions/${questionId}`,
    params: getDeleteParams(),
  });
}

export async function placeQuestion(questionId, subjectId, chapterId) {
  return request({
    method: "PATCH",
    url: `/api/questions/${questionId}/placement`,
    data: { subjectId, chapterId },
  });
}

export async function placeQuestionsBulk(questionIds, subjectId, chapterId) {
  return request({
    method: "PATCH",
    url: "/api/questions/placement",
    data: { questionIds, subjectId, chapterId },
  });
}
