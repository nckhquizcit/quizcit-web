import {
  chapters,
  questionImportHistory,
  questions,
  subjects,
} from "../../../mock/mockData";

const difficultyToUi = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const importStatusToUi = {
  SUCCESS: { label: "Thành công", tone: "success" },
  PARTIAL: { label: "Một phần", tone: "warning" },
  FAILED: { label: "Thất bại", tone: "danger" },
};

const normalizeDifficulty = (difficulty) =>
  String(difficulty || "easy").toLowerCase();

const getQuestionSubject = (chapterId) => {
  const chapter = chapters.find((item) => item.id === chapterId);
  const subject = subjects.find((item) => item.id === chapter?.subjectId);

  return { chapter, subject };
};

const enrichQuestion = (question) => {
  const { chapter, subject } = getQuestionSubject(question.chapterId);

  return {
    ...question,
    chapter,
    subject,
    type: question.type || "MCQ",
    status: question.status || (question.isActive === false ? "Unpublished" : "Published"),
    updatedAt: question.updatedAt || "Hôm nay",
  };
};

const toQuestionPayload = (formValues, fallbackQuestion = {}) => {
  const chapterId = formValues.chapterId || fallbackQuestion.chapter?.id || fallbackQuestion.chapterId;
  const subjectId = formValues.subjectId || fallbackQuestion.subject?.id || fallbackQuestion.subjectId;

  return enrichQuestion({
    id: fallbackQuestion.id || `q-${Date.now()}`,
    subjectId,
    chapterId,
    content: formValues.content || fallbackQuestion.content || "",
    difficulty: normalizeDifficulty(formValues.difficulty || fallbackQuestion.difficulty),
    type: formValues.type || fallbackQuestion.type || "MCQ",
    status: formValues.status || fallbackQuestion.status || "Published",
    updatedAt: "Hôm nay",
    options: (formValues.options || fallbackQuestion.options || []).map((option, index) => ({
      id: option.id || `${fallbackQuestion.id || "new"}-option-${index + 1}`,
      content: option.content,
      isCorrect: Boolean(option.isCorrect),
    })),
  });
};

export const adminQuestionService = {
  getInitialQuestions() {
    return questions.map(enrichQuestion);
  },

  getSubjects() {
    return subjects;
  },

  getChapters() {
    return chapters;
  },

  getImportHistory() {
    return questionImportHistory.map((item) => {
      const status = importStatusToUi[item.status] || importStatusToUi.FAILED;

      return {
        id: item.id,
        fileName: item.fileName,
        date: item.importedAt,
        total: item.totalQuestions,
        status: status.label,
        tone: status.tone,
      };
    });
  },

  filterQuestions(questionRows, { chapterId, search }) {
    const keyword = search.trim().toLowerCase();

    return questionRows.filter((question) => {
      const matchChapter = !chapterId || question.chapter?.id === chapterId;
      const matchSearch = !keyword || question.content.toLowerCase().includes(keyword);

      return matchChapter && matchSearch;
    });
  },

  paginateQuestions(questionRows, { page, pageSize }) {
    const totalPages = Math.max(1, Math.ceil(questionRows.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const items = questionRows.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalPages,
      safePage,
      startIndex,
      displayStart: questionRows.length ? startIndex + 1 : 0,
      displayEnd: startIndex + items.length,
    };
  },

  createQuestion(questionRows, formValues) {
    return [toQuestionPayload(formValues), ...questionRows];
  },

  updateQuestion(questionRows, questionId, formValues) {
    return questionRows.map((question) =>
      question.id === questionId ? toQuestionPayload(formValues, question) : question,
    );
  },

  unpublishQuestion(questionRows, questionId) {
    return questionRows.map((question) =>
      question.id === questionId ? { ...question, status: "Unpublished" } : question,
    );
  },

  deleteQuestion(questionRows, questionId) {
    return questionRows.filter((question) => question.id !== questionId);
  },

  getDifficultyLabel(difficulty) {
    return difficultyToUi[normalizeDifficulty(difficulty)] || "Easy";
  },
};
