import { chapters, subjects } from "../../../mock/mockData";

export const adminSubjectService = {
  getSubjects() {
    return subjects;
  },

  searchSubjects(keyword) {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) return subjects;

    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(normalizedKeyword) ||
        subject.code.toLowerCase().includes(normalizedKeyword),
    );
  },

  getSubjectById(subjectId) {
    return subjects.find((subject) => subject.id === subjectId);
  },

  getSubjectChapterCount(subjectId) {
    return chapters.filter((chapter) => chapter.subjectId === subjectId).length;
  },
};
