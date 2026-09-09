export function normalizeAdminStats(stats = {}, fallbackSkillsCount = 0) {
  const rawSkills = stats?.totalSkills;
  const totalSkills =
    rawSkills !== undefined && rawSkills !== null
      ? Number(rawSkills)
      : Number(fallbackSkillsCount || 0);

  return {
    totalSubjects: Number(stats?.totalSubjects || 0),
    totalQuestions: Number(stats?.totalQuestions || 0),
    totalQuizzes: Number(stats?.totalQuizzes || 0),
    totalSkills,
    totalUsers: Number(stats?.totalUsers || 0),
  };
}
