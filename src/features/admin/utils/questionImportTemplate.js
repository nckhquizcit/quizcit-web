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

export function createQuestionImportTemplate(type = "csv", context = {}) {
  if (type === "txt") return QUESTION_IMPORT_TXT_TEMPLATE;

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
  const isTextTemplate = type === "txt";
  const content = createQuestionImportTemplate(type, context);
  const filename = isTextTemplate ? "quizcit-mau-import-cau-hoi.txt" : "quizcit-mau-import-cau-hoi.csv";
  const mimeType = isTextTemplate ? "text/plain;charset=utf-8" : "text/csv;charset=utf-8";
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
