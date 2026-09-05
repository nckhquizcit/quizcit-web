import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  clearAdaptiveDraft,
  clearQuizDraft,
  getAdaptiveDraftKey,
  getExpiredQuizDrafts,
  getQuizDraftKey,
  loadAdaptiveDraft,
  loadQuizDraft,
  saveAdaptiveDraft,
  saveQuizDraft,
} from "./quizDraftStorage.js";

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}

describe("quiz draft storage", () => {
  beforeEach(() => {
    globalThis.localStorage = createMemoryStorage();
    globalThis.sessionStorage = createMemoryStorage();
  });

  it("builds correct storage keys", () => {
    assert.equal(getQuizDraftKey("quiz-1", "user-1"), "quizcit:quiz-draft:user-1:quiz-1");
    assert.equal(getQuizDraftKey("quiz-1", null), "quizcit:quiz-draft:anonymous:quiz-1");
    assert.equal(getAdaptiveDraftKey("att-1", "user-1"), "quizcit:adaptive-draft:user-1:att-1");
  });

  it("saves, loads and clears regular quiz draft using localStorage", () => {
    const draft = {
      attemptId: "att-123",
      quizId: "quiz-abc",
      answers: { q1: "optA", q2: "optB" },
      deadlineAt: 1700000060000,
    };

    saveQuizDraft("quiz-abc", "user-1", draft);
    const loaded = loadQuizDraft("quiz-abc", "user-1");
    assert.deepEqual(loaded, draft);

    clearQuizDraft("quiz-abc", "user-1");
    assert.equal(loadQuizDraft("quiz-abc", "user-1"), null);
  });

  it("falls back to sessionStorage if draft is in session", () => {
    const draft = { attemptId: "att-session", quizId: "quiz-s" };
    globalThis.sessionStorage.setItem("quizcit:quiz-draft:user-2:quiz-s", JSON.stringify(draft));

    const loaded = loadQuizDraft("quiz-s", "user-2");
    assert.deepEqual(loaded, draft);
  });

  it("saves, loads and clears adaptive quiz draft", () => {
    const adaptiveDraft = {
      attemptId: "att-adapt-1",
      page: 2,
      answers: { q5: "opt1", q6: "opt2" },
    };

    saveAdaptiveDraft("att-adapt-1", "user-1", adaptiveDraft);
    const loaded = loadAdaptiveDraft("att-adapt-1", "user-1");
    assert.deepEqual(loaded, adaptiveDraft);

    clearAdaptiveDraft("att-adapt-1", "user-1");
    assert.equal(loadAdaptiveDraft("att-adapt-1", "user-1"), null);
  });

  it("identifies expired quiz drafts", () => {
    const now = 1_700_000_000_000;
    const expiredDraft = {
      attemptId: "att-expired",
      quizId: "quiz-exp",
      deadlineAt: now - 5000,
      answers: { q1: "o1" },
    };
    const activeDraft = {
      attemptId: "att-active",
      quizId: "quiz-act",
      deadlineAt: now + 60000,
      answers: { q2: "o2" },
    };

    saveQuizDraft("quiz-exp", "user-test", expiredDraft);
    saveQuizDraft("quiz-act", "user-test", activeDraft);

    const expiredList = getExpiredQuizDrafts("user-test", now);
    assert.equal(expiredList.length, 1);
    assert.equal(expiredList[0].attemptId, "att-expired");
  });
});
