import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAbilityMap,
  formatCurrentTheta,
  formatRequiredTheta,
  isSkillRequirementMet,
  resolveSkillCurrentTheta,
} from "./SubjectDetailPage.logic.js";

describe("SubjectDetailPage.logic", () => {
  describe("formatRequiredTheta", () => {
    it("formats raw required theta to 0-4 scale string", () => {
      assert.equal(formatRequiredTheta(0), "2.00");
      assert.equal(formatRequiredTheta(-4), "0.00");
      assert.equal(formatRequiredTheta(4), "4.00");
      assert.equal(formatRequiredTheta(0.8), "2.40");
    });

    it("returns null for non-finite values", () => {
      assert.equal(formatRequiredTheta(null), null);
      assert.equal(formatRequiredTheta(undefined), null);
      assert.equal(formatRequiredTheta("invalid"), null);
    });
  });

  describe("formatCurrentTheta", () => {
    it("formats raw current theta to 0-4 scale string", () => {
      assert.equal(formatCurrentTheta(0), "2.00");
      assert.equal(formatCurrentTheta(0.8), "2.40");
      assert.equal(formatCurrentTheta(-0.5), "1.75");
    });

    it("returns em dash for null or undefined", () => {
      assert.equal(formatCurrentTheta(null), "—");
      assert.equal(formatCurrentTheta(undefined), "—");
      assert.equal(formatCurrentTheta("invalid"), "—");
    });
  });

  describe("buildAbilityMap", () => {
    it("indexes abilities by skillId, id, and lowercase name", () => {
      const abilities = [
        {
          id: "ability-1",
          skillId: "skill-101",
          name: "Giải thuật Đệ quy",
          theta: 1.2,
        },
        {
          id: "ability-2",
          skillId: "skill-102",
          skillName: "Cấu trúc Dữ liệu",
          theta: -0.4,
        },
      ];

      const map = buildAbilityMap(abilities);
      assert.equal(map.get("skill-101"), 1.2);
      assert.equal(map.get("ability-1"), 1.2);
      assert.equal(map.get("giải thuật đệ quy"), 1.2);

      assert.equal(map.get("skill-102"), -0.4);
      assert.equal(map.get("cấu trúc dữ liệu"), -0.4);
    });

    it("handles empty or invalid inputs gracefully", () => {
      assert.equal(buildAbilityMap([]).size, 0);
      assert.equal(buildAbilityMap(null).size, 0);
      assert.equal(buildAbilityMap([null, { theta: "bad" }]).size, 0);
    });
  });

  describe("resolveSkillCurrentTheta", () => {
    it("prioritizes skill.currentTheta if provided by backend", () => {
      const skill = { skillId: "sk-1", currentTheta: 1.5 };
      const abilityMap = new Map([["sk-1", 0.5]]);
      assert.equal(resolveSkillCurrentTheta(skill, abilityMap), 1.5);
    });

    it("falls back to abilityMap by skillId if currentTheta is missing", () => {
      const skill = { skillId: "sk-1", currentTheta: null };
      const abilityMap = new Map([["sk-1", 0.85]]);
      assert.equal(resolveSkillCurrentTheta(skill, abilityMap), 0.85);
    });

    it("falls back to abilityMap by skillName if skillId is not matched", () => {
      const skill = { skillId: "unknown", name: "Đệ quy" };
      const abilityMap = new Map([["đệ quy", 0.75]]);
      assert.equal(resolveSkillCurrentTheta(skill, abilityMap), 0.75);
    });

    it("returns null if no ability exists", () => {
      const skill = { skillId: "sk-999", name: "Chưa học" };
      const abilityMap = new Map();
      assert.equal(resolveSkillCurrentTheta(skill, abilityMap), null);
    });
  });

  describe("isSkillRequirementMet", () => {
    it("compares current theta with required theta", () => {
      assert.equal(isSkillRequirementMet(1.0, 0.5), true);
      assert.equal(isSkillRequirementMet(0.5, 0.5), true);
      assert.equal(isSkillRequirementMet(0.4, 0.5), false);
      assert.equal(isSkillRequirementMet(-0.2, 0.0), false);
      assert.equal(isSkillRequirementMet(0.0, 0.0), true);
    });

    it("returns false if current theta is null or undefined", () => {
      assert.equal(isSkillRequirementMet(null, 0.0), false);
      assert.equal(isSkillRequirementMet(undefined, 0.0), false);
    });
  });

  describe("isSkillRequirementMet with backend met flag", () => {
    it("returns true when current theta satisfies required theta", () => {
      const skill = { skillId: "sk-1", requiredTheta: 1.0, currentTheta: 1.5, met: true };
      assert.equal(isSkillRequirementMet(skill.currentTheta, skill.requiredTheta), true);
    });

    it("returns false when current theta is below required theta", () => {
      const skill = { skillId: "sk-2", requiredTheta: 1.0, currentTheta: 0.5, met: false };
      assert.equal(isSkillRequirementMet(skill.currentTheta, skill.requiredTheta), false);
    });
  });
});
