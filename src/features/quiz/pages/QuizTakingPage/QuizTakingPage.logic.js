export const QUIZ_PAGE_SIZE = 5;

const getSafePageSize = (pageSize = QUIZ_PAGE_SIZE) => {
  const numericPageSize = Number(pageSize);
  return Number.isFinite(numericPageSize) && numericPageSize > 0
    ? Math.floor(numericPageSize)
    : QUIZ_PAGE_SIZE;
};

export const getTotalQuizPages = (questionCount, pageSize = QUIZ_PAGE_SIZE) => {
  const numericQuestionCount = Number(questionCount);
  const safeQuestionCount =
    Number.isFinite(numericQuestionCount) && numericQuestionCount > 0
      ? Math.floor(numericQuestionCount)
      : 0;
  const safePageSize = getSafePageSize(pageSize);

  return Math.max(1, Math.ceil(safeQuestionCount / safePageSize));
};

export const clampQuizPage = (page, totalPages) => {
  const numericPage = Number(page);
  const numericTotalPages = Number(totalPages);
  const safeTotalPages =
    Number.isFinite(numericTotalPages) && numericTotalPages > 0
      ? Math.floor(numericTotalPages)
      : 1;
  const safePage = Number.isFinite(numericPage) ? Math.floor(numericPage) : 0;

  return Math.min(Math.max(safePage, 0), safeTotalPages - 1);
};

export const isQuizDraftExpired = (draft, now = Date.now()) => {
  if (!draft?.attemptId) return false;
  const deadlineAt = Number(draft.deadlineAt);
  return Number.isFinite(deadlineAt) && deadlineAt > 0 && deadlineAt <= now;
};

export const getResumableQuizDraft = (
  draft,
  quizId,
  durationSeconds,
  now = Date.now(),
  targetAttemptId = null,
) => {
  if (!draft?.attemptId) return null;
  if (targetAttemptId && String(draft.attemptId) !== String(targetAttemptId)) return null;
  if (draft.quizId && String(draft.quizId) !== String(quizId)) return null;

  const duration = Number(durationSeconds);
  if (Number.isFinite(duration) && duration > 0) {
    const deadlineAt = Number(draft.deadlineAt);
    if (!Number.isFinite(deadlineAt) || deadlineAt <= now) return null;
  }

  return draft;
};

export const getQuestionPage = (index, pageSize = QUIZ_PAGE_SIZE) => {
  const numericIndex = Number(index);
  const safeIndex = Number.isFinite(numericIndex)
    ? Math.max(Math.floor(numericIndex), 0)
    : 0;

  return Math.floor(safeIndex / getSafePageSize(pageSize));
};

export const getPageNavigationTarget = (
  questions,
  requestedPage,
  pageSize = QUIZ_PAGE_SIZE,
) => {
  const list = Array.isArray(questions) ? questions : [];
  const safePageSize = getSafePageSize(pageSize);
  const page = clampQuizPage(
    requestedPage,
    getTotalQuizPages(list.length, safePageSize),
  );

  return {
    page,
    questionId: list[page * safePageSize]?.questionId ?? null,
  };
};

export const getQuestionNavigationTarget = (
  questions,
  index,
  pageSize = QUIZ_PAGE_SIZE,
) => {
  const list = Array.isArray(questions) ? questions : [];

  if (list.length === 0) {
    return { page: 0, questionId: null };
  }

  const numericIndex = Number(index);
  const safeIndex = Math.min(
    Math.max(Number.isFinite(numericIndex) ? Math.floor(numericIndex) : 0, 0),
    list.length - 1,
  );

  return {
    page: getQuestionPage(safeIndex, pageSize),
    questionId: list[safeIndex]?.questionId ?? null,
  };
};

export const getQuizPaginationPages = (currentPage, totalPages) => {
  const safeTotal =
    Number.isFinite(Number(totalPages)) && Number(totalPages) > 0
      ? Math.floor(Number(totalPages))
      : 1;
  const safeCurrent = clampQuizPage(currentPage, safeTotal);

  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, index) => index);
  }

  if (safeCurrent <= 2) {
    return [0, 1, 2, 3, "...", safeTotal - 1];
  }

  if (safeCurrent >= safeTotal - 3) {
    return [
      0,
      "...",
      safeTotal - 4,
      safeTotal - 3,
      safeTotal - 2,
      safeTotal - 1,
    ];
  }

  return [
    0,
    "...",
    safeCurrent - 1,
    safeCurrent,
    safeCurrent + 1,
    "...",
    safeTotal - 1,
  ];
};
