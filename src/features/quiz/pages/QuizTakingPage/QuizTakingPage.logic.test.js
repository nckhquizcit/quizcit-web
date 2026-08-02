import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPageNavigationTarget,
  getQuestionNavigationTarget,
  getTotalQuizPages,
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
