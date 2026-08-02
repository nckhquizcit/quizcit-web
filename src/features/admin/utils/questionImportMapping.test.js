import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isImportReferenceDataReady, selectImportValue } from "./questionImportMapping.js";
import { createQuestionImportRow } from "./questionImportParser.js";

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

  it("keeps the CSV chapter available for remapping after the first lookup fails", () => {
    const row = createQuestionImportRow({ chapterId: "Chương 1" });
    const failedFirstLookup = { ...row, chapterId: "" };

    assert.equal(
      selectImportValue({
        mode: "per-row",
        importedValue: failedFirstLookup.importedChapterId,
        defaultValue: "",
      }),
      "Chương 1",
    );
  });
});

describe("isImportReferenceDataReady", () => {
  it("blocks the first check while chapter references are loading", () => {
    assert.equal(isImportReferenceDataReady({ loadingChapters: true }), false);
  });

  it("allows checking after all reference data has settled", () => {
    assert.equal(isImportReferenceDataReady({}), true);
  });
});
