/**
 * Ghép danh sách môn đã đăng ký với catalog môn học và danh sách chương đã mở.
 *
 * @param {Array} enrollments - Danh sách môn đã đăng ký từ getMyEnrollments()
 * @param {Array} catalogSubjects - Danh mục toàn bộ môn học từ getSubjects()
 * @param {Array} openChapters - Danh sách chương đã mở từ getAllChapters()
 * @returns {Array} Danh sách môn đã đăng ký kèm số chương đã mở, sắp xếp theo displayOrder
 */
export function buildEnrolledSubjects(
  enrollments = [],
  catalogSubjects = [],
  openChapters = [],
) {
  if (!Array.isArray(enrollments) || enrollments.length === 0) {
    return [];
  }

  const catalogById = new Map(
    (Array.isArray(catalogSubjects) ? catalogSubjects : []).map((subject) => [
      String(subject.subjectId || subject.subject_id || subject.id),
      subject,
    ]),
  );

  const chapters = Array.isArray(openChapters) ? openChapters : [];

  return enrollments
    .map((item) => {
      const id = String(item.subjectId || item.subject_id || item.id);
      const catalog = catalogById.get(id);
      const chapterCount = chapters.filter(
        (chapter) => String(chapter.subjectId || chapter.subject_id) === id,
      ).length;

      if (!catalog) {
        return {
          ...item,
          id,
          subjectId: id,
          subject_id: id,
          courseCode: item.courseCode || item.course_code || "",
          name: item.name || "",
          imageUrl: item.imageUrl || item.image_url || "",
          displayOrder: Number(item.displayOrder ?? item.display_order ?? 0),
          enrolled: true,
          chapterCount,
        };
      }

      return {
        ...catalog,
        ...item,
        id,
        subjectId: id,
        subject_id: id,
        courseCode:
          item.courseCode ||
          item.course_code ||
          catalog.courseCode ||
          catalog.course_code ||
          "",
        name: item.name || catalog.name || "",
        imageUrl:
          item.imageUrl ||
          item.image_url ||
          catalog.imageUrl ||
          catalog.image_url ||
          "",
        displayOrder: Number(
          item.displayOrder ??
            item.display_order ??
            catalog.displayOrder ??
            catalog.display_order ??
            0,
        ),
        enrolled: true,
        chapterCount,
        enrolledAt: item.enrolledAt ?? catalog.enrolledAt ?? null,
      };
    })
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}
