import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { clampChapterDisplayOrder, reorderById } from "./displayOrder.js";

describe("clampChapterDisplayOrder", () => {
  it("clamps negative values or zero to 1", () => {
    assert.equal(clampChapterDisplayOrder(-1, 5), 1);
    assert.equal(clampChapterDisplayOrder(-100, 5), 1);
    assert.equal(clampChapterDisplayOrder(0, 5), 1);
    assert.equal(clampChapterDisplayOrder("-1", 5), 1);
  });

  it("clamps values greater than total chapters to total chapters", () => {
    assert.equal(clampChapterDisplayOrder(6, 5), 5);
    assert.equal(clampChapterDisplayOrder(999, 5), 5);
    assert.equal(clampChapterDisplayOrder("10", 3), 3);
  });

  it("keeps valid values between 1 and max", () => {
    assert.equal(clampChapterDisplayOrder(1, 5), 1);
    assert.equal(clampChapterDisplayOrder(3, 5), 3);
    assert.equal(clampChapterDisplayOrder(5, 5), 5);
    assert.equal(clampChapterDisplayOrder("4", 5), 4);
  });

  it("handles empty, null, undefined or NaN values by defaulting to 1", () => {
    assert.equal(clampChapterDisplayOrder("", 5), 1);
    assert.equal(clampChapterDisplayOrder(null, 5), 1);
    assert.equal(clampChapterDisplayOrder(undefined, 5), 1);
    assert.equal(clampChapterDisplayOrder("invalid", 5), 1);
  });

  it("handles minimum total chapters of 1", () => {
    assert.equal(clampChapterDisplayOrder(5, 0), 1);
    assert.equal(clampChapterDisplayOrder(-2, 1), 1);
  });
});

describe("reorderById", () => {
  it("reorders items correctly", () => {
    const items = [
      { id: "1", name: "A" },
      { id: "2", name: "B" },
      { id: "3", name: "C" },
    ];
    const result = reorderById(items, "3", "1", (item) => item.id);
    assert.deepEqual(
      result.map((item) => ({ id: item.id, displayOrder: item.displayOrder })),
      [
        { id: "3", displayOrder: 1 },
        { id: "1", displayOrder: 2 },
        { id: "2", displayOrder: 3 },
      ]
    );
  });
});
