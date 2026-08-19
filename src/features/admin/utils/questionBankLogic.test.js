import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterQuestionBankQuestions,
  getQuestionSkillOptions,
} from "./questionBankLogic.js";

const questions = [
  {
    subjectId: "subject-1",
    difficultyB: -1.8,
    content: "Câu vòng lặp",
    skills: [{ skillId: "skill-loop", name: "Vòng lặp" }],
  },
  {
    subjectId: "subject-1",
    difficultyB: 1.8,
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
        difficulty: "HARD",
        skillId: "skill-array",
        search: "mảng",
      }),
      [questions[1]],
    );
  });

  it("filters by QUESTION_BANK subject for unclassified questions", () => {
    const unclassifiedQuestion = {
      subjectId: null,
      subject: { courseCode: "QUESTION_BANK", name: "Ngân hàng câu hỏi" },
      content: "Câu hỏi chưa phân loại",
    };
    const all = [...questions, unclassifiedQuestion];
    assert.deepEqual(
      filterQuestionBankQuestions(all, { subjectId: "QUESTION_BANK" }),
      [unclassifiedQuestion],
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
