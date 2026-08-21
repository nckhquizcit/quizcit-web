import { compactImportKey } from "./questionImportParser.js";

const CSV_SKILL_COLUMN_ALIASES = {
  name: [
    "name",
    "skillname",
    "skill_name",
    "tenkynang",
    "ten_ky_nang",
    "ten",
    "kynang",
    "ky_nang",
    "skill",
    "tên kỹ năng",
    "tên",
    "kỹ năng",
    "ten skill",
  ],
  description: [
    "description",
    "desc",
    "mota",
    "mo_ta",
    "ghichu",
    "ghi_chu",
    "detail",
    "mô tả",
    "ghi chú",
    "chi tiết",
  ],
};

const normalizeText = (value = "") => String(value ?? "").replace(/\s+/g, " ").trim();

const getCsvColumnKey = (headerCell) => {
  const normalizedHeader = compactImportKey(headerCell);
  if (!normalizedHeader) return null;

  return Object.entries(CSV_SKILL_COLUMN_ALIASES).find(([, aliases]) =>
    aliases.map(compactImportKey).includes(normalizedHeader),
  )?.[0];
};

const buildCsvHeaderMap = (headerRow = []) =>
  headerRow.reduce((map, headerCell, index) => {
    const columnKey = getCsvColumnKey(headerCell);
    if (columnKey && !Object.hasOwn(map, columnKey)) {
      map[columnKey] = index;
    }
    return map;
  }, {});

const hasCsvHeader = (row = []) => {
  const map = buildCsvHeaderMap(row);
  return Boolean(map.name !== undefined || map.description !== undefined);
};

export function detectDelimiter(input = "") {
  const firstLine = input.split(/\r?\n/)[0] || "";
  const countComma = (firstLine.match(/,/g) || []).length;
  const countSemicolon = (firstLine.match(/;/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;

  if (countTab > countComma && countTab > countSemicolon) return "\t";
  if (countSemicolon > countComma) return ";";
  return ",";
}

export function parseCsvTable(input = "", customDelimiter) {
  let cleanInput = String(input || "");
  if (cleanInput.charCodeAt(0) === 0xfeff) {
    cleanInput = cleanInput.slice(1);
  }

  const delimiter = customDelimiter || detectDelimiter(cleanInput);
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < cleanInput.length; index += 1) {
    const char = cleanInput[index];
    const nextChar = cleanInput[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(cell);
      if (row.some((value) => normalizeText(value))) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => normalizeText(value))) {
    rows.push(row);
  }

  return rows;
}

export function validateSkillImportRow(row, options = {}) {
  const { existingSkills = [], seenNamesMap = new Map() } = options;
  const errors = [];
  const warnings = [];

  const trimmedName = String(row.name || "").trim();
  const trimmedDesc = String(row.description || "").trim();

  if (!trimmedName) {
    errors.push("Tên kỹ năng không được để trống.");
  } else if (trimmedName.length > 200) {
    errors.push(`Tên kỹ năng vượt quá 200 ký tự (hiện có ${trimmedName.length} ký tự).`);
  }

  if (trimmedDesc.length > 2000) {
    errors.push(`Mô tả vượt quá 2000 ký tự (hiện có ${trimmedDesc.length} ký tự).`);
  }

  if (trimmedName) {
    const compactName = compactImportKey(trimmedName);

    if (seenNamesMap.has(compactName)) {
      const firstIndex = seenNamesMap.get(compactName);
      warnings.push(`Trùng tên với dòng ${firstIndex} trong danh sách import.`);
    } else {
      seenNamesMap.set(compactName, row.index);
    }

    const alreadyExists = existingSkills.some((skill) => {
      const existingName = skill?.name || skill?.skillName || "";
      return compactImportKey(existingName) === compactName;
    });

    if (alreadyExists) {
      warnings.push("Tên kỹ năng đã tồn tại trong hệ thống.");
    }
  }

  return {
    ...row,
    name: trimmedName,
    description: trimmedDesc,
    errors: row.serverError ? [...errors, row.serverError] : errors,
    warnings,
  };
}

export function parseSkillImport(input = "", options = {}) {
  const { existingSkills = [] } = options;
  const table = parseCsvTable(input);

  if (!table.length) {
    return [];
  }

  const firstRow = table[0];
  const isHeaderPresent = hasCsvHeader(firstRow);
  const headerMap = isHeaderPresent ? buildCsvHeaderMap(firstRow) : {};
  const dataRows = isHeaderPresent ? table.slice(1) : table;

  const seenNamesMap = new Map();

  return dataRows.map((cols, idx) => {
    let name = "";
    let description = "";

    if (isHeaderPresent) {
      name = headerMap.name !== undefined ? cols[headerMap.name] || "" : cols[0] || "";
      description = headerMap.description !== undefined ? cols[headerMap.description] || "" : cols[1] || "";
    } else {
      name = cols[0] || "";
      description = cols[1] || "";
    }

    const rawRow = {
      id: `skill-import-${idx + 1}-${Math.random().toString(36).slice(2, 7)}`,
      index: idx + 1,
      name: String(name || "").trim(),
      description: String(description || "").trim(),
      sourceLine: idx + (isHeaderPresent ? 2 : 1),
      errors: [],
      warnings: [],
      serverError: "",
    };

    return validateSkillImportRow(rawRow, { existingSkills, seenNamesMap });
  });
}

export function validateSkillRows(rows = [], options = {}) {
  const { existingSkills = [] } = options;
  const seenNamesMap = new Map();

  return rows.map((row, idx) => {
    const rowWithIndex = { ...row, index: idx + 1 };
    return validateSkillImportRow(rowWithIndex, { existingSkills, seenNamesMap });
  });
}

export function summarizeSkillImport(rows = []) {
  const total = rows.length;
  const validCount = rows.filter((row) => (!row.errors || row.errors.length === 0)).length;
  const invalidCount = total - validCount;
  const warningCount = rows.filter((row) => row.warnings && row.warnings.length > 0).length;

  return {
    total,
    validCount,
    invalidCount,
    warningCount,
  };
}
