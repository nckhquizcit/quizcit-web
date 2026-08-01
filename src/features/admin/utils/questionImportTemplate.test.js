import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createQuestionImportTemplate } from "./questionImportTemplate.js";

describe("createQuestionImportTemplate", () => {
  it("returns a header-only CSV when no real placement is selected", () => {
    const csv = createQuestionImportTemplate("csv");

    assert.equal(csv.trim().split("\n").length, 1);
    assert.match(csv, /Môn học,Chương/);
    assert.doesNotMatch(csv, /Nhập tên hoặc ID/);
  });

  it("creates a usable CSV example from the selected subject and chapter", () => {
    const csv = createQuestionImportTemplate("csv", {
      subjectName: "Lập trình căn bản",
      chapterName: "Biến và kiểu dữ liệu",
    });

    assert.equal(csv.trim().split("\n").length, 2);
    assert.match(csv, /"Lập trình căn bản","Biến và kiểu dữ liệu"/);
    assert.doesNotMatch(csv, /Nhập tên hoặc ID/);
  });
});
