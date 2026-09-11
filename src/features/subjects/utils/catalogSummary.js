export function normalizeCatalogSummary(catalog) {
  if (!Array.isArray(catalog)) {
    return {
      subjectCollection: [],
      enrollments: [],
    };
  }

  const subjectCollection = catalog.map((subject) => ({
    ...subject,
    subject_id: subject.subjectId || subject.subject_id,
    course_code: subject.courseCode || subject.course_code,
    openChapterCount: subject.openChapterCount ?? subject.chapterCount ?? 0,
    chapterCount: subject.openChapterCount ?? subject.chapterCount ?? 0,
    chapterPreview: (subject.chapterPreview || []).map((ch) => ({
      chapter_id: ch.chapterId || ch.chapter_id,
      name: ch.name || "",
    })),
  }));

  const enrollments = catalog
    .filter((s) => s.enrolled)
    .map((s) => ({
      ...s,
      subjectId: s.subjectId || s.subject_id,
      subject_id: s.subjectId || s.subject_id,
      courseCode: s.courseCode || s.course_code,
      course_code: s.courseCode || s.course_code,
      enrolledAt: s.enrolledAt,
    }));

  return {
    subjectCollection,
    enrollments,
  };
}
