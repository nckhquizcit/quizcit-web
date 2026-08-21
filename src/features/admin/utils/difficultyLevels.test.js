import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getDifficultyLabelVi,
  getDifficultyTone,
  matchDifficultyPresetKey,
  parseDifficultyArray,
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

  it("handles empty or null difficulty correctly", () => {
    assert.equal(matchDifficultyPresetKey(null), "");
    assert.equal(matchDifficultyPresetKey(""), "");
    assert.equal(getDifficultyLabelVi(null), "Chưa có độ khó");
    assert.equal(getDifficultyTone(null), "empty");
  });

  it("parses difficulty array in various formats", () => {
    const jsonResult = parseDifficultyArray("[1, 1.05, 2, 3, -2]");
    assert.equal(jsonResult.isValid, true);
    assert.deepEqual(jsonResult.values, [1, 1.05, 2, 3, -2]);
    assert.deepEqual(jsonResult.invalidTokens, []);

    const commaResult = parseDifficultyArray("1, 1.05, 2, 3, -2");
    assert.equal(commaResult.isValid, true);
    assert.deepEqual(commaResult.values, [1, 1.05, 2, 3, -2]);

    const newlineResult = parseDifficultyArray("1\n1.05\n2\n3\n-2");
    assert.equal(newlineResult.isValid, true);
    assert.deepEqual(newlineResult.values, [1, 1.05, 2, 3, -2]);

    const invalidResult = parseDifficultyArray("[1, 1.05, abc, -2]");
    assert.equal(invalidResult.isValid, false);
    assert.deepEqual(invalidResult.values, [1, 1.05, -2]);
    assert.deepEqual(invalidResult.invalidTokens, ["abc"]);

    const emptyResult = parseDifficultyArray("");
    assert.equal(emptyResult.isValid, false);
    assert.deepEqual(emptyResult.values, []);
  });
});
