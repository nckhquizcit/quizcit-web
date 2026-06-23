import { chapters, questions, quizzes, subjects } from "../../../mock/mockData";

const quizTypeLabels = {
  CHAPTER: "Theo chương",
  FINAL: "Tổng hợp",
};

const normalizeQuizType = (type) => {
  if (type === "Tổng hợp" || type === "FINAL") return "FINAL";
  return "CHAPTER";
};

const enrichQuiz = (quiz) => {
  const subject = subjects.find((item) => item.id === quiz.subjectId);
  const chapter = chapters.find((item) => item.id === quiz.chapterId);

  return {
    ...quiz,
    subject,
    chapter,
    typeLabel: quizTypeLabels[quiz.type] || quiz.type,
  };
};

const toQuizPayload = (formValues, fallbackQuiz = {}) => {
  const questionIds = formValues.questionIds || fallbackQuiz.questionIds || [];

  return enrichQuiz({
    id: fallbackQuiz.id || `quiz-${Date.now()}`,
    name: formValues.name || fallbackQuiz.name || "",
    subjectId: formValues.subjectId || fallbackQuiz.subjectId || fallbackQuiz.subject?.id,
    chapterId: formValues.chapterId || fallbackQuiz.chapterId || fallbackQuiz.chapter?.id,
    type: normalizeQuizType(formValues.type || fallbackQuiz.type),
    duration: Number(formValues.duration || fallbackQuiz.duration || 0),
    totalQuestions: questionIds.length || Number(formValues.totalQuestions || fallbackQuiz.totalQuestions || 0),
    questionIds,
  });
};

export const adminQuizService = {
  getQuizzes() {
    return quizzes.map(enrichQuiz);
  },

  getSubjects() {
    return subjects;
  },

  getChapters() {
    return chapters;
  },

  getQuestions() {
    return questions.map((question) => {
      const chapter = chapters.find((item) => item.id === question.chapterId);
      const subject = subjects.find((item) => item.id === chapter?.subjectId);

      return {
        ...question,
        chapter,
        subject,
        difficultyLabel:
          question.difficulty === "medium"
            ? "TB"
            : question.difficulty === "hard"
              ? "Khó"
              : "Dễ",
      };
    });
  },

  getChaptersBySubject(subjectId) {
    return chapters.filter((chapter) => chapter.subjectId === subjectId);
  },

  getQuestionsByChapter(chapterId) {
    return this.getQuestions().filter((question) => !chapterId || question.chapterId === chapterId);
  },

  createQuiz(quizRows, formValues) {
    return [toQuizPayload(formValues), ...quizRows];
  },

  updateQuiz(quizRows, quizId, formValues) {
    return quizRows.map((quiz) =>
      quiz.id === quizId ? toQuizPayload(formValues, quiz) : quiz,
    );
  },

  getTypeLabel(type) {
    return quizTypeLabels[type] || type;
  },
};
