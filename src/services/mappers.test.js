import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapAbilityHistory, mapUserSkillAbility } from "./mappers.js";

describe("progress skill name mapping", () => {
  it("keeps skillName as display name for ability responses", () => {
    assert.equal(mapUserSkillAbility({ skillId: "skill-1", skillName: "Vòng lặp" }).name, "Vòng lặp");
  });

  it("keeps skillName as display name for history responses", () => {
    assert.equal(mapAbilityHistory({ skillId: "skill-1", skillName: "Vòng lặp" }).name, "Vòng lặp");
  });
});
