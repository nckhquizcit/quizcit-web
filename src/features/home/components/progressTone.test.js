import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getProgressTone } from "./progressTone.js";

describe("getProgressTone", () => {
  it("maps the displayed score bands onto semantic colors", () => {
    assert.equal(getProgressTone(24.9), "danger");
    assert.equal(getProgressTone(25), "warning");
    assert.equal(getProgressTone(50), "info");
    assert.equal(getProgressTone(75), "success");
  });
});
