import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAdminStats } from "./adminDashboardLogic.js";

test("normalizeAdminStats: normalizes all 5 components when backend provides totalSkills", () => {
  const stats = {
    totalSubjects: 12,
    totalQuestions: 150,
    totalQuizzes: 8,
    totalSkills: 25,
    totalUsers: 45,
  };

  const result = normalizeAdminStats(stats, 0);

  assert.deepEqual(result, {
    totalSubjects: 12,
    totalQuestions: 150,
    totalQuizzes: 8,
    totalSkills: 25,
    totalUsers: 45,
  });
});

test("normalizeAdminStats: falls back to fallbackSkillsCount when backend totalSkills is missing", () => {
  const statsWithoutSkills = {
    totalSubjects: 10,
    totalQuestions: 80,
    totalQuizzes: 5,
    totalUsers: 20,
  };

  const result = normalizeAdminStats(statsWithoutSkills, 18);

  assert.deepEqual(result, {
    totalSubjects: 10,
    totalQuestions: 80,
    totalQuizzes: 5,
    totalSkills: 18,
    totalUsers: 20,
  });
});

test("normalizeAdminStats: falls back when totalSkills is null", () => {
  const stats = {
    totalSubjects: 5,
    totalQuestions: 20,
    totalQuizzes: 2,
    totalSkills: null,
    totalUsers: 15,
  };

  const result = normalizeAdminStats(stats, 7);

  assert.equal(result.totalSkills, 7);
});

test("normalizeAdminStats: preserves totalSkills when it is explicitly 0 from backend", () => {
  const stats = {
    totalSubjects: 1,
    totalQuestions: 0,
    totalQuizzes: 0,
    totalSkills: 0,
    totalUsers: 1,
  };

  const result = normalizeAdminStats(stats, 99);

  assert.equal(result.totalSkills, 0);
});

test("normalizeAdminStats: handles empty or undefined inputs gracefully with zero defaults", () => {
  const resultEmpty = normalizeAdminStats({});
  assert.deepEqual(resultEmpty, {
    totalSubjects: 0,
    totalQuestions: 0,
    totalQuizzes: 0,
    totalSkills: 0,
    totalUsers: 0,
  });

  const resultNull = normalizeAdminStats(null, null);
  assert.deepEqual(resultNull, {
    totalSubjects: 0,
    totalQuestions: 0,
    totalQuizzes: 0,
    totalSkills: 0,
    totalUsers: 0,
  });
});

test("normalizeAdminStats: casts numeric string values properly", () => {
  const stats = {
    totalSubjects: "10",
    totalQuestions: "250",
    totalQuizzes: "15",
    totalSkills: "30",
    totalUsers: "100",
  };

  const result = normalizeAdminStats(stats, 0);

  assert.deepEqual(result, {
    totalSubjects: 10,
    totalQuestions: 250,
    totalQuizzes: 15,
    totalSkills: 30,
    totalUsers: 100,
  });
});
