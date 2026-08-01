import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { selectImportValue } from "./questionImportMapping.js";

describe("selectImportValue", () => {
  it("keeps a value declared by the CSV in per-row mode", () => {
    assert.equal(
      selectImportValue({
        mode: "per-row",
        importedValue: "chapter-from-csv",
        defaultValue: "fallback-chapter",
      }),
      "chapter-from-csv",
    );
  });

  it("uses the fallback only when the CSV value is missing", () => {
    assert.equal(
      selectImportValue({ mode: "per-row", importedValue: "", defaultValue: "fallback-chapter" }),
      "fallback-chapter",
    );
  });

  it("applies one shared value to every row in single-chapter mode", () => {
    assert.equal(
      selectImportValue({
        mode: "single-chapter",
        importedValue: "chapter-from-csv",
        defaultValue: "shared-chapter",
      }),
      "shared-chapter",
    );
  });

  it("preserves a manual row correction", () => {
    assert.equal(
      selectImportValue({
        mode: "per-row",
        importedValue: "chapter-from-csv",
        defaultValue: "fallback-chapter",
        manualValue: "chapter-fixed-by-admin",
      }),
      "chapter-fixed-by-admin",
    );
  });
});
