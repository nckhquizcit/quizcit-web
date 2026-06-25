const pick = (source, keys, fallback = undefined) => {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }
  return fallback;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const FALLBACK_QUIZ_NAME = "Chưa có tên bài quiz";
const FALLBACK_SUBJECT_NAME = "Không rõ môn học";

const pickText = (source, keys, fallback = "") => {
  const value = pick(source, keys, "");
  return typeof value === "string" && value.trim()
    ? normalizeVietnameseDisplayText(value.trim())
    : fallback;
};

const vietnameseDisplayReplacements = [
  [/\bChuong\b/g, "Chương"],
  [/\bchuong\b/g, "chương"],
  [/\bMon hoc\b/g, "Môn học"],
  [/\bmon hoc\b/g, "môn học"],
  [/\bDe thi\b/g, "Đề thi"],
  [/\bde thi\b/g, "đề thi"],
  [/\bBai kiem tra\b/g, "Bài kiểm tra"],
  [/\bbai kiem tra\b/g, "bài kiểm tra"],
];

function normalizeVietnameseDisplayText(value) {
  if (typeof value !== "string") return value;

  return vietnameseDisplayReplacements.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}

export function mapSubject(raw = {}) {
  const subjectId = pick(raw, ["subjectId", "subject_id", "id"]);
  const courseCode = pick(raw, ["courseCode", "course_code", "code"], "");

  return {
    ...raw,
    id: subjectId,
    subjectId,
    subject_id: subjectId,
    courseCode,
    course_code: courseCode,
    name: normalizeVietnameseDisplayText(pick(raw, ["name"], "")),
    description: normalizeVietnameseDisplayText(pick(raw, ["description"], "")),
    createdAt: pick(raw, ["createdAt", "created_at"], null),
    chapterCount: toNumber(pick(raw, ["chapterCount", "chapter_count"], 0)),
    progress: toNumber(pick(raw, ["progress", "progressPercent"], 0)),
    category: pick(raw, ["category"], "Nen tang"),
    status: pick(raw, ["status"], "Đang học"),
  };
}

export function mapChapter(raw = {}) {
  const chapterId = pick(raw, ["chapterId", "chapter_id", "id"]);
  const subjectId = pick(raw, ["subjectId", "subject_id"]);

  return {
    ...raw,
    id: chapterId,
    chapterId,
    chapter_id: chapterId,
    subjectId,
    subject_id: subjectId,
    name: normalizeVietnameseDisplayText(pick(raw, ["name"], "")),
    createdAt: pick(raw, ["createdAt", "created_at"], null),
  };
}

export function mapTheory(raw = {}) {
  const theoryId = pick(raw, ["theoryId", "theory_id", "id"]);
  const chapterId = pick(raw, ["chapterId", "chapter_id"]);

  return {
    ...raw,
    id: theoryId,
    theoryId,
    theory_id: theoryId,
    chapterId,
    chapter_id: chapterId,
    content: pick(raw, ["content"], ""),
    createdAt: pick(raw, ["createdAt", "created_at"], null),
  };
}

export function mapSkill(raw = {}) {
  const skillSource = raw.skill || raw;
  const skillId = pick(skillSource, ["skillId", "skill_id", "id"]);

  return {
    ...raw,
    id: skillId,
    skillId,
    skill_id: skillId,
    name: pick(skillSource, ["name", "skillName"], "Kỹ năng chưa đặt tên"),
    description: pick(skillSource, ["description"], ""),
    weight: toNumber(pick(raw, ["weight", "skillWeight", "questionWeight"], 0)),
    primary: Boolean(pick(raw, ["primary", "isPrimary"], false)),
  };
}

export function mapOption(raw = {}) {
  if (typeof raw === "string") {
    return {
      optionId: raw,
      id: raw,
      content: raw,
      corrected: false,
    };
  }

  const optionId = pick(raw, ["optionId", "option_id", "id"]);
  return {
    ...raw,
    id: optionId,
    optionId,
    option_id: optionId,
    content: pick(raw, ["content", "text", "label"], ""),
    corrected: Boolean(pick(raw, ["corrected", "correct", "isCorrect"], false)),
  };
}

export function mapQuestion(raw = {}) {
  const questionId = pick(raw, ["questionId", "question_id", "id"]);
  const subjectId = pick(raw, ["subjectId", "subject_id"]);
  const chapterId = pick(raw, ["chapterId", "chapter_id"]);
  const options = toArray(pick(raw, ["options", "answers"], [])).map(mapOption);
  const correctOptionId =
    pick(raw, ["correctOptionId", "correct_option_id"]) ||
    options.find((option) => option.corrected)?.optionId ||
    "";
  const difficultyB = toNumber(pick(raw, ["difficultyB", "difficulty_b", "difficulty"], 0));

  return {
    ...raw,
    id: questionId,
    questionId,
    question_id: questionId,
    subjectId,
    subject_id: subjectId,
    chapterId,
    chapter_id: chapterId,
    content: pick(raw, ["content"], ""),
    explanation: pick(raw, ["explanation", "explaination"], ""),
    difficultyB,
    difficulty: difficultyB <= -0.5 ? "Easy" : difficultyB >= 0.5 ? "Hard" : "Medium",
    active: pick(raw, ["active"], true),
    options,
    correctOptionId,
    skills: toArray(pick(raw, ["skills"], [])).map(mapSkill),
  };
}

export function mapQuiz(raw = {}) {
  const quizId = pick(raw, ["quizId", "quiz_id", "id"]);
  const subjectId = pick(raw, ["subjectId", "subject_id"]);
  const chapterId = pick(raw, ["chapterId", "chapter_id"]);
  const duration = toNumber(pick(raw, ["duration", "durationMinutes"], 0));

  return {
    ...raw,
    id: quizId,
    quizId,
    quiz_id: quizId,
    subjectId,
    subject_id: subjectId,
    chapterId,
    chapter_id: chapterId,
    name: normalizeVietnameseDisplayText(pick(raw, ["name"], "")),
    type: pick(raw, ["type"], "CHAPTER"),
    totalQuestion: toNumber(pick(raw, ["totalQuestion", "total_question"], 0)),
    duration,
    durationMinutes: duration,
  };
}

export function mapSkillResult(raw = {}) {
  const skillId = pick(raw, ["skillId", "skill_id", "id"]);
  return {
    ...raw,
    id: skillId,
    skillId,
    skill_id: skillId,
    name: pick(raw, ["name", "skillName"], ""),
    theta: toNumber(pick(raw, ["theta", "ability"], 0)),
    standardError: pick(raw, ["standardError", "standard_error"], null),
  };
}

export function mapQuizResult(raw = {}) {
  const attemptId = pick(raw, ["attemptId", "attempt_id", "id"]);
  const quizId = pick(raw, ["quizId", "quiz_id"]);
  const quizSource = pick(raw, ["quiz"], {});
  const rawSubjectSource = pick(raw, ["subject"]);
  const subjectSource =
    rawSubjectSource && Object.keys(rawSubjectSource).length > 0
      ? rawSubjectSource
      : pick(quizSource, ["subject"], {});
  const rawScore = toNumber(pick(raw, ["rawScore", "score"], 0));
  const totalQuestion = toNumber(pick(raw, ["totalQuestion", "total_question"], 0));
  const percentage = totalQuestion > 0 ? Math.round((rawScore / totalQuestion) * 100) : 0;
  const quizName =
    pickText(raw, ["quizName", "quiz_name"]) ||
    pickText(quizSource, ["name", "quizName", "quiz_name"], FALLBACK_QUIZ_NAME);
  const subjectName =
    pickText(raw, ["subjectName", "subject_name"]) ||
    pickText(subjectSource, ["name", "subjectName", "subject_name"], FALLBACK_SUBJECT_NAME);

  return {
    ...raw,
    id: attemptId,
    attemptId,
    attempt_id: attemptId,
    quizId,
    quiz_id: quizId,
    quizName,
    subjectName,
    rawScore,
    score: rawScore,
    totalQuestion,
    percentage,
    overallTheta: toNumber(pick(raw, ["overallTheta", "overall_theta"], 0)),
    submittedAt: pick(raw, ["submittedAt", "submitted_at", "createdAt", "created_at"], null),
    skillResults: toArray(pick(raw, ["skillResults", "skill_results"], [])).map(mapSkillResult),
  };
}

export const mapAttempt = mapQuizResult;

export function mapUser(raw = {}) {
  const userId = pick(raw, ["userId", "user_id", "id"]);
  return {
    ...raw,
    id: userId,
    userId,
    user_id: userId,
    username: pick(raw, ["username"], ""),
    email: pick(raw, ["email"], ""),
    displayName: pick(raw, ["displayName", "display_name"], pick(raw, ["username"], "")),
    role: pick(raw, ["role"], "USER"),
    status: pick(raw, ["status"], "UNVERIFIED"),
    createdAt: pick(raw, ["createdAt", "created_at"], null),
  };
}

export function mapUserSkillAbility(raw = {}) {
  const id = pick(raw, ["id", "abilityId", "ability_id"]);
  return {
    ...raw,
    id,
    userId: pick(raw, ["userId", "user_id"]),
    skillId: pick(raw, ["skillId", "skill_id"]),
    theta: toNumber(pick(raw, ["theta", "ability"], 0)),
    standardError: pick(raw, ["standardError", "standard_error"], null),
    updatedAt: pick(raw, ["updatedAt", "updated_at"], null),
  };
}

export function mapAbilityHistory(raw = {}) {
  return {
    ...raw,
    id: pick(raw, ["id", "historyId", "history_id"]),
    userId: pick(raw, ["userId", "user_id"]),
    skillId: pick(raw, ["skillId", "skill_id"]),
    theta: toNumber(pick(raw, ["theta"], 0)),
    delta: toNumber(pick(raw, ["delta"], 0)),
    standardError: pick(raw, ["standardError", "standard_error"], null),
    sourceAttemptId: pick(raw, ["sourceAttemptId", "source_attempt_id"], null),
    createdAt: pick(raw, ["createdAt", "created_at"], null),
  };
}
