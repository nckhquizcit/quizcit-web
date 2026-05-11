import { chapters, questions, subjects } from "../../../mock/mockData";

export const adminChapterService = {
  getSubjectById(subjectId) {
    return subjects.find((subject) => subject.id === subjectId);
  },

  getChaptersBySubject(subjectId) {
    return chapters.filter((chapter) => chapter.subjectId === subjectId);
  },

  searchChapters(subjectId, keyword) {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const subjectChapters = this.getChaptersBySubject(subjectId);

    if (!normalizedKeyword) return subjectChapters;

    return subjectChapters.filter((chapter) =>
      chapter.name.toLowerCase().includes(normalizedKeyword),
    );
  },

  getQuestionCountByChapter(chapterId) {
    return questions.filter((question) => question.chapterId === chapterId).length;
  },
};
