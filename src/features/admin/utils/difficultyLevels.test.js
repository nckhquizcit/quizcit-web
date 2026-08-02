import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getDifficultyLabelVi,
  matchDifficultyPresetKey,
  parseImportDifficultyB,
  resolveDifficultyB,
} from "./difficultyLevels.js";

describe("difficultyLevels", () => {
  it("resolves the six preset values", () => {
    assert.equal(resolveDifficultyB("VERY_EASY"), -3);
    assert.equal(resolveDifficultyB("EASY"), -1.8);
    assert.equal(resolveDifficultyB("MEDIUM"), -0.6);
    assert.equal(resolveDifficultyB("FAIRLY_HARD"), 0.6);
    assert.equal(resolveDifficultyB("HARD"), 1.8);
    assert.equal(resolveDifficultyB("VERY_HARD"), 3);
  });

  it("maps Vietnamese labels and numeric import values", () => {
    assert.equal(parseImportDifficultyB("Khó"), 1.8);
    assert.equal(parseImportDifficultyB("Rất dễ"), -3);
    assert.equal(parseImportDifficultyB("1.2"), 1.2);
    assert.equal(parseImportDifficultyB("-0.6"), -0.6);
  });

  it("keeps custom numbers outside presets", () => {
    assert.equal(matchDifficultyPresetKey(1.2), "CUSTOM");
    assert.equal(getDifficultyLabelVi(1.2), "Tùy chỉnh (1.2)");
  });
});
