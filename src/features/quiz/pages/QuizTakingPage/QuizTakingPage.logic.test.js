import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPageNavigationTarget,
  getQuestionNavigationTarget,
  getResumableQuizDraft,
  getTotalQuizPages,
  isQuizDraftExpired,
} from "./QuizTakingPage.logic.js";

const questions = Array.from({ length: 12 }, (_, index) => ({
  questionId: `q${index + 1}`,
}));

describe("QuizTakingPage navigation logic", () => {
  it("loads the first question when moving to the next page", () => {
    assert.deepEqual(getPageNavigationTarget(questions, 1), {
      page: 1,
      questionId: "q6",
    });
  });

  it("targets the exact clicked question and its page", () => {
    assert.deepEqual(getQuestionNavigationTarget(questions, 7), {
      page: 1,
      questionId: "q8",
    });
  });

  it("clamps page navigation to available questions", () => {
    assert.deepEqual(getPageNavigationTarget(questions, 99), {
      page: 2,
      questionId: "q11",
    });
  });

  it("keeps an empty quiz on a single safe page", () => {
    assert.equal(getTotalQuizPages(0), 1);
    assert.deepEqual(getPageNavigationTarget([], 1), {
      page: 0,
      questionId: null,
    });
  });
});

describe("QuizTakingPage draft recovery", () => {
  const now = 1_700_000_000_000;
  const draft = {
    attemptId: "attempt-1",
    quizId: "quiz-1",
    deadlineAt: now + 60_000,
    answers: { q1: "o1" },
  };

  it("restores only a draft that still belongs to the active attempt window", () => {
    assert.equal(getResumableQuizDraft(draft, "quiz-1", 600, now), draft);
    assert.equal(
      getResumableQuizDraft({ ...draft, deadlineAt: now - 1 }, "quiz-1", 600, now),
      null,
    );
    assert.equal(getResumableQuizDraft(draft, "quiz-2", 600, now), null);
  });

  it("allows untimed quiz drafts without a deadline", () => {
    const untimedDraft = { ...draft, deadlineAt: undefined };
    assert.equal(
      getResumableQuizDraft(untimedDraft, "quiz-1", 0, now),
      untimedDraft,
    );
  });

  it("detects expired quiz drafts correctly", () => {
    assert.equal(isQuizDraftExpired({ ...draft, deadlineAt: now - 1000 }, now), true);
    assert.equal(isQuizDraftExpired({ ...draft, deadlineAt: now }, now), true);
    assert.equal(isQuizDraftExpired({ ...draft, deadlineAt: now + 5000 }, now), false);
    assert.equal(isQuizDraftExpired({ ...draft, deadlineAt: 0 }, now), false);
    assert.equal(isQuizDraftExpired(null, now), false);
  });
});
