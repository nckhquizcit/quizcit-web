import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterQuestionBankQuestions,
  getQuestionSkillOptions,
} from "./questionBankLogic.js";

const questions = [
  {
    subjectId: "subject-1",
    difficultyB: -1,
    content: "Câu vòng lặp",
    skills: [{ skillId: "skill-loop", name: "Vòng lặp" }],
  },
  {
    subjectId: "subject-1",
    difficultyB: 1,
    content: "Câu mảng",
    skills: [{ skillId: "skill-array", name: "Mảng" }],
  },
];

describe("filterQuestionBankQuestions", () => {
  it("filters by selected skill", () => {
    assert.deepEqual(
      filterQuestionBankQuestions(questions, { skillId: "skill-loop" }),
      [questions[0]],
    );
  });

  it("combines skill and existing filters", () => {
    assert.deepEqual(
      filterQuestionBankQuestions(questions, {
        subjectId: "subject-1",
        difficulty: "Hard",
        skillId: "skill-array",
        search: "mảng",
      }),
      [questions[1]],
    );
  });
});

describe("getQuestionSkillOptions", () => {
  it("deduplicates skills from chapters and questions", () => {
    assert.deepEqual(
      getQuestionSkillOptions(
        [{ skills: [{ skillId: "skill-loop", name: "Vòng lặp" }] }],
        questions,
      ),
      [
        { skillId: "skill-array", name: "Mảng" },
        { skillId: "skill-loop", name: "Vòng lặp" },
      ],
    );
  });
});
