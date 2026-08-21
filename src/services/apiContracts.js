export const RBAC_ENDPOINTS = {
  roles: "/api/users/roles",
  permissions: "/api/users/permissions",
};

export const getDeleteParams = (hard = false) => ({ hard: Boolean(hard) });

export function buildProfilePayload({ displayName, avatarUrl }) {
  return avatarUrl === undefined ? { displayName } : { displayName, avatarUrl };
}

export function buildAiEstimatePayload(questionResults = [], questions = []) {
  if (!questionResults.length) return null;

  const questionsById = new Map(
    questions.map((question) => [String(question.questionId ?? question.id), question]),
  );
  const rows = questionResults.map((result) => {
    const question = questionsById.get(String(result.questionId ?? result.id));
    const difficulty = Number(question?.difficultyB ?? result.difficultyB);
    if (!question || !Number.isFinite(difficulty)) return null;

    const skills = question.skills || [];
    const weightedSkill = skills.find((skill) => skill.primary) || skills[0];
    const rawWeight = Number(weightedSkill?.weight ?? 1);

    return {
      response: result.correct ? 1 : 0,
      difficulty,
      weight: Number.isFinite(rawWeight) ? rawWeight : 1,
    };
  });

  if (rows.some((row) => !row)) return null;
  return {
    responses: rows.map((row) => row.response),
    difficulties: rows.map((row) => row.difficulty),
    weights: rows.map((row) => row.weight),
  };
}

export function mapAiEstimateResponse(result = {}) {
  const optionalNumber = (value) => {
    if (value === undefined || value === null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  return {
    theta: optionalNumber(result.theta),
    thetaScaled: optionalNumber(result.thetaScaled ?? result.theta_scaled),
    standardError: optionalNumber(result.standardError ?? result.standard_error),
  };
}
