import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  detectDelimiter,
  parseCsvTable,
  parseSkillImport,
  summarizeSkillImport,
  validateSkillImportRow,
} from "./skillImportParser.js";
import {
  createSkillImportCsvContent,
  SKILL_IMPORT_CSV_HEADER,
} from "./skillImportTemplate.js";

describe("skillImportParser and Template", () => {
  it("detects delimiters correctly", () => {
    assert.equal(detectDelimiter("name,description\nSkill 1,Desc 1"), ",");
    assert.equal(detectDelimiter("name;description\nSkill 1;Desc 1"), ";");
    assert.equal(detectDelimiter("name\tdescription\nSkill 1\tDesc 1"), "\t");
  });

  it("creates valid skill import CSV template", () => {
    const template = createSkillImportCsvContent();
    assert.ok(template.startsWith(SKILL_IMPORT_CSV_HEADER));
    assert.ok(template.includes("Giải phương trình bậc hai"));
  });

  it("parses CSV table with quotes and commas", () => {
    const csv = `Tên kỹ năng,Mô tả
"Giải phương trình, bậc hai","Mô tả có dấu phẩy, và ""dấu ngoặc kép"""
"Kỹ năng 2","Mô tả 2"`;

    const table = parseCsvTable(csv);
    assert.equal(table.length, 3);
    assert.equal(table[1][0], "Giải phương trình, bậc hai");
    assert.equal(table[1][1], 'Mô tả có dấu phẩy, và "dấu ngoặc kép"');
  });

  it("parses skills with Vietnamese headers and validates correctly", () => {
    const csv = `Tên kỹ năng,Mô tả
Giải phương trình bậc hai,Kỹ năng giải và biện luận
Đạo hàm hàm hợp,Tính đạo hàm các hàm hợp`;

    const rows = parseSkillImport(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, "Giải phương trình bậc hai");
    assert.equal(rows[0].description, "Kỹ năng giải và biện luận");
    assert.equal(rows[0].errors.length, 0);
    assert.equal(rows[1].name, "Đạo hàm hàm hợp");
  });

  it("parses skills with English headers (name, description)", () => {
    const csv = `name,description
Skill Alpha,Description Alpha
Skill Beta,Description Beta`;

    const rows = parseSkillImport(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, "Skill Alpha");
    assert.equal(rows[0].description, "Description Alpha");
  });

  it("flags empty skill names as errors", () => {
    const csv = `Tên kỹ năng,Mô tả
,Mô tả không có tên
Kỹ năng hợp lệ,Mô tả hợp lệ`;

    const rows = parseSkillImport(csv);
    assert.equal(rows.length, 2);
    assert.ok(rows[0].errors.some((err) => err.includes("không được để trống")));
    assert.equal(rows[1].errors.length, 0);

    const summary = summarizeSkillImport(rows);
    assert.equal(summary.total, 2);
    assert.equal(summary.validCount, 1);
    assert.equal(summary.invalidCount, 1);
  });

  it("flags duplicate skill names within import file and existing skills", () => {
    const existingSkills = [{ name: "Kỹ năng đã có" }];
    const csv = `Tên kỹ năng,Mô tả
Kỹ năng trùng,Mô tả 1
Kỹ năng trùng,Mô tả 2
Kỹ năng đã có,Mô tả đã có
Kỹ năng duy nhất,Mô tả duy nhất`;

    const rows = parseSkillImport(csv, { existingSkills });
    assert.equal(rows.length, 4);

    // Row 2 should have warning for duplicate in file
    assert.ok(rows[1].warnings.some((w) => w.includes("Trùng tên với dòng 1")));

    // Row 3 should have warning for existing in system
    assert.ok(rows[2].warnings.some((w) => w.includes("đã tồn tại")));

    // Row 4 should have no warnings or errors
    assert.equal(rows[3].warnings.length, 0);
    assert.equal(rows[3].errors.length, 0);
  });

  it("handles headless CSV (no headers)", () => {
    const csv = `Giải phương trình,Mô tả 1
Tính tích phân,Mô tả 2`;

    const rows = parseSkillImport(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].name, "Giải phương trình");
    assert.equal(rows[0].description, "Mô tả 1");
    assert.equal(rows[1].name, "Tính tích phân");
    assert.equal(rows[1].description, "Mô tả 2");
  });

  it("handles length limits for name and description", () => {
    const longName = "A".repeat(205);
    const longDesc = "B".repeat(2005);
    const row = validateSkillImportRow({
      index: 1,
      name: longName,
      description: longDesc,
    });

    assert.ok(row.errors.some((e) => e.includes("200 ký tự")));
    assert.ok(row.errors.some((e) => e.includes("2000 ký tự")));
  });
});
