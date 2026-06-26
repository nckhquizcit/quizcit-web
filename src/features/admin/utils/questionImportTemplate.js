export const QUESTION_IMPORT_TXT_TEMPLATE = `Câu 1: HTML là viết tắt của gì?
A. Hyper Text Markup Language
B. High Text Machine Language
C. Hyper Tool Multi Language
D. Home Tool Markup Language
Đáp án: A
Độ khó: Medium
Giải thích: HTML là ngôn ngữ đánh dấu siêu văn bản.

Câu 2: CSS dùng để làm gì?
A. Tạo database
B. Tạo giao diện và định dạng trang web
C. Chạy server
D. Quản lý tài khoản
Đáp án: B
Độ khó: Easy`;

export const QUESTION_IMPORT_CSV_TEMPLATE = `Câu hỏi,A,B,C,D,Đáp án,Giải thích,Độ khó
"HTML là viết tắt của gì?","Hyper Text Markup Language","High Text Machine Language","Hyper Tool Multi Language","Home Tool Markup Language","A","HTML là ngôn ngữ đánh dấu siêu văn bản.","Medium"
"CSS dùng để làm gì?","Tạo database","Tạo giao diện và định dạng trang web","Chạy server","Quản lý tài khoản","B","","Easy"`;

export function downloadQuestionImportTemplate(type = "csv") {
  const isTextTemplate = type === "txt";
  const content = isTextTemplate ? QUESTION_IMPORT_TXT_TEMPLATE : QUESTION_IMPORT_CSV_TEMPLATE;
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
