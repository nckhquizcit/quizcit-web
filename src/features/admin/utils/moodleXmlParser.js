import { createQuestionImportRow, IMPORT_OPTION_KEYS } from "./questionImportParser.js";

const safeUrl = (value = "") => /^https?:\/\//i.test(String(value).trim());

const blockFactory = () => {
  let sequence = 0;
  return (type, content = [], props = {}) => ({
    id: `moodle-${Date.now()}-${sequence += 1}`,
    type,
    props,
    content,
    children: [],
  });
};

const textSegments = (node, styles = {}) => {
  if (node.nodeType === 3) return node.nodeValue ? [{ type: "text", text: node.nodeValue, styles }] : [];
  if (node.nodeType !== 1) return [];
  const tag = node.tagName.toLowerCase();
  const nextStyles = { ...styles };
  if (["strong", "b"].includes(tag)) nextStyles.bold = true;
  if (["em", "i"].includes(tag)) nextStyles.italic = true;
  if (tag === "u") nextStyles.underline = true;
  if (["s", "strike"].includes(tag)) nextStyles.strike = true;
  if (tag === "code") nextStyles.code = true;
  const content = [...node.childNodes].flatMap((child) => textSegments(child, nextStyles));
  if (tag === "a" && /^(https?:|mailto:|tel:)/i.test(node.getAttribute("href") || "")) {
    return [{ type: "link", href: node.getAttribute("href"), content }];
  }
  if (tag === "br") return [{ type: "text", text: "\n", styles: nextStyles }];
  return content;
};

export function moodleHtmlToBlockNote(html = "") {
  const document = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const body = document.body;
  const makeBlock = blockFactory();
  const warnings = [];
  const blocks = [];

  const visit = (element) => {
    if (element.nodeType === 3) {
      if (element.nodeValue?.trim()) blocks.push(makeBlock("paragraph", textSegments(element)));
      return;
    }
    if (element.nodeType !== 1) return;
    const tag = element.tagName.toLowerCase();
    if (tag === "pre") {
      const code = element.querySelector(":scope > code");
      const languageMatch = (code?.className || "").match(/(?:language-|lang-)([\w#+.-]+)/i);
      blocks.push(makeBlock("codeBlock", element.textContent || "", { language: languageMatch?.[1] || "c" }));
      return;
    }
    if (tag === "img") {
      const src = element.getAttribute("src") || "";
      if (safeUrl(src)) blocks.push(makeBlock("image", [], { url: src, caption: element.getAttribute("alt") || "" }));
      else warnings.push("Ảnh nhúng Moodle chưa được hỗ trợ; vui lòng thêm lại bằng URL HTTP/HTTPS.");
      return;
    }
    if (["ul", "ol"].includes(tag)) {
      [...element.children].filter((child) => child.tagName.toLowerCase() === "li").forEach((item) => {
        blocks.push(makeBlock(tag === "ul" ? "bulletListItem" : "numberedListItem", textSegments(item)));
      });
      return;
    }
    const blockType = tag === "blockquote" ? "quote" : /^h[1-3]$/.test(tag) ? "heading" : "paragraph";
    const props = blockType === "heading" ? { level: Number(tag[1]) } : {};
    const segments = textSegments(element);
    if (segments.some((segment) => segment.text?.trim() || segment.content?.length)) blocks.push(makeBlock(blockType, segments, props));
    [...element.children].filter((child) => ["pre", "img", "ul", "ol"].includes(child.tagName.toLowerCase())).forEach(visit);
  };

  [...body.childNodes].forEach(visit);
  return { value: JSON.stringify(blocks.length ? blocks : [makeBlock("paragraph")]), blocks, warnings };
}

const directText = (element, selector) => element.querySelector(selector)?.textContent?.trim() || "";
const richValue = (element, selector) => moodleHtmlToBlockNote(directText(element, selector));

export function detectMoodleXml(input = "") {
  return /^\s*<\?xml[\s\S]*?<quiz[\s>]|^\s*<quiz[\s>]/i.test(String(input));
}

export function parseQuestionsFromMoodleXml(input = "") {
  if (typeof DOMParser === "undefined") throw new Error("Trình duyệt không hỗ trợ đọc Moodle XML.");
  const xml = new DOMParser().parseFromString(String(input), "application/xml");
  if (xml.querySelector("parsererror") || xml.documentElement?.tagName !== "quiz") {
    throw new Error("File Moodle XML không hợp lệ hoặc không có phần tử <quiz>.");
  }
  let category = "";
  const rows = [];
  [...xml.documentElement.children].filter((node) => node.tagName === "question").forEach((question, sourceIndex) => {
    const type = question.getAttribute("type") || "";
    if (type === "category") {
      category = directText(question, "category > text").replace(/^\$course\$\/top\/?/, "");
      return;
    }
    const errors = [];
    const warnings = [];
    if (!["multichoice", "truefalse"].includes(type)) errors.push(`Loại câu hỏi Moodle “${type || "không rõ"}” chưa được hỗ trợ.`);
    const questionContent = richValue(question, ":scope > questiontext > text");
    const feedback = richValue(question, ":scope > generalfeedback > text");
    warnings.push(...questionContent.warnings, ...feedback.warnings);
    const answers = [...question.children].filter((node) => node.tagName === "answer");
    if (answers.length > IMPORT_OPTION_KEYS.length) errors.push("Cấu hình hiện tại chỉ hỗ trợ tối đa 4 đáp án.");
    const positiveAnswers = answers.filter((answer) => Number(answer.getAttribute("fraction")) > 0);
    if (positiveAnswers.length !== 1) errors.push("Câu hỏi phải có đúng một đáp án đúng; câu Moodle nhiều đáp án đúng không được hỗ trợ.");
    const options = answers.slice(0, IMPORT_OPTION_KEYS.length).map((answer, index) => {
      const converted = richValue(answer, ":scope > text");
      warnings.push(...converted.warnings);
      if (directText(answer, ":scope > feedback > text")) warnings.push("Feedback riêng của đáp án không được lưu.");
      return { key: IMPORT_OPTION_KEYS[index], content: converted.value };
    });
    const correctIndex = answers.indexOf(positiveAnswers[0]);
    const row = createQuestionImportRow({
      content: questionContent.value,
      explanation: directText(question, ":scope > generalfeedback > text") ? feedback.value : "",
      contentFormat: "blocknote",
      options,
      correctKey: correctIndex >= 0 ? IMPORT_OPTION_KEYS[correctIndex] || "" : "",
      sourceLine: sourceIndex + 1,
      mappingErrors: errors,
    }, rows.length);
    rows.push({
      ...row,
      contentFormat: "blocknote",
      moodleType: type,
      moodleName: directText(question, ":scope > name > text"),
      moodleCategory: category,
      sourceErrors: errors,
      sourceWarnings: [...new Set(warnings)],
      warnings: [...new Set([...(row.warnings || []), ...warnings])],
    });
  });
  return rows;
}
