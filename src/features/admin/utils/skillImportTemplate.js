export const SKILL_IMPORT_CSV_HEADER = "Tên kỹ năng,Mô tả";

const escapeCsv = (value = "") => `"${String(value ?? "").replaceAll('"', '""')}"`;

export const SKILL_IMPORT_CSV_SAMPLE_ROWS = [
  ["Giải phương trình bậc hai", "Kỹ năng giải và biện luận phương trình bậc hai dạng ax^2 + bx + c = 0"],
  ["Đạo hàm của hàm hợp", "Tính đạo hàm các hàm hợp cơ bản và nâng cao theo quy tắc chuỗi"],
  ["Tích phân từng phần", "Phương pháp tính tích phân từng phần đối với hàm đa thức, lượng giác, mũ và logarit"],
  ["Cấu trúc cây nhị phân", "Hiểu cấu trúc dữ liệu cây nhị phân, các phép duyệt cây tiền tự, trung tự, hậu tự"],
];

export function createSkillImportCsvContent() {
  const lines = [
    SKILL_IMPORT_CSV_HEADER,
    ...SKILL_IMPORT_CSV_SAMPLE_ROWS.map((row) => row.map(escapeCsv).join(",")),
  ];
  return lines.join("\n");
}

export function downloadSkillImportTemplate(filename = "quizcit_mau_import_ky_nang.csv") {
  const content = createSkillImportCsvContent();
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
