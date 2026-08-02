import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  clearUserPreview,
  enterUserPreview,
  exitUserPreview,
  isUserPreviewActive,
} from "./userPreviewMode.js";

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

describe("user preview mode", () => {
  beforeEach(() => {
    globalThis.CustomEvent = class CustomEvent extends Event {};
    globalThis.window = new EventTarget();
    globalThis.window.sessionStorage = new MemoryStorage();
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.CustomEvent;
  });

  it("can only become active for an administrator", () => {
    enterUserPreview("/admin/subjects");

    assert.equal(isUserPreviewActive({ role: "ADMINISTRATOR" }), true);
    assert.equal(isUserPreviewActive({ role: "USER" }), false);
  });

  it("returns to the saved admin page when preview ends", () => {
    enterUserPreview("/admin/questions?filter=active");

    assert.equal(exitUserPreview(), "/admin/questions?filter=active");
    assert.equal(isUserPreviewActive({ role: "ADMINISTRATOR" }), false);
  });

  it("rejects a non-admin return path", () => {
    enterUserPreview("https://example.com");

    assert.equal(exitUserPreview(), "/admin/dashboard");
    clearUserPreview();
  });
});
