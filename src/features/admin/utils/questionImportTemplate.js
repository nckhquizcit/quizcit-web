import JSZip from "jszip";
import { compactImportKey } from "./questionImportParser.js";

export const QUESTION_IMPORT_TXT_TEMPLATE = `Câu 1: HTML là viết tắt của gì?
A. Hyper Text Markup Language
B. High Text Machine Language
C. Hyper Tool Multi Language
D. Home Tool Markup Language
Đáp án: A
Giải thích: HTML là ngôn ngữ đánh dấu siêu văn bản.

Câu 2: CSS dùng để làm gì?
A. Tạo database
B. Tạo giao diện và định dạng trang web
C. Chạy server
D. Quản lý tài khoản
Đáp án: B
Giải thích: CSS dùng để tạo kiểu cho website.`;

export const QUESTION_IMPORT_CSV_HEADER =
  "Câu hỏi,A,B,C,D,Đáp án,Giải thích,Độ khó,Môn học,Chương,Kỹ năng,Trọng số,Kỹ năng chính";

const escapeCsv = (value = "") => `"${String(value ?? "").replaceAll('"', '""')}"`;

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

  const { subjectName, chapterName, skillName } = context;
  if (!subjectName || !chapterName) return QUESTION_IMPORT_CSV_HEADER;

  const primarySkill = skillName || "Kỹ năng mẫu";

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
      "0.6",
      subjectName,
      chapterName,
      primarySkill,
      "1.0",
      "1",
    ].map(escapeCsv).join(","),
  ].join("\n");
}

export function createSkillsListCsv(subject, allSubjectSkills = []) {
  const headers = ["STT", "Môn học", "Chương", "Tên kỹ năng", "Mã kỹ năng (Skill ID)", "Mô tả"];
  const rows = allSubjectSkills.map((s, idx) => [
    idx + 1,
    subject?.name || "Môn học",
    s.chapterName || "Chương",
    s.name || s.skillName || "Kỹ năng",
    s.skillId || s.id || "",
    s.description || "",
  ]);

  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");
}

export function createSampleDifficultiesJson() {
  return JSON.stringify([1, 1.05, 2, 3, -2, 0.6, -1.8, -0.6], null, 2);
}

export function createSampleSkillsJson(chapterSkills = []) {
  const s1 = chapterSkills[0]?.name || "Kỹ năng chính 1";
  const s2 = chapterSkills[1]?.name || "Kỹ năng phụ 2";

  return JSON.stringify(
    [
      [
        { skillName: s1, weight: 1.0, primary: true },
      ],
      [
        { skillName: s1, weight: 0.6, primary: true },
        { skillName: s2, weight: 0.4, primary: false },
      ],
    ],
    null,
    2
  );
}

export function createImportReadme(format = "csv", context = {}) {
  const { subjectName, chapterName } = context;

  return `HƯỚNG DẪN IMPORT CÂU HỎI VÀO QUIZCIT
========================================
Môn học: ${subjectName || "Chưa chọn"}
Chương: ${chapterName || "Chưa chọn"}
Định dạng câu hỏi: ${String(format).toUpperCase()}

BỘ FILE MẪU BAO GỒM:
1. 1_cau_hoi_mau.${format === "moodle" ? "xml" : format === "gift" ? "gift" : format === "aiken" ? "aiken" : format === "txt" ? "txt" : "csv"}
   -> File chứa nội dung câu hỏi và các lựa chọn đáp án.

2. 2_danh_sach_skills.csv
   -> Danh sách toàn bộ các kỹ năng (Skills) của các chương trong môn học này kèm ID và tên kỹ năng.

3. 3_do_kho_mau.json (hoặc .txt)
   -> Mảng các giá trị độ khó (Theta IRT), ví dụ: [1, 1.05, 2, 3, -2] tương ứng theo thứ tự các câu hỏi.

4. 4_mang_skills_mau.json
   -> Mảng gán kỹ năng và trọng số cho từng câu hỏi. Mỗi câu bắt buộc:
      - Có ít nhất 1 kỹ năng chính (primary: true).
      - Tổng trọng số các kỹ năng của câu đó phải bằng 1.0 (ví dụ: 1.0 hoặc 0.6 + 0.4).

CÁCH SỬ DỤNG KHI IMPORT:
- Bước 1: Chọn định dạng "${String(format).toUpperCase()}".
- Bước 2: Chọn Môn học và Chương.
- Bước 3: Chọn Kỹ năng mặc định (nếu muốn áp dụng 1 kỹ năng cho toàn bộ câu hỏi) hoặc tải file mảng kỹ năng riêng.
- Bước 4: Tải lên đồng thời 3 file (File câu hỏi, File độ khó, File kỹ năng) hoặc dán nội dung rồi bấm "Phân tích nội dung".
- Bước 5: Xem trước, chỉnh sửa nếu cần và bấm "Import".
`;
}

export async function downloadImportZipPackage({
  format = "csv",
  subject,
  chapter,
  allSubjectSkills = [],
  chapterSkills = [],
}) {
  const zip = new JSZip();

  const context = {
    subjectName: subject?.name || "MonHoc",
    chapterName: chapter?.name || "Chuong",
    skillName: chapterSkills[0]?.name || allSubjectSkills[0]?.name || "Kỹ năng mẫu",
  };

  // 1. File câu hỏi mẫu
  const questionContent = createQuestionImportTemplate(format, context);
  const extMap = {
    csv: "csv",
    txt: "txt",
    moodle: "xml",
    gift: "gift",
    aiken: "aiken",
  };
  const ext = extMap[format] || "csv";
  zip.file(`1_cau_hoi_mau.${ext}`, "\ufeff" + questionContent);

  // 2. File danh sách skills của môn học
  const skillsCsv = createSkillsListCsv(subject, allSubjectSkills);
  zip.file(`2_danh_sach_skills_${compactImportKey(subject?.name || "mon")}.csv`, "\ufeff" + skillsCsv);

  // 3. File độ khó mẫu
  zip.file("3_do_kho_mau.json", createSampleDifficultiesJson());
  zip.file("3_do_kho_mau.txt", "1, 1.05, 2, 3, -2, 0.6, -1.8, -0.6");

  // 4. File mảng skills mẫu
  zip.file("4_mang_skills_mau.json", createSampleSkillsJson(chapterSkills.length ? chapterSkills : allSubjectSkills));

  // 5. File Hướng dẫn
  zip.file("5_Huong_dan_import.txt", "\ufeff" + createImportReadme(format, context));

  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: "blob" });
  const filename = `bo_mau_import_${format}_${compactImportKey(subject?.name || "mon")}_${compactImportKey(chapter?.name || "chuong")}.zip`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
