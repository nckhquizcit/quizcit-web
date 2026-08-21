import { createQuestionImportRow, IMPORT_OPTION_KEYS } from "./questionImportParser.js";
import { moodleHtmlToBlockNote } from "./moodleXmlParser.js";

const unescapeGift = (value = "") => String(value).replace(/\\([~=#{}:\\])/g, "$1").trim();
const isEscaped = (value, index) => {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) slashes += 1;
  return slashes % 2 === 1;
};

const findUnescaped = (value, token, start = 0) => {
  for (let index = start; index <= value.length - token.length; index += 1) {
    if (value.startsWith(token, index) && !isEscaped(value, index)) return index;
  }
  return -1;
};

const toContent = (value, html) => {
  const text = unescapeGift(value);
  if (!html) return { value: text, warnings: [] };
  return moodleHtmlToBlockNote(text);
};

export function detectAiken(input = "") {
  return /(?:^|\n)ANSWER\s*:\s*[A-D]\s*(?:\n|$)/i.test(String(input))
    && /(?:^|\n)[A-D][.)]\s+\S/.test(String(input));
}

export function parseQuestionsFromAiken(input = "") {
  const lines = String(input).replace(/\r\n?/g, "\n").split("\n");
  const questions = [];
  let current = { questionLines: [], options: [], sourceLine: 1 };

  const finish = (answerKey, lineNumber) => {
    const errors = [];
    if (!current.questionLines.join(" ").trim()) errors.push("Thiếu nội dung câu hỏi Aiken.");
    if (current.options.length < 2 || current.options.length > 4) errors.push("Câu hỏi Aiken phải có từ 2 đến 4 đáp án.");
    if (!current.options.some((option) => option.key === answerKey)) errors.push("ANSWER không khớp với các đáp án Aiken.");
    const row = createQuestionImportRow({
      content: current.questionLines.join("\n").trim(),
      options: current.options,
      correctKey: answerKey,
      sourceLine: current.sourceLine,
      sourceType: "aiken",
      difficulty: "",
      difficultyB: null,
      mappingErrors: errors,
    }, questions.length);
    questions.push({ ...row, sourceType: "aiken", moodleType: "Aiken", sourceErrors: errors });
    current = { questionLines: [], options: [], sourceLine: lineNumber + 1 };
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    const option = line.match(/^([A-D])[.)]\s+(.+)$/);
    const answer = line.match(/^ANSWER\s*:\s*([A-D])\s*$/i);
    if (answer) {
      finish(answer[1].toUpperCase(), index + 1);
    } else if (option) {
      current.options.push({ key: option[1], content: option[2] });
    } else if (line || current.questionLines.length) {
      current.questionLines.push(rawLine.trimEnd());
    }
  });
  if (current.questionLines.some((line) => line.trim()) || current.options.length) {
    const errors = ["Thiếu dòng ANSWER cho câu hỏi Aiken."];
    const row = createQuestionImportRow({
      content: current.questionLines.join("\n").trim(),
      options: current.options,
      sourceLine: current.sourceLine,
      sourceType: "aiken",
      difficulty: "",
      difficultyB: null,
      mappingErrors: errors,
    }, questions.length);
    questions.push({ ...row, sourceType: "aiken", moodleType: "Aiken", sourceErrors: errors });
  }
  return questions;
}

export function detectGift(input = "") {
  const value = String(input);
  return /(?:^|\n)\s*(?:\$CATEGORY\s*:|::[^\n]*::)/i.test(value)
    || /\{[\s\S]*(?:^|[^\\])[=~](?:[^}\\]|\\.)*\}/m.test(value);
}

const splitGiftQuestions = (input) => {
  const value = String(input).replace(/\r\n?/g, "\n");
  const entries = [];
  let category = "";
  let buffer = "";
  let startLine = 1;
  let line = 1;
  let inAnswers = false;

  const flush = () => {
    const cleaned = buffer.replace(/^\s*\/\/.*$/gm, "").trim();
    if (cleaned) entries.push({ text: cleaned, category, sourceLine: startLine });
    buffer = "";
  };
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (!inAnswers && value.startsWith("$CATEGORY:", index)) {
      flush();
      const end = value.indexOf("\n", index);
      category = value.slice(index + 10, end < 0 ? value.length : end).trim();
      index = (end < 0 ? value.length : end) - 1;
      startLine = line + 1;
      continue;
    }
    if (char === "{" && !isEscaped(value, index)) inAnswers = true;
    if (char === "}" && !isEscaped(value, index)) inAnswers = false;
    if (char === "\n") {
      line += 1;
      const nextEnd = value.indexOf("\n", index + 1);
      const nextLine = value.slice(index + 1, nextEnd < 0 ? value.length : nextEnd);
      if (!inAnswers && !nextLine.trim()) {
        flush();
        startLine = line + 1;
        continue;
      }
    }
    buffer += char;
  }
  flush();
  return entries;
};

export function parseQuestionsFromGift(input = "") {
  return splitGiftQuestions(input).map((entry, index) => {
    let source = entry.text.replace(/^\s*\/\/.*$/gm, "").trim();
    let title = "";
    const titleMatch = source.match(/^::(.+?)::/);
    if (titleMatch) {
      title = unescapeGift(titleMatch[1]);
      source = source.slice(titleMatch[0].length).trim();
    }
    const html = /^\[html\]/i.test(source);
    source = source.replace(/^\[(?:html|plain|moodle|markdown)\]\s*/i, "");
    const open = findUnescaped(source, "{");
    const close = open >= 0 ? findUnescaped(source, "}", open + 1) : -1;
    const errors = [];
    const warnings = [];
    if (open < 0 || close < 0) errors.push("Câu hỏi GIFT thiếu khối đáp án {...}.");
    const questionText = open >= 0 ? source.slice(0, open).trim() : source;
    let answerBody = open >= 0 && close >= 0 ? source.slice(open + 1, close) : "";
    let generalFeedback = "";
    const feedbackIndex = findUnescaped(answerBody, "####");
    if (feedbackIndex >= 0) {
      generalFeedback = answerBody.slice(feedbackIndex + 4).trim();
      answerBody = answerBody.slice(0, feedbackIndex);
    }
    const tokens = [];
    let cursor = 0;
    const booleanMatch = answerBody.trim().match(/^(TRUE|FALSE|T|F)(?:\s*#([\s\S]*))?$/i);
    if (booleanMatch) {
      const isTrue = ["TRUE", "T"].includes(booleanMatch[1].toUpperCase());
      tokens.push({ text: "Đúng", fraction: isTrue ? 100 : 0 });
      tokens.push({ text: "Sai", fraction: isTrue ? 0 : 100 });
      if (booleanMatch[2]?.trim()) warnings.push("Feedback riêng của đáp án không được lưu.");
      cursor = answerBody.length;
    }
    while (cursor < answerBody.length) {
      let marker = -1;
      for (let scan = cursor; scan < answerBody.length; scan += 1) {
        if ((answerBody[scan] === "=" || answerBody[scan] === "~") && !isEscaped(answerBody, scan)) { marker = scan; break; }
      }
      if (marker < 0) break;
      let next = answerBody.length;
      for (let scan = marker + 1; scan < answerBody.length; scan += 1) {
        if ((answerBody[scan] === "=" || answerBody[scan] === "~") && !isEscaped(answerBody, scan)) { next = scan; break; }
      }
      let raw = answerBody.slice(marker + 1, next).trim();
      let fraction = answerBody[marker] === "=" ? 100 : 0;
      const fractionMatch = raw.match(/^%(-?\d+(?:\.\d+)?)%/);
      if (fractionMatch) { fraction = Number(fractionMatch[1]); raw = raw.slice(fractionMatch[0].length); }
      const answerFeedback = findUnescaped(raw, "#");
      if (answerFeedback >= 0) { warnings.push("Feedback riêng của đáp án không được lưu."); raw = raw.slice(0, answerFeedback); }
      tokens.push({ text: raw.trim(), fraction });
      cursor = next;
    }
    if (tokens.length > 4) errors.push("Cấu hình hiện tại chỉ hỗ trợ tối đa 4 đáp án.");
    const positives = tokens.filter((token) => token.fraction > 0);
    if (positives.length !== 1) errors.push("Câu hỏi phải có đúng một đáp án đúng; câu GIFT nhiều đáp án đúng không được hỗ trợ.");
    const question = toContent(questionText, html);
    const explanation = toContent(generalFeedback, html);
    warnings.push(...question.warnings, ...explanation.warnings);
    const options = tokens.slice(0, 4).map((token, optionIndex) => {
      const content = toContent(token.text, html);
      warnings.push(...content.warnings);
      return { key: IMPORT_OPTION_KEYS[optionIndex], content: content.value };
    });
    const row = createQuestionImportRow({
      content: question.value,
      contentFormat: html ? "blocknote" : "plain",
      explanation: generalFeedback ? explanation.value : "",
      options,
      correctKey: IMPORT_OPTION_KEYS[tokens.indexOf(positives[0])] || "",
      sourceLine: entry.sourceLine,
      sourceType: "gift",
      difficulty: "",
      difficultyB: null,
      mappingErrors: errors,
    }, index);
    return {
      ...row, sourceType: "gift", moodleType: "GIFT", moodleName: title,
      moodleCategory: entry.category, sourceErrors: errors,
      sourceWarnings: [...new Set(warnings)], warnings: [...new Set(warnings)],
    };
  });
}
