export const THEORY_FORMAT_PLAIN = "plain";
export const THEORY_FORMAT_BLOCKNOTE = "blocknote";

export function normalizeTheoryText(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n");
}

export function splitTheoryParagraphs(value) {
  return normalizeTheoryText(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function parseBlockNoteContent(value) {
  try {
    const blocks = JSON.parse(String(value ?? ""));
    return Array.isArray(blocks) ? blocks : [];
  } catch {
    return [];
  }
}

export function deserializeTheoryContent(content, format = THEORY_FORMAT_PLAIN) {
  if (format === THEORY_FORMAT_BLOCKNOTE) {
    const blocks = parseBlockNoteContent(content);
    return blocks.length ? blocks : [{ type: "paragraph" }];
  }

  const paragraphs = splitTheoryParagraphs(content);
  return paragraphs.length
    ? paragraphs.map((paragraph) => ({ type: "paragraph", content: paragraph }))
    : [{ type: "paragraph" }];
}

export function serializeBlockNoteContent(blocks) {
  return JSON.stringify(blocks);
}

function extractText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(extractText).join("");
  if (!value || typeof value !== "object") return "";

  return [value.text, value.content, value.children]
    .map(extractText)
    .join("");
}

export function isTheoryContentEmpty(content, format = THEORY_FORMAT_BLOCKNOTE) {
  if (format === THEORY_FORMAT_PLAIN) return !String(content ?? "").trim();
  return !extractText(parseBlockNoteContent(content)).trim();
}
