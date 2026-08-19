import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  filterQuestionBankQuestions,
  getQuestionSkillOptions,
  isUnclassifiedQuestion,
} from "./questionBankLogic.js";

const questions = [
  {
    subjectId: "subject-1",
    chapterId: "chapter-1",
    difficultyB: -1.8,
    content: "Câu vòng lặp",
    skills: [{ skillId: "skill-loop", name: "Vòng lặp" }],
  },
  {
    subjectId: "subject-1",
    chapterId: "chapter-1",
    difficultyB: 1.8,
    content: "Câu mảng",
    skills: [{ skillId: "skill-array", name: "Mảng" }],
  },
];

const knownSubjectIds = new Set(["subject-1"]);
const knownChapterIds = new Set(["chapter-1"]);
const knownSets = { knownSubjectIds, knownChapterIds };

describe("isUnclassifiedQuestion", () => {
  it("treats null subjectId as unclassified", () => {
    assert.equal(
      isUnclassifiedQuestion({ subjectId: null }, knownSubjectIds, knownChapterIds),
      true,
    );
  });

  it("treats hidden bank UUID as unclassified when not in public lists", () => {
    assert.equal(
      isUnclassifiedQuestion(
        { subjectId: "uuid-bank-hidden", chapterId: "uuid-bank-chapter" },
        knownSubjectIds,
        knownChapterIds,
      ),
      true,
    );
  });

  it("treats known subject with unknown chapter as unclassified", () => {
    assert.equal(
      isUnclassifiedQuestion(
        { subjectId: "subject-1", chapterId: "uuid-bank-chapter" },
        knownSubjectIds,
        knownChapterIds,
      ),
      true,
    );
  });

  it("treats known subject and chapter as classified", () => {
    assert.equal(
      isUnclassifiedQuestion(questions[0], knownSubjectIds, knownChapterIds),
      false,
    );
  });
});

describe("filterQuestionBankQuestions", () => {
  it("filters by selected skill", () => {
    assert.deepEqual(
      filterQuestionBankQuestions(questions, { skillId: "skill-loop", ...knownSets }),
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
        ...knownSets,
      }),
      [questions[1]],
    );
  });

  it("filters hidden bank UUID questions without nested subject", () => {
    const bankQuestion = {
      subjectId: "uuid-bank-hidden",
      chapterId: "uuid-bank-chapter",
      content: "Câu hỏi ngân hàng",
    };
    const all = [...questions, bankQuestion];
    assert.deepEqual(
      filterQuestionBankQuestions(all, { subjectId: "QUESTION_BANK", ...knownSets }),
      [bankQuestion],
    );
  });

  it("filters null subjectId as unclassified", () => {
    const unclassifiedQuestion = {
      subjectId: null,
      content: "Câu hỏi chưa phân loại",
    };
    const all = [...questions, unclassifiedQuestion];
    assert.deepEqual(
      filterQuestionBankQuestions(all, { subjectId: "QUESTION_BANK", ...knownSets }),
      [unclassifiedQuestion],
    );
  });

  it("excludes unclassified questions when filtering a real subject", () => {
    const bankQuestion = {
      subjectId: "uuid-bank-hidden",
      chapterId: "uuid-bank-chapter",
      content: "Câu hỏi ngân hàng",
    };
    const all = [...questions, bankQuestion];
    assert.deepEqual(
      filterQuestionBankQuestions(all, { subjectId: "subject-1", ...knownSets }),
      questions,
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
