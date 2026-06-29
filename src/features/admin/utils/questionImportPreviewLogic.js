const normalizeSearchText = (value) =>
  value === undefined || value === null ? "" : String(value).trim().toLowerCase();

export function filterImportSkills(skills = [], search = "") {
  const keyword = normalizeSearchText(search);

  if (!keyword) return skills;

  return skills.filter((skill) => {
    const skillId = normalizeSearchText(skill?.skillId ?? skill?.id);
    const skillName = normalizeSearchText(skill?.name ?? skill?.skillName);

    return skillId.includes(keyword) || skillName.includes(keyword);
  });
}
