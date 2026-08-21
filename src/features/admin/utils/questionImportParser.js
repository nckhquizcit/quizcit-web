import {
  DEFAULT_DIFFICULTY_B,
  DEFAULT_DIFFICULTY_KEY,
  matchDifficultyPresetKey,
  normalizeImportDifficultyKey,
  parseImportDifficultyB,
} from "./difficultyLevels.js";

export const IMPORT_OPTION_KEYS = ["A", "B", "C", "D"];
export const SKILL_WEIGHT_SUM_TOLERANCE = 0.000001;

const CSV_COLUMN_ALIASES = {
  content: ["content", "question", "cauhoi", "noidung", "noidungcauhoi"],
  A: ["a", "optiona", "dapana", "answerA"],
  B: ["b", "optionb", "dapanb", "answerB"],
  C: ["c", "optionc", "dapanc", "answerC"],
  D: ["d", "optiond", "dapand", "answerD"],
  correctKey: ["correct", "correctanswer", "correctoption", "dapan", "dapandung", "answer"],
  explanation: ["explanation", "explain", "giaithich", "loigiai"],
  difficulty: ["difficulty", "dokho"],
  subjectId: ["subjectid", "subject", "monhoc", "mon", "tenmonhoc"],
  chapterId: ["chapterid", "chapter", "chuong", "tenchuong"],
  skills: ["skills", "skill", "skillids", "kynang", "dskynang"],
  weights: ["weights", "weight", "skillweights", "trongso", "trongsokynang"],
  primarySkill: ["primaryskill", "mainskill", "kynangchinh", "skillchinh"],
};

const YES_VALUES = new Set(["1", "true", "yes", "y", "x", "main", "primary", "chinh"]);

const stripDiacritics = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

export const compactImportKey = (value = "") =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeText = (value = "") => String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeId = (value) => (value === undefined || value === null ? "" : String(value));

export const normalizeImportDifficulty = (value, fallback = DEFAULT_DIFFICULTY_KEY) => {
  const legacyFallback = {
    Easy: "EASY",
    Medium: "MEDIUM",
    Hard: "HARD",
  };
  return normalizeImportDifficultyKey(value, legacyFallback[fallback] || fallback);
};

export const normalizeImportDifficultyB = (value, fallback = DEFAULT_DIFFICULTY_B) =>
  parseImportDifficultyB(value, fallback);

export const createEmptyImportOptions = () =>
  IMPORT_OPTION_KEYS.map((key) => ({
    key,
    content: "",
  }));

const splitListCell = (value = "") =>
  String(value || "")
    .split(/[;|\n]+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);

const normalizeOptionList = (options = []) => {
  const byKey = new Map(
    (options || [])
      .map((option, index) => ({
        key: String(option?.key || IMPORT_OPTION_KEYS[index] || "").toUpperCase(),
        content: option?.contentFormat === "blocknote" ? String(option?.content || "") : normalizeText(option?.content),
      }))
      .filter((option) => IMPORT_OPTION_KEYS.includes(option.key))
      .map((option) => [option.key, option]),
  );

  return IMPORT_OPTION_KEYS.map((key) => ({
    key,
    content: byKey.get(key)?.content || "",
  }));
};

const getSingleCorrectKey = (value = "") => {
  const matches = String(value)
    .toUpperCase()
    .match(/[A-D]/g);

  if (!matches) {
    return { correctKey: "", error: "" };
  }

  const uniqueKeys = [...new Set(matches)];

  return {
    correctKey: uniqueKeys[0] || "",
    error: uniqueKeys.length > 1 ? "Chỉ được có đúng 1 đáp án đúng." : "",
  };
};

export const normalizeImportSkills = (skills = []) =>
  (skills || [])
    .map((skill, index) => ({
      skillId: normalizeId(skill?.skillId ?? skill?.id),
      name: normalizeText(skill?.name ?? skill?.skillName ?? skill?.label ?? skill?.skillId ?? skill?.id),
      weight:
        skill?.weight === undefined || skill?.weight === null
          ? ""
          : String(skill.weight),
      primary: Boolean(skill?.primary ?? skill?.isPrimary ?? index === 0),
    }))
    .filter((skill) => skill.skillId || skill.name);

function parseCsvSkills(skillValue = "", weightValue = "", primaryValue = "") {
  const skillTokens = splitListCell(skillValue);
  const weightTokens = splitListCell(weightValue);
  const primaryTokens = splitListCell(primaryValue);

  if (!skillTokens.length) return [];

  const hasPerSkillPrimary = primaryTokens.length === skillTokens.length;
  const primaryKey = compactImportKey(primaryValue);
  const primaryIndex = Number.parseInt(primaryValue, 10);

  return skillTokens.map((skillToken, index) => {
    const tokenKey = compactImportKey(skillToken);
    const perSkillPrimary = hasPerSkillPrimary
      ? YES_VALUES.has(compactImportKey(primaryTokens[index]))
      : false;
    const explicitPrimary =
      perSkillPrimary ||
      primaryKey === tokenKey ||
      (Number.isInteger(primaryIndex) && primaryIndex === index + 1);

    return {
      skillId: skillToken,
      name: skillToken,
      weight: weightTokens[index] ?? "",
      primary: explicitPrimary || (!primaryValue && index === 0),
    };
  });
}

export function validateQuestionImportRow(row, { requireSubject = true, requireChapter = true, requireDifficulty = true, requireSkills = true } = {}) {
  const errors = [];
  const warnings = [];
  const content = normalizeText(row?.content);
  const options = normalizeOptionList(row?.options);
  const filledOptions = options.filter((option) => option.content);
  const correctKey = String(row?.correctKey || "").toUpperCase();
  const skills = normalizeImportSkills(row?.skills);

  if (!content) {
    errors.push("Thiếu nội dung câu hỏi.");
  }

  if (filledOptions.length < 2) {
    errors.push("Cần ít nhất 2 đáp án.");
  }

  if (filledOptions.length < 4) {
    warnings.push("Nên có đủ 4 đáp án A/B/C/D.");
  }

  if (!correctKey) {
    errors.push("Thiếu đáp án đúng.");
  } else if (!filledOptions.some((option) => option.key === correctKey)) {
    errors.push("Đáp án đúng không khớp với đáp án đã nhập.");
  }

  if (requireSubject && !row?.subjectId) {
    errors.push("Chưa chọn môn học.");
  }

  if (requireChapter && !row?.chapterId) {
    errors.push("Chưa chọn chương.");
  }

  const hasDifficulty =
    row?.difficultyB !== null &&
    row?.difficultyB !== undefined &&
    row?.difficultyB !== "" &&
    Number.isFinite(Number(row?.difficultyB));

  if (requireDifficulty && !hasDifficulty) {
    errors.push("Chưa nhập độ khó câu hỏi.");
  }

  if (requireSkills && skills.length === 0) {
    errors.push("Chưa gắn kỹ năng cho câu hỏi.");
  }

  if (skills.length > 0) {
    const skillIds = new Set();
    const primaryCount = skills.filter((skill) => skill.primary).length;
    let weightSum = 0;

    if (primaryCount !== 1) {
      errors.push("Mỗi câu cần đúng một kỹ năng chính.");
    }

    skills.forEach((skill) => {
      const skillKey = normalizeId(skill.skillId);
      const weight = Number(skill.weight);

      if (!skillKey) {
        errors.push(`Không map được kỹ năng "${skill.name || "không rõ"}".`);
      } else if (skillIds.has(skillKey)) {
        errors.push(`Kỹ năng "${skill.name || skill.skillId}" bị chọn lặp.`);
      } else {
        skillIds.add(skillKey);
      }

      if (skill.weight === "" || !Number.isFinite(weight) || weight < 0) {
        errors.push(`Trọng số của kỹ năng "${skill.name || skill.skillId}" phải là số không âm.`);
      } else {
        weightSum += weight;
      }
    });

    if (Math.abs(weightSum - 1) > SKILL_WEIGHT_SUM_TOLERANCE) {
      errors.push("Tổng trọng số kỹ năng của mỗi câu phải bằng 1.");
    }
  }

  return {
    errors: [...new Set([...(row?.mappingErrors || []), ...errors])],
    warnings,
  };
}

export function createQuestionImportRow(partial = {}, index = 0) {
  const correctResult = getSingleCorrectKey(partial.correctKey);
  const importedSubjectId = normalizeText(partial.subjectId);
  const importedChapterId = normalizeText(partial.chapterId);
  const importedDifficulty = normalizeText(partial.difficulty);
  const hasDifficulty = Boolean(importedDifficulty) || (partial.difficultyB !== undefined && partial.difficultyB !== null && partial.difficultyB !== "");
  const difficultyB = hasDifficulty
    ? normalizeImportDifficultyB(partial.difficulty ?? partial.difficultyB, null)
    : null;
  const difficulty = difficultyB !== null && Number.isFinite(difficultyB)
    ? matchDifficultyPresetKey(difficultyB)
    : (partial.difficulty ? normalizeImportDifficulty(partial.difficulty, "") : "");
  const row = {
    id: partial.id || `import-question-${Date.now()}-${index}`,
    content: partial.contentFormat === "blocknote" ? String(partial.content || "") : normalizeText(partial.content),
    contentFormat: partial.contentFormat === "blocknote" ? "blocknote" : "plain",
    options: normalizeOptionList((partial.options || []).map((option) => ({ ...option, contentFormat: partial.contentFormat }))),
    correctKey: correctResult.correctKey,
    explanation: partial.contentFormat === "blocknote" ? String(partial.explanation || "") : normalizeText(partial.explanation),
    difficulty,
    difficultyB,
    subjectId: importedSubjectId,
    chapterId: importedChapterId,
    importedSubjectId,
    importedChapterId,
    importedDifficulty,
    skills: normalizeImportSkills(partial.skills),
    mappingErrors: partial.mappingErrors || [],
    sourceLine: partial.sourceLine || index + 1,
    sourceType: partial.sourceType || "",
  };
  const validation = validateQuestionImportRow(row, {
    requireSubject: Boolean(row.subjectId),
    requireChapter: Boolean(row.chapterId),
    requireDifficulty: row.difficultyB !== null && Number.isFinite(row.difficultyB),
  });

  return {
    ...row,
    errors: correctResult.error ? [...validation.errors, correctResult.error] : validation.errors,
    warnings: validation.warnings,
  };
}

const findAnswerLine = (line) =>
  line.match(/^(?:đáp\s*án|dap\s*an|đáp\s*án\s*đúng|dap\s*an\s*dung|answer|correct)\s*[:：-]\s*(.+)$/i);

const findExplanationLine = (line) =>
  line.match(/^(?:giải\s*thích|giai\s*thich|lời\s*giải|loi\s*giai|explanation)\s*[:：-]\s*(.+)$/i);

const findDifficultyLine = (line) =>
  line.match(/^(?:độ\s*khó|do\s*kho|difficulty)\s*[:：-]\s*(.+)$/i);

const pushTextQuestion = (questions, currentQuestion) => {
  if (!currentQuestion) return;

  const hasContent =
    normalizeText(currentQuestion.content) ||
    currentQuestion.options.some((option) => normalizeText(option.content)) ||
    currentQuestion.correctKey;

  if (hasContent) {
    questions.push(currentQuestion);
  }
};

export function parseQuestionsFromText(input = "") {
  const lines = String(input || "").split(/\r?\n/);
  const questions = [];
  let currentQuestion = null;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const questionMatch = line.match(/^(?:câu|cau|question)\s*\d+\s*[:.)-]\s*(.*)$/i);
    const optionMatch = line.match(/^([A-Da-d])\s*(?:[.)]|:|：|-)\s*(.+)$/);
    const answerMatch = findAnswerLine(line);
    const explanationMatch = findExplanationLine(line);
    const difficultyMatch = findDifficultyLine(line);

    if (questionMatch) {
      pushTextQuestion(questions, currentQuestion);
      currentQuestion = {
        content: questionMatch[1] || "",
        options: [],
        correctKey: "",
        explanation: "",
        difficulty: "",
        sourceLine: index + 1,
      };
      return;
    }

    if (!currentQuestion) {
      currentQuestion = {
        content: "",
        options: [],
        correctKey: "",
        explanation: "",
        difficulty: "",
        sourceLine: index + 1,
      };
    }

    if (optionMatch) {
      currentQuestion.options.push({
        key: optionMatch[1].toUpperCase(),
        content: optionMatch[2],
      });
      return;
    }

    if (answerMatch) {
      currentQuestion.correctKey = answerMatch[1];
      return;
    }

    if (explanationMatch) {
      currentQuestion.explanation = normalizeText(
        `${currentQuestion.explanation || ""} ${explanationMatch[1]}`,
      );
      return;
    }

    if (difficultyMatch) {
      currentQuestion.difficulty = difficultyMatch[1];
      return;
    }

    if (currentQuestion.options.length > 0) {
      const lastOption = currentQuestion.options[currentQuestion.options.length - 1];
      lastOption.content = normalizeText(`${lastOption.content} ${line}`);
      return;
    }

    currentQuestion.content = normalizeText(`${currentQuestion.content || ""} ${line}`);
  });

  pushTextQuestion(questions, currentQuestion);

  return questions.map((question, index) => createQuestionImportRow(question, index));
}

function parseCsvTable(input = "") {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
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

const getCsvColumnKey = (headerCell) => {
  const normalizedHeader = compactImportKey(headerCell);

  return Object.entries(CSV_COLUMN_ALIASES).find(([, aliases]) =>
    aliases.map(compactImportKey).includes(normalizedHeader),
  )?.[0];
};

const buildCsvHeaderMap = (headerRow = []) =>
  headerRow.reduce((map, headerCell, index) => {
    const columnKey = getCsvColumnKey(headerCell);

    if (columnKey) {
      map[columnKey] = index;
    }

    return map;
  }, {});

const hasCsvHeader = (row = []) => Object.keys(buildCsvHeaderMap(row)).length >= 2;

const getCsvValue = (row, headerMap, columnKey, fallbackIndex) => {
  const index = headerMap[columnKey] ?? fallbackIndex;
  return row[index] ?? "";
};

export function detectCsvImport(input = "") {
  const table = parseCsvTable(input);
  if (!table.length) return false;
  if (hasCsvHeader(table[0])) return true;
  return table.some((row) => row.length >= 6) || String(input).split(/\r?\n/).some((line) => {
    const commaCount = (line.match(/,/g) || []).length;
    return commaCount >= 5;
  });
}

export function parseQuestionsFromCsv(input = "") {
  const table = parseCsvTable(input);
  if (!table.length) return [];

  const firstRowHasHeader = hasCsvHeader(table[0]);
  const headerMap = firstRowHasHeader ? buildCsvHeaderMap(table[0]) : {};
  const dataRows = firstRowHasHeader ? table.slice(1) : table;

  return dataRows.map((row, index) =>
    createQuestionImportRow(
      {
        content: getCsvValue(row, headerMap, "content", 0),
        options: IMPORT_OPTION_KEYS.map((key, optionIndex) => ({
          key,
          content: getCsvValue(row, headerMap, key, optionIndex + 1),
        })),
        correctKey: getCsvValue(row, headerMap, "correctKey", 5),
        explanation: getCsvValue(row, headerMap, "explanation", 6),
        difficulty: getCsvValue(row, headerMap, "difficulty", 7),
        subjectId: getCsvValue(row, headerMap, "subjectId", 8),
        chapterId: getCsvValue(row, headerMap, "chapterId", 9),
        skills: parseCsvSkills(
          getCsvValue(row, headerMap, "skills", 10),
          getCsvValue(row, headerMap, "weights", 11),
          getCsvValue(row, headerMap, "primarySkill", 12),
        ),
        sourceLine: firstRowHasHeader ? index + 2 : index + 1,
      },
      index,
    ),
  );
}

export function parseQuestionImport(input = "", sourceType = "text") {
  const effectiveSourceType = sourceType === "auto" ? (detectCsvImport(input) ? "csv" : "text") : sourceType;

  if (effectiveSourceType === "csv") {
    return parseQuestionsFromCsv(input);
  }

  return parseQuestionsFromText(input);
}
