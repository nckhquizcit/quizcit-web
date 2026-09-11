import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeProgressOverview,
  normalizeSkillDetailOverview,
} from "./progressOverview.js";

describe("normalizeProgressOverview", () => {
  it("normalizes overview data with skills and mapped histories", () => {
    const raw = {
      averageTheta: 1.25,
      trackedSkillCount: 1,
      skills: [{ skillId: "sk-1", name: "Con trỏ", description: "Pointers in C", theta: 1.25 }],
      recentHistories: [
        {
          id: "h-1",
          skillId: "sk-1",
          skillName: "Con trỏ",
          theta: 1.25,
          delta: 0.25,
          createdAt: "2026-01-01T12:00:00Z",
        },
      ],
    };

    const result = normalizeProgressOverview(raw);
    assert.equal(result.averageAbility, 1.25);
    assert.equal(result.abilities.length, 1);
    assert.equal(result.abilities[0].name, "Con trỏ");
    assert.equal(result.histories.length, 1);
    assert.equal(result.histories[0].skillName, "Con trỏ");
    assert.ok(result.histories[0].deltaScaled !== undefined);
  });

  it("handles null overview gracefully", () => {
    const result = normalizeProgressOverview(null);
    assert.deepEqual(result.abilities, []);
    assert.deepEqual(result.histories, []);
    assert.equal(result.averageAbility, null);
  });
});

describe("normalizeSkillDetailOverview", () => {
  it("normalizes skill detail and combines with other skills", () => {
    const raw = {
      skillId: "sk-1",
      name: "Con trỏ",
      description: "Pointers",
      currentTheta: 2.1,
      updatedAt: "2026-01-01T00:00:00Z",
      histories: [
        {
          id: "h-1",
          skillId: "sk-1",
          skillName: "Con trỏ",
          theta: 2.1,
          delta: 0.1,
        },
      ],
      otherSkills: [
        { skillId: "sk-2", name: "Đệ quy", description: "Recursion", theta: 1.0 },
      ],
    };

    const result = normalizeSkillDetailOverview(raw);
    assert.equal(result.abilities.length, 2);
    assert.equal(result.abilities[0].skillId, "sk-1");
    assert.equal(result.abilities[0].theta, 2.1);
    assert.equal(result.abilities[1].skillId, "sk-2");
    assert.equal(result.skills.length, 2);
    assert.equal(result.histories.length, 1);
  });
});
