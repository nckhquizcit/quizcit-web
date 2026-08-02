import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatScaledThetaValue,
  getAbilityLevel,
  mapAbilityHistory,
  mapUserSkillAbility,
  scaleThetaForDisplay,
} from "./mappers.js";

describe("progress skill name mapping", () => {
  it("keeps skillName as display name for ability responses", () => {
    assert.equal(mapUserSkillAbility({ skillId: "skill-1", skillName: "Vòng lặp" }).name, "Vòng lặp");
  });

  it("keeps skillName as display name for history responses", () => {
    assert.equal(mapAbilityHistory({ skillId: "skill-1", skillName: "Vòng lặp" }).name, "Vòng lặp");
  });
});

describe("ability score display", () => {
  it("scales raw theta onto the 0-4 barem", () => {
    assert.equal(scaleThetaForDisplay(-4), 0);
    assert.equal(scaleThetaForDisplay(0), 2);
    assert.equal(scaleThetaForDisplay(4), 4);
    assert.equal(formatScaledThetaValue(0), "2.00");
  });

  it("classifies ability labels from raw theta thresholds", () => {
    assert.equal(getAbilityLevel(-2).label, "Yếu");
    assert.equal(getAbilityLevel(-1).label, "Trung bình");
    assert.equal(getAbilityLevel(0).label, "Trung bình khá");
    assert.equal(getAbilityLevel(1).label, "Khá");
    assert.equal(getAbilityLevel(2).label, "Giỏi");
    assert.equal(getAbilityLevel(2.5).label, "Xuất sắc");
  });
});
