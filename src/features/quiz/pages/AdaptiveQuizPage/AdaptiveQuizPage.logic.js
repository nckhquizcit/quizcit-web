export const ADAPTIVE_PAGE_SIZE = 5;
export const ADAPTIVE_MIN_QUESTION_COUNT = 15;

export function isValidAdaptiveQuestionCount(value) {
  const count = Number(value);
  return Number.isInteger(count)
    && count >= ADAPTIVE_MIN_QUESTION_COUNT
    && count % ADAPTIVE_PAGE_SIZE === 0;
}

export function hasAnsweredAdaptiveBatch(questions = [], answers = {}) {
  return questions.length === ADAPTIVE_PAGE_SIZE
    && questions.every((question) => Boolean(answers[question.questionId]));
}

export function buildAdaptiveBatchAnswers(questions = [], answers = {}) {
  return questions.map((question) => ({
    questionId: question.questionId,
    optionId: answers[question.questionId],
  }));
}
