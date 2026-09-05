import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPageNavigationTarget,
  getQuestionNavigationTarget,
  getQuizPaginationPages,
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

describe("QuizTakingPage pagination page generation", () => {
  it("returns [0] when there is only 1 page or empty", () => {
    assert.deepEqual(getQuizPaginationPages(0, 1), [0]);
    assert.deepEqual(getQuizPaginationPages(0, 0), [0]);
  });

  it("returns sequential pages when totalPages <= 7", () => {
    assert.deepEqual(getQuizPaginationPages(0, 4), [0, 1, 2, 3]);
    assert.deepEqual(getQuizPaginationPages(2, 7), [0, 1, 2, 3, 4, 5, 6]);
  });

  it("adds trailing ellipsis when near the start of large page set", () => {
    assert.deepEqual(getQuizPaginationPages(0, 10), [0, 1, 2, 3, "...", 9]);
    assert.deepEqual(getQuizPaginationPages(2, 10), [0, 1, 2, 3, "...", 9]);
  });

  it("adds leading and trailing ellipsis when in the middle", () => {
    assert.deepEqual(getQuizPaginationPages(5, 10), [0, "...", 4, 5, 6, "...", 9]);
  });

  it("adds leading ellipsis when near the end", () => {
    assert.deepEqual(getQuizPaginationPages(9, 10), [0, "...", 6, 7, 8, 9]);
    assert.deepEqual(getQuizPaginationPages(7, 10), [0, "...", 6, 7, 8, 9]);
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

  it("restores only a draft matching the target attemptId when specified", () => {
    assert.equal(getResumableQuizDraft(draft, "quiz-1", 600, now, "attempt-1"), draft);
    assert.equal(getResumableQuizDraft(draft, "quiz-1", 600, now, "attempt-2"), null);
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
