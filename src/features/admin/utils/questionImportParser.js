export const IMPORT_OPTION_KEYS = ["A", "B", "C", "D"];

const DIFFICULTY_LABELS = {
  "-1": "Easy",
  easy: "Easy",
  de: "Easy",
  "0": "Medium",
  medium: "Medium",
  trungbinh: "Medium",
  "1": "Hard",
  hard: "Hard",
  kho: "Hard",
};

const CSV_COLUMN_ALIASES = {
  content: ["content", "question", "cauhoi", "noidung", "noidungcauhoi"],
  A: ["a", "optiona", "dapana", "answerA"],
  B: ["b", "optionb", "dapanb", "answerB"],
  C: ["c", "optionc", "dapanc", "answerC"],
  D: ["d", "optiond", "dapand", "answerD"],
  correctKey: ["correct", "correctanswer", "correctoption", "dapan", "dapandung", "answer"],
  explanation: ["explanation", "explain", "giaithich", "loigiai"],
  difficulty: ["difficulty", "dokho"],
};

const stripDiacritics = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

const compactKey = (value = "") =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeText = (value = "") => String(value ?? "").replace(/\s+/g, " ").trim();

export const normalizeImportDifficulty = (value, fallback = "Medium") => {
  const normalizedKey = compactKey(value);
  return DIFFICULTY_LABELS[normalizedKey] || fallback;
};

export const createEmptyImportOptions = () =>
  IMPORT_OPTION_KEYS.map((key) => ({
    key,
    content: "",
  }));

const normalizeOptionList = (options = []) => {
  const byKey = new Map(
    (options || [])
      .map((option, index) => ({
        key: String(option?.key || IMPORT_OPTION_KEYS[index] || "").toUpperCase(),
        content: normalizeText(option?.content),
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

export function validateQuestionImportRow(row, { requireSubject = true, requireChapter = true } = {}) {
  const errors = [];
  const warnings = [];
  const content = normalizeText(row?.content);
  const options = normalizeOptionList(row?.options);
  const filledOptions = options.filter((option) => option.content);
  const correctKey = String(row?.correctKey || "").toUpperCase();

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

  return {
    errors,
    warnings,
  };
}

export function createQuestionImportRow(partial = {}, index = 0) {
  const correctResult = getSingleCorrectKey(partial.correctKey);
  const row = {
    id: partial.id || `import-question-${Date.now()}-${index}`,
    content: normalizeText(partial.content),
    options: normalizeOptionList(partial.options),
    correctKey: correctResult.correctKey,
    explanation: normalizeText(partial.explanation),
    difficulty: normalizeImportDifficulty(partial.difficulty, "Medium"),
    subjectId: partial.subjectId || "",
    chapterId: partial.chapterId || "",
    skillIds: Array.isArray(partial.skillIds) ? partial.skillIds : [],
    sourceLine: partial.sourceLine || index + 1,
  };
  const validation = validateQuestionImportRow(row, {
    requireSubject: Boolean(row.subjectId),
    requireChapter: Boolean(row.chapterId),
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
  const normalizedHeader = compactKey(headerCell);

  return Object.entries(CSV_COLUMN_ALIASES).find(([, aliases]) =>
    aliases.map(compactKey).includes(normalizedHeader),
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
        sourceLine: firstRowHasHeader ? index + 2 : index + 1,
      },
      index,
    ),
  );
}

export function parseQuestionImport(input = "", sourceType = "text") {
  if (sourceType === "csv") {
    return parseQuestionsFromCsv(input);
  }

  return parseQuestionsFromText(input);
}
