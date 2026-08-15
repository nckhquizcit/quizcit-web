export const QUESTION_IMPORT_TXT_TEMPLATE = `Câu 1: HTML là viết tắt của gì?
A. Hyper Text Markup Language
B. High Text Machine Language
C. Hyper Tool Multi Language
D. Home Tool Markup Language
Đáp án: A
Độ khó: Trung bình
Giải thích: HTML là ngôn ngữ đánh dấu siêu văn bản.

Câu 2: CSS dùng để làm gì?
A. Tạo database
B. Tạo giao diện và định dạng trang web
C. Chạy server
D. Quản lý tài khoản
Đáp án: B
Độ khó: Dễ`;

export const QUESTION_IMPORT_CSV_HEADER =
  "Câu hỏi,A,B,C,D,Đáp án,Giải thích,Độ khó,Môn học,Chương,Kỹ năng,Trọng số,Kỹ năng chính";

const escapeCsv = (value = "") => `"${String(value).replaceAll('"', '""')}"`;

export const QUESTION_IMPORT_MOODLE_XML_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="category">
    <category><text>$course$/top/QuizCIT mẫu</text></category>
  </question>
  <question type="multichoice">
    <name><text>Câu hỏi HTML mẫu</text></name>
    <questiontext format="html"><text><![CDATA[<p>HTML là viết tắt của gì?</p><pre><code class="language-c">printf("Hello");</code></pre>]]></text></questiontext>
    <generalfeedback format="html"><text><![CDATA[<p>HTML là ngôn ngữ đánh dấu siêu văn bản.</p>]]></text></generalfeedback>
    <single>true</single>
    <answer fraction="100" format="html"><text><![CDATA[<p>Hyper Text Markup Language</p>]]></text></answer>
    <answer fraction="0" format="html"><text><![CDATA[<p>High Text Machine Language</p>]]></text></answer>
    <answer fraction="0" format="html"><text><![CDATA[<p>Hyper Tool Multi Language</p>]]></text></answer>
    <answer fraction="0" format="html"><text><![CDATA[<p>Home Tool Markup Language</p>]]></text></answer>
  </question>
</quiz>`;

export const QUESTION_IMPORT_GIFT_TEMPLATE = `// QuizCIT hỗ trợ câu hỏi một đáp án đúng
$CATEGORY: QuizCIT mẫu

::Câu hỏi HTML mẫu::[html]<p>HTML là viết tắt của gì?</p><pre><code class="language-c">printf("Hello");</code></pre> {
=<p>Hyper Text Markup Language</p>
~<p>High Text Machine Language</p>
~<p>Hyper Tool Multi Language</p>
~<p>Home Tool Markup Language</p>
####<p>HTML là ngôn ngữ đánh dấu siêu văn bản.</p>
}`;

export const QUESTION_IMPORT_AIKEN_TEMPLATE = `HTML là viết tắt của gì?
A. Hyper Text Markup Language
B. High Text Machine Language
C. Hyper Tool Multi Language
D. Home Tool Markup Language
ANSWER: A`;

export function createQuestionImportTemplate(type = "csv", context = {}) {
  if (type === "txt") return QUESTION_IMPORT_TXT_TEMPLATE;
  if (type === "moodle") return QUESTION_IMPORT_MOODLE_XML_TEMPLATE;
  if (type === "gift") return QUESTION_IMPORT_GIFT_TEMPLATE;
  if (type === "aiken") return QUESTION_IMPORT_AIKEN_TEMPLATE;

  const { subjectName, chapterName } = context;
  if (!subjectName || !chapterName) return QUESTION_IMPORT_CSV_HEADER;

  return [
    QUESTION_IMPORT_CSV_HEADER,
    [
      "HTML là viết tắt của gì?",
      "Hyper Text Markup Language",
      "High Text Machine Language",
      "Hyper Tool Multi Language",
      "Home Tool Markup Language",
      "A",
      "HTML là ngôn ngữ đánh dấu siêu văn bản.",
      "Trung bình",
      subjectName,
      chapterName,
      "",
      "",
      "",
    ].map(escapeCsv).join(","),
  ].join("\n");
}

export function downloadQuestionImportTemplate(type = "csv", context = {}) {
  const content = createQuestionImportTemplate(type, context);
  const files = {
    txt: ["quizcit-mau-import-cau-hoi.txt", "text/plain;charset=utf-8"],
    csv: ["quizcit-mau-import-cau-hoi.csv", "text/csv;charset=utf-8"],
    moodle: ["quizcit-mau-moodle.xml", "application/xml;charset=utf-8"],
    gift: ["quizcit-mau-gift.gift", "text/plain;charset=utf-8"],
    aiken: ["quizcit-mau-aiken.aiken", "text/plain;charset=utf-8"],
  };
  const [filename, mimeType] = files[type] || files.csv;
  const blob = new Blob(["\ufeff", content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
