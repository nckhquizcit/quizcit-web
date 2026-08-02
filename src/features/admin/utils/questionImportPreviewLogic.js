const normalizeSearchText = (value) =>
  value === undefined || value === null ? "" : String(value).trim().toLowerCase();

export function getImportSkillsForChapter(chapters = [], chapterId = "") {
  const chapter = chapters.find(
    (item) => String(item?.chapterId ?? item?.id ?? "") === String(chapterId),
  );

  return Array.isArray(chapter?.skills) ? chapter.skills : [];
}

export function filterImportSkills(skills = [], search = "") {
  const keyword = normalizeSearchText(search);

  if (!keyword) return skills;

  return skills.filter((skill) => {
    const skillId = normalizeSearchText(skill?.skillId ?? skill?.id);
    const skillName = normalizeSearchText(skill?.name ?? skill?.skillName);

    return skillId.includes(keyword) || skillName.includes(keyword);
  });
}
