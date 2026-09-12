export function normalizeHomeSummary(summary) {
  if (!summary || typeof summary !== "object") {
    return {
      enrolledSubjects: [],
      totalUnlockedChapters: 0,
      skillCount: 0,
      averageTheta: null,
      abilityLevel: null,
    };
  }

  const enrolledSubjects = (Array.isArray(summary.enrolledSubjects) ? summary.enrolledSubjects : []).map(
    (subject) => ({
      ...subject,
      id: subject.subjectId || subject.id,
      subjectId: subject.subjectId || subject.id,
      chapterCount: subject.chapterCount ?? subject.unlockedChapterCount ?? 0,
      unlockedChapterCount: subject.unlockedChapterCount ?? subject.chapterCount ?? 0,
      totalChapterCount: subject.totalChapterCount ?? 0,
    })
  );

  const stats = summary.stats || {};
  const abilityOverview = summary.abilityOverview || {};

  return {
    enrolledSubjects,
    totalUnlockedChapters: stats.totalUnlockedChapters ?? 0,
    skillCount: abilityOverview.skillCount ?? 0,
    averageTheta: toFiniteTheta(abilityOverview.averageTheta),
    abilityLevel: abilityOverview.abilityLevel || null,
  };
}

// Chuỗi không phải số vẫn qua được Number() thành NaN: phải chặn để không hiện năng lực 0.00.
function toFiniteTheta(raw) {
  if (raw === undefined || raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
