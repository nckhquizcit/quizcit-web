import { matchDifficultyPresetKey } from "./difficultyLevels.js";

const getSkillId = (skill) => skill?.skillId ?? skill?.id ?? skill?.skill?.skillId ?? skill?.skill?.id;

const getSkillName = (skill) =>
  skill?.name ?? skill?.skillName ?? skill?.skill?.name ?? "Kỹ năng chưa đặt tên";

export function filterQuestionBankQuestions(
  questions = [],
  { search = "", subjectId = "ALL", difficulty = "ALL", skillId = "ALL" } = {},
) {
  const query = String(search).trim().toLowerCase();

  return questions.filter((question) => {
    const matchesSubject = subjectId === "ALL" || String(question.subjectId) === String(subjectId);
    const matchesDifficulty =
      difficulty === "ALL" ||
      matchDifficultyPresetKey(question.difficultyB ?? 0) === difficulty;
    const matchesSkill =
      skillId === "ALL" || (question.skills || []).some((skill) => String(getSkillId(skill)) === String(skillId));
    const matchesSearch =
      !query ||
      [question.content, question.subject?.name, question.chapter?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

    return matchesSubject && matchesDifficulty && matchesSkill && matchesSearch;
  });
}

export function getQuestionSkillOptions(chapters = [], questions = []) {
  const options = new Map();
  [...chapters.flatMap((chapter) => chapter?.skills || []), ...questions.flatMap((question) => question?.skills || [])]
    .forEach((skill) => {
      const skillId = getSkillId(skill);
      if (skillId && !options.has(String(skillId))) {
        options.set(String(skillId), { skillId: String(skillId), name: getSkillName(skill) });
      }
    });

  return [...options.values()].sort((left, right) => left.name.localeCompare(right.name, "vi"));
}
