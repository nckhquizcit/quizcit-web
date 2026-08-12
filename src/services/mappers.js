import { resolveContentFormat } from "../components/richtext/richTextUtils.js";

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

const THETA_RAW_MIN = -4;
const THETA_RAW_MAX = 4;
const THETA_SCALED_MIN = 0;
const THETA_SCALED_MAX = 4;

const ABILITY_LEVELS = [
  { max: -1.5, key: "weak", label: "Yếu" },
  { max: -0.5, key: "average", label: "Trung bình" },
  { max: 0.5, key: "fair", label: "Trung bình khá" },
  { max: 1.5, key: "good", label: "Khá" },
  { max: 2.5, key: "very-good", label: "Giỏi" },
  { max: Infinity, key: "excellent", label: "Xuất sắc" },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const roundTheta = (value) => Math.round(value * 10000) / 10000;

export function scaleThetaForDisplay(thetaRaw) {
  const raw = clamp(toNumber(thetaRaw, 0), THETA_RAW_MIN, THETA_RAW_MAX);
  const scaled =
    ((raw - THETA_RAW_MIN) / (THETA_RAW_MAX - THETA_RAW_MIN)) *
      (THETA_SCALED_MAX - THETA_SCALED_MIN) +
    THETA_SCALED_MIN;

  return roundTheta(clamp(scaled, THETA_SCALED_MIN, THETA_SCALED_MAX));
}

export function pickThetaScaled(raw = {}, thetaRaw = 0) {
  const directValue = pick(raw, ["thetaScaled", "theta_scaled"]);
  if (directValue !== undefined && directValue !== null) {
    return toNumber(directValue, scaleThetaForDisplay(thetaRaw));
  }

  return scaleThetaForDisplay(thetaRaw);
}

export function thetaScaledToPercent(thetaScaled) {
  const scaled = clamp(toNumber(thetaScaled, 0), THETA_SCALED_MIN, THETA_SCALED_MAX);
  return Math.round((scaled / THETA_SCALED_MAX) * 100);
}

export function thetaRawToPercent(thetaRaw) {
  return thetaScaledToPercent(scaleThetaForDisplay(thetaRaw));
}

export function formatThetaValue(thetaRaw) {
  return toNumber(thetaRaw, 0).toFixed(2);
}

export function formatScaledThetaValue(thetaRaw) {
  return scaleThetaForDisplay(thetaRaw).toFixed(2);
}

export function getAbilityLevel(thetaRaw) {
  const raw = toNumber(thetaRaw, 0);
  const level = ABILITY_LEVELS.find((item) => raw < item.max) || ABILITY_LEVELS.at(-1);
  return {
    key: level.key,
    label: level.label,
    theta: raw,
    thetaScaled: scaleThetaForDisplay(raw),
  };
}

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
    visible: Boolean(pick(raw, ["visible", "isVisible", "is_visible"], true)),
    createdAt: pick(raw, ["createdAt", "created_at"], null),
    displayOrder: toNumber(pick(raw, ["displayOrder", "display_order"], 0)),
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
    displayOrder: toNumber(pick(raw, ["displayOrder", "display_order"], 0)),
    skills: toArray(pick(raw, ["skills"], [])).map((skill) => ({
      ...mapSkill(skill),
      requiredTheta: toNumber(pick(skill, ["requiredTheta", "required_theta"], 0)),
    })),
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
    contentFormat: pick(raw, ["contentFormat", "content_format"], "plain"),
    createdAt: pick(raw, ["createdAt", "created_at"], null),
  };
}

export function mapSkill(raw = {}) {
  const skillSource = raw.skill || raw;
  const skillId = pick(skillSource, ["skillId", "skill_id", "id"]);
  const skillName = pickText(
    skillSource,
    ["name", "skillName", "skill_name"],
    "Kỹ năng chưa đặt tên",
  );

  return {
    ...raw,
    id: skillId,
    skillId,
    skill_id: skillId,
    name: skillName,
    skillName,
    description: pick(skillSource, ["description"], ""),
    weight: toNumber(pick(raw, ["weight", "skillWeight", "questionWeight"], 0)),
    primary: Boolean(pick(raw, ["primary", "isPrimary"], false)),
  };
}

/**
 * Đáp án không có cột content_format riêng ở database vì chúng luôn được tạo
 * và sửa cùng câu hỏi. `fallbackFormat` là định dạng của câu hỏi cha, dùng khi
 * API không kèm theo giá trị này.
 */
export function mapOption(raw = {}, fallbackFormat = "plain") {
  if (typeof raw === "string") {
    return {
      optionId: raw,
      id: raw,
      content: raw,
      contentFormat: "plain",
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
    contentFormat: pick(raw, ["contentFormat", "content_format"], fallbackFormat),
    corrected: Boolean(pick(raw, ["corrected", "correct", "isCorrect"], false)),
  };
}

export function mapQuestion(raw = {}) {
  const questionId = pick(raw, ["questionId", "question_id", "id"]);
  const subjectId = pick(raw, ["subjectId", "subject_id"]);
  const chapterId = pick(raw, ["chapterId", "chapter_id"]);
  const content = pick(raw, ["content"], "");
  const contentFormat = resolveContentFormat(
    content,
    pick(raw, ["contentFormat", "content_format"], "plain"),
  );
  const options = toArray(pick(raw, ["options", "answers"], [])).map((option) =>
    mapOption(option, contentFormat),
  );
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
    content,
    explanation: pick(raw, ["explanation", "explaination"], ""),
    contentFormat,
    difficultyB,
    difficulty: difficultyB <= -1.8 ? "Easy" : difficultyB >= 1.8 ? "Hard" : "Medium",
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
    displayOrder: toNumber(pick(raw, ["displayOrder", "display_order"], 0)),
    createdAt: pick(raw, ["createdAt", "created_at"], null),
  };
}

export function mapSkillResult(raw = {}) {
  const skillId = pick(raw, ["skillId", "skill_id", "id"]);
  const theta = toNumber(pick(raw, ["theta", "ability"], 0));
  const delta = toNumber(pick(raw, ["delta"], 0));
  const skillName = pickText(
    raw,
    ["skillName", "skill_name", "name"],
    "Kỹ năng chưa đặt tên",
  );
  const thetaScaled = pickThetaScaled(raw, theta);

  return {
    ...raw,
    id: skillId,
    skillId,
    skill_id: skillId,
    name: skillName,
    skillName,
    theta,
    thetaScaled,
    delta,
    deltaScaled: roundTheta(thetaScaled - scaleThetaForDisplay(theta - delta)),
  };
}

export function mapQuestionResult(raw = {}) {
  const questionId = pick(raw, ["questionId", "question_id", "id"]);
  const selectedOptionId = pick(raw, ["selectedOptionId", "selected_option_id"], null);
  const correctOptionId = pick(raw, ["correctOptionId", "correct_option_id"], null);
  const content = pick(raw, ["content"], "");
  const contentFormat = resolveContentFormat(
    content,
    pick(raw, ["contentFormat", "content_format"], "plain"),
  );
  const options = toArray(pick(raw, ["options"], [])).map((option) =>
    mapOption(option, contentFormat),
  );
  const selectedOption = options.find((option) => option.optionId === selectedOptionId);
  const correctOption = options.find((option) => option.optionId === correctOptionId);
  // Chỉ suy ra độ khó khi API thực sự trả về, tránh mọi câu đều thành "Trung bình".
  const difficultyB = pick(raw, ["difficultyB", "difficulty_b"]);
  const difficulty =
    difficultyB === undefined
      ? null
      : toNumber(difficultyB) <= -1.8
        ? "Easy"
        : toNumber(difficultyB) >= 1.8
          ? "Hard"
          : "Medium";

  return {
    ...raw,
    id: questionId,
    questionId,
    question_id: questionId,
    questionNumber: toNumber(pick(raw, ["questionNumber", "question_number"], 0)),
    difficulty,
    content,
    explanation: pick(raw, ["explanation", "explaination"], ""),
    contentFormat,
    selectedOptionId,
    correctOptionId,
    correct: Boolean(pick(raw, ["correct", "isCorrect", "score"], false)),
    options,
    selectedOptionContent:
      pick(raw, ["selectedOptionContent", "selected_option_content"], "") ||
      selectedOption?.content ||
      "",
    correctOptionContent:
      pick(raw, ["correctOptionContent", "correct_option_content"], "") ||
      correctOption?.content ||
      "",
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
  const overallTheta = toNumber(pick(raw, ["overallTheta", "overall_theta"], 0));
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
    overallTheta,
    overallThetaScaled: pickThetaScaled(raw, overallTheta),
    submittedAt: pick(raw, ["submittedAt", "submitted_at", "createdAt", "created_at"], null),
    skillResults: toArray(pick(raw, ["skillResults", "skill_results"], [])).map(mapSkillResult),
    questionResults: toArray(pick(raw, ["questionResults", "question_results"], [])).map(mapQuestionResult),
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
  const skillName = pickText(raw, ["skillName", "skill_name", "name"], "Kỹ năng chưa đặt tên");
  const theta = toNumber(pick(raw, ["theta", "ability"], 0));
  return {
    ...raw,
    id,
    userId: pick(raw, ["userId", "user_id"]),
    skillId: pick(raw, ["skillId", "skill_id"]),
    name: skillName,
    skillName,
    theta,
    thetaScaled: pickThetaScaled(raw, theta),
    updatedAt: pick(raw, ["updatedAt", "updated_at"], null),
  };
}

export function mapAbilityHistory(raw = {}) {
  const skillName = pickText(raw, ["skillName", "skill_name", "name"], "Kỹ năng chưa đặt tên");
  const theta = toNumber(pick(raw, ["theta"], 0));
  const delta = toNumber(pick(raw, ["delta"], 0));
  const thetaScaled = pickThetaScaled(raw, theta);
  const previousThetaScaled = scaleThetaForDisplay(theta - delta);

  return {
    ...raw,
    id: pick(raw, ["id", "historyId", "history_id"]),
    userId: pick(raw, ["userId", "user_id"]),
    skillId: pick(raw, ["skillId", "skill_id"]),
    name: skillName,
    skillName,
    theta,
    thetaScaled,
    delta,
    deltaScaled: roundTheta(thetaScaled - previousThetaScaled),
    sourceAttemptId: pick(raw, ["sourceAttemptId", "source_attempt_id"], null),
    createdAt: pick(raw, ["createdAt", "created_at"], null),
  };
}
