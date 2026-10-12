import JSZip from "jszip";
import { compactImportKey } from "./questionImportParser.js";

export const QUESTION_IMPORT_SAMPLE_QUESTION_COUNTS = Object.freeze({
  csv: 2,
  moodle: 1,
  gift: 1,
  aiken: 1,
});

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
  "Câu hỏi,A,B,C,D,Đáp án,Giải thích,Độ khó";

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

::Câu hỏi mẫu::HTML là viết tắt của gì? {
=Hyper Text Markup Language
~High Text Machine Language
~Hyper Tool Multi Language
~Home Tool Markup Language
####HTML là ngôn ngữ đánh dấu siêu văn bản.
}`;

export const QUESTION_IMPORT_AIKEN_TEMPLATE = `HTML là viết tắt của gì?
A. Hyper Text Markup Language
B. High Text Machine Language
C. Hyper Tool Multi Language
D. Home Tool Markup Language
ANSWER: A`;

export function createQuestionImportTemplate(type = "csv") {
  if (type === "moodle") return QUESTION_IMPORT_MOODLE_XML_TEMPLATE;
  if (type === "gift") return QUESTION_IMPORT_GIFT_TEMPLATE;
  if (type === "aiken") return QUESTION_IMPORT_AIKEN_TEMPLATE;

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
    ].map(escapeCsv).join(","),
    [
      "CSS dùng để làm gì?",
      "Tạo cơ sở dữ liệu",
      "Định dạng và thiết kế giao diện trang web",
      "Xử lý logic backend",
      "Quản trị hệ điều hành",
      "B",
      "CSS là ngôn ngữ định dạng kiểu dáng cho trang web.",
      "0.2",
    ].map(escapeCsv).join(","),
  ].join("\n");
}

export function createSkillsListCsv(subject, skills = [], chapter = null) {
  const headers = ["STT", "Môn học", "Chương", "Tên kỹ năng", "Mô tả"];
  const rows = (skills || []).map((s, idx) => [
    idx + 1,
    subject?.name || "Môn học",
    s.chapterName || chapter?.name || "Chương",
    s.name || s.skillName || "Kỹ năng",
    s.description?.trim() || "Chưa có mô tả",
  ]);

  return [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");
}

export function createSampleDifficultiesTxt(questionCount = 1) {
  const values = [0.6, 0.2];
  return Array.from({ length: questionCount }, (_, index) => values[index % values.length]).join(", ");
}

export function createSampleSkillsTxt(chapterSkills = [], questionCount = 2) {
  const skillNames = [...new Set(chapterSkills
    .map((skill) => String(skill?.name || skill?.skillName || "").trim())
    .filter(Boolean))];
  const primary = skillNames[0] || "Kỹ năng chính 1";
  const secondary = skillNames.find((name) => compactImportKey(name) !== compactImportKey(primary));

  return Array.from({ length: questionCount }, (_, index) =>
    index === 1 && secondary
      ? `${primary}: 0.6: primary, ${secondary}: 0.4`
      : `${primary}: 1.0`,
  ).join("\n");
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

  if (format === "csv") {
    return `HƯỚNG DẪN IMPORT CÂU HỎI CSV VÀO QUIZCIT
=========================================
Môn học đã chọn: ${subjectName || "Chưa chọn"}
Chương đã chọn: ${chapterName || "Chưa chọn"}
Định dạng câu hỏi: CSV (.csv)

BỘ FILE MẪU BAO GỒM:
1. 1_cau_hoi_mau.csv
   -> File chứa nội dung câu hỏi, các đáp án A-D, đáp án đúng, giải thích và độ khó (Theta IRT).
   -> Lưu ý: Môn học và Chương không lặp lại trong file vì bạn đã chọn trực tiếp trên hệ thống trước khi import.

2. 2_mang_skills_mau.txt
   -> File text gán mảng kỹ năng và trọng số cho từng câu hỏi theo thứ tự (mỗi dòng một câu).
   -> Ví dụ:
      Dòng 1: Kỹ năng 1: 1.0
      Dòng 2: Kỹ năng 1: 0.6: primary, Kỹ năng 2: 0.4
   -> Quy tắc:
      - Tên kỹ năng là định danh duy nhất (không phân biệt hoa/thường, không cần ID).
      - Mỗi câu bắt buộc có ít nhất 1 kỹ năng chính (primary: true).
      - Tổng trọng số các kỹ năng của mỗi câu phải bằng 1.0.

3. 3_danh_sach_skills_${compactImportKey(subjectName || "mon")}.csv
   -> Danh sách toàn bộ các kỹ năng của môn học để tra cứu tên kỹ năng chính xác.

4. 4_Huong_dan_import.txt
   -> Tài liệu hướng dẫn này.

CÁCH SỬ DỤNG KHI IMPORT:
- Bước 1: Chọn định dạng "CSV (.csv)".
- Bước 2: Chọn Môn học và Chương.
- Bước 3: Tải bộ file mẫu (.zip) nếu cần xem cấu trúc chuẩn.
- Bước 4: Tải lên File câu hỏi CSV và File mảng kỹ năng .txt (hoặc dán nội dung vào 2 ô tương ứng) rồi bấm "Phân tích nội dung".
- File mảng kỹ năng có đúng một dòng cho mỗi câu hỏi, theo cùng thứ tự.
- Bước 5: Xem trước kết quả, chỉnh sửa nếu cần và bấm "Import".
`;
  }

  const extMap = {
    moodle: "xml",
    gift: "gift",
    aiken: "aiken",
  };
  const ext = extMap[format] || "txt";
  const formatNames = {
    moodle: "Moodle XML (.xml)",
    gift: "Moodle GIFT (.gift)",
    aiken: "Moodle Aiken (.aiken)",
  };

  return `HƯỚNG DẪN IMPORT CÂU HỎI MOODLE VÀO QUIZCIT
============================================
Môn học đã chọn: ${subjectName || "Chưa chọn"}
Chương đã chọn: ${chapterName || "Chưa chọn"}
Định dạng câu hỏi: ${formatNames[format] || String(format).toUpperCase()}

LƯU Ý VỀ ĐỊNH DẠNG MOODLE GỐC:
Các chuẩn Moodle gốc (${String(format).toUpperCase()}) chỉ chứa câu hỏi và đáp án,
không hỗ trợ độ khó (Theta IRT) và phân bổ kỹ năng (Skills). Do đó hệ thống QuizCIT
bổ sung 2 file text đi kèm: 1 file chứa mảng độ khó và 1 file chứa mảng skills.

BỘ FILE MẪU BAO GỒM:
1. 1_cau_hoi_mau.${ext}
   -> File câu hỏi theo chuẩn Moodle gốc (${String(format).toUpperCase()}).

2. 2_do_kho_mau.txt
   -> File text chứa danh sách độ khó (Theta IRT) tương ứng theo thứ tự các câu hỏi.
   -> Ví dụ: 1, 1.05, 2, 3, -2, 0.6, -1.8, -0.6 hoặc mỗi dòng một số.

3. 3_mang_skills_mau.txt
   -> File text gán mảng kỹ năng và trọng số cho từng câu hỏi theo thứ tự (mỗi dòng một câu).
   -> Ví dụ:
      Dòng 1: Kỹ năng 1: 1.0
      Dòng 2: Kỹ năng 1: 0.6: primary, Kỹ năng 2: 0.4
   -> Quy tắc:
      - Tên kỹ năng là định danh duy nhất (không phân biệt hoa/thường, không cần ID).
      - Mỗi câu bắt buộc có ít nhất 1 kỹ năng chính (primary: true).
      - Tổng trọng số các kỹ năng của mỗi câu phải bằng 1.0.

4. 4_danh_sach_skills_${compactImportKey(subjectName || "mon")}.csv
   -> Danh sách toàn bộ các kỹ năng của môn học để tra cứu tên kỹ năng.

5. 5_Huong_dan_import.txt
   -> Tài liệu hướng dẫn này.

CÁCH SỬ DỤNG KHI IMPORT:
- Bước 1: Chọn định dạng "${formatNames[format] || String(format).toUpperCase()}".
- Bước 2: Chọn Môn học và Chương.
- Bước 3: Tải bộ file mẫu (.zip) nếu cần xem cấu trúc chuẩn.
- Bước 4: Tải lên đồng thời 3 file (File câu hỏi Moodle, File mảng độ khó .txt, File mảng kỹ năng .txt) hoặc dán nội dung rồi bấm "Phân tích nội dung".
- Mỗi giá trị độ khó và mỗi dòng kỹ năng tương ứng với một câu hỏi, theo cùng thứ tự.
- Bước 5: Xem trước kết quả, chỉnh sửa nếu cần và bấm "Import".
`;
}

export async function downloadImportZipPackage({
  format = "csv",
  subject,
  chapter,
  chapterSkills = [],
}) {
  const zip = new JSZip();

  const context = {
    subjectName: subject?.name || "MonHoc",
    chapterName: chapter?.name || "Chuong",
  };

  const questionContent = createQuestionImportTemplate(format);
  const questionCount = QUESTION_IMPORT_SAMPLE_QUESTION_COUNTS[format] || 1;
  const targetSkills = chapterSkills;
  const skillsCsv = createSkillsListCsv(subject, targetSkills, chapter);
  const targetSlug = compactImportKey(chapter?.name || subject?.name || "chuong");

  if (format === "csv") {
    // 1. File câu hỏi CSV (câu hỏi, các đáp án, đáp án đúng, giải thích, độ khó)
    zip.file("1_cau_hoi_mau.csv", "\ufeff" + questionContent);

    // 2. File mảng skills mẫu (.txt)
    zip.file("2_mang_skills_mau.txt", createSampleSkillsTxt(targetSkills, questionCount));

    // 3. File danh sách skills của chương để tra cứu
    zip.file(`3_danh_sach_skills_${targetSlug}.csv`, "\ufeff" + skillsCsv);

    // 4. File Hướng dẫn
    zip.file("4_Huong_dan_import.txt", "\ufeff" + createImportReadme("csv", context));
  } else {
    const extMap = {
      moodle: "xml",
      gift: "gift",
      aiken: "aiken",
    };
    const ext = extMap[format] || "txt";

    // 1. File câu hỏi chuẩn Moodle gốc
    zip.file(`1_cau_hoi_mau.${ext}`, "\ufeff" + questionContent);

    // 2. File mảng độ khó mẫu (.txt)
    zip.file("2_do_kho_mau.txt", createSampleDifficultiesTxt(questionCount));

    // 3. File mảng skills mẫu (.txt)
    zip.file("3_mang_skills_mau.txt", createSampleSkillsTxt(targetSkills, questionCount));

    // 4. File danh sách skills của chương để tra cứu
    zip.file(`4_danh_sach_skills_${targetSlug}.csv`, "\ufeff" + skillsCsv);

    // 5. File Hướng dẫn
    zip.file("5_Huong_dan_import.txt", "\ufeff" + createImportReadme(format, context));
  }

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

export function downloadQuestionImportTemplate(type = "csv") {
  const content = createQuestionImportTemplate(type);
  const files = {
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
