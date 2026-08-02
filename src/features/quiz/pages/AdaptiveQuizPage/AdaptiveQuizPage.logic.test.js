import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAdaptiveBatchAnswers,
  hasAnsweredAdaptiveBatch,
  isValidAdaptiveQuestionCount,
} from "./AdaptiveQuizPage.logic.js";

describe("adaptive quiz logic", () => {
  it("accepts only counts from 40 that are divisible by five", () => {
    assert.equal(isValidAdaptiveQuestionCount(35), false);
    assert.equal(isValidAdaptiveQuestionCount(42), false);
    assert.equal(isValidAdaptiveQuestionCount(40), true);
    assert.equal(isValidAdaptiveQuestionCount("75"), true);
  });

  it("requires all five visible questions before advancing", () => {
    const questions = Array.from({ length: 5 }, (_, index) => ({ questionId: `q${index + 1}` }));
    const complete = Object.fromEntries(questions.map((question) => [question.questionId, "option"]));
    assert.equal(hasAnsweredAdaptiveBatch(questions, complete), true);
    assert.equal(hasAnsweredAdaptiveBatch(questions, { ...complete, q5: undefined }), false);
    assert.equal(hasAnsweredAdaptiveBatch(questions.slice(0, 4), complete), false);
  });

  it("submits only the currently visible batch", () => {
    const questions = [{ questionId: "q6" }, { questionId: "q7" }];
    assert.deepEqual(buildAdaptiveBatchAnswers(questions, { q6: "o6", q7: "o7", q1: "old" }), [
      { questionId: "q6", optionId: "o6" },
      { questionId: "q7", optionId: "o7" },
    ]);
  });
});
