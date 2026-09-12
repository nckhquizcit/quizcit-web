# Báo cáo sửa lỗi UI — Cụm Admin Questions

Phạm vi: `/admin/questions{,/new,/import}` + bản lồng trong chương. Yêu cầu: `docs/ui-fix-prompt-admin-questions.md`.
Trạng thái: **5/5 fix xong**, test + lint + build sạch. Chưa verify bằng trình duyệt.

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1 | BLOCKER | Chương trả `skills` rỗng → effect lọc xoá sạch kỹ năng đang gắn. Sửa mỗi tiêu đề rồi lưu là mất kỹ năng, không báo gì. | Chỉ lọc khi `skillData.length`; rỗng thì giữ nguyên + cảnh báo `modal-inline-error` trong khối "Kỹ năng". Nhánh `catch` cũng cảnh báo. |
| 2 | BLOCKER | `options: detail?.options \|\| []` ghi đè đáp án của dòng bằng `[]` khi detail thiếu `options` → guard `!options.length` chặn, không ai sửa được câu đó. | `detailOptions` chỉ nhận khi detail có phần tử; thiếu thì rơi về `row.options`. Guard chỉ bắn khi cả hai rỗng. Guard ở `handleUpdateQuestion` giữ nguyên. |
| 3 | MAJOR | 3 chỗ đọc file không kiểm tra kích thước, đọc trọn vào RAM rồi parse đồng bộ → file vài chục MB treo tab. | Hằng số `MAX_IMPORT_FILE_BYTES = 5MB` + chặn ở cả 3 handler, cạnh chỗ chặn phần mở rộng; thông báo nêu tên file, kích thước thật và giới hạn. |
| 4 | MINOR | `disabled: Boolean(loadingEditQuestionId)` khoá nút Sửa của **cả bảng** khi tải 1 dòng. | `disabled: loadingEditQuestionId === row.questionId`. |
| 5a | MINOR | Ô tìm kiếm lọc lại toàn danh sách mỗi phím gõ, không độ trễ. | `useDeferredValue(searchQuery)` cho giá trị truyền vào hàm lọc; ô nhập vẫn bám `searchQuery`. |
| 5b | MINOR | Crumb trỏ tới danh sách chương lấy nhãn dự phòng "Chương", không khớp đích đến. | Đổi fallback thành "Môn học" ở `AdminQuestion` và `AdminQuestionImport`. |
| 5c | MINOR | 3 dòng "Đang đọc file..." không phải vùng trạng thái → trình đọc màn hình im lặng. | Thêm `role="status"`, không đổi chữ. |

**4 file, +78/−12.** `AddQuestionModal` +23/−2 · `ImportQuestionsModal` +41/−3 · `AdminQuestion` +13/−6 · `AdminQuestionImport` +1/−1. Tất cả trong `src/features/admin/`.

**Ngoại lệ phạm vi:** không có. Không chạm `src/services/`, không chạm backend, không thêm dependency, không đổi bảng màu.

**Test:** 210/210 pass, 0 fail. **Lint:** exit 0. **Build:** exit 0 — `✓ 3268 modules transformed`, `✓ built in 8.97s`. Cảnh báo chunk >500 kB có sẵn từ trước.

**Đường đi cũ hỏng ở đâu:** FIX 1 — `setSelectedSkills(current.filter(...))` với `skillData === []` thì `.some()` luôn false → `selectedSkills` về rỗng, `payload.skills = []`, mất kỹ năng. FIX 2 — `detailOptions` rỗng ghi đè `row.options` rồi `return` sớm, không tới `setEditingQuestion`.

**Chưa làm được:** chưa verify bằng trình duyệt (không cài browser automation). FIX 4 chỉ làm nút mờ đi, không có spinner — `RowActions` không có slot pending, không đổi component dùng chung. FIX 1 không tách được "chương chưa gắn kỹ năng" với "BE không trả trường `skills`" vì `getChapterById` đều cho ra `[]` — muốn tách phải đụng `src/services/` hoặc BE, ngoài phạm vi.

**Kiểm tra tay nhanh:** chương trống kỹ năng → mở Sửa, thấy cảnh báo hồng + kỹ năng cũ còn nguyên, sửa tiêu đề rồi lưu → kỹ năng vẫn còn · chặn response detail bỏ `options` → form vẫn mở với đáp án từ bảng · file >5MB → báo lỗi kèm tên file và số MB, tab không treo · bấm Sửa dòng 1 → nút Sửa dòng 2, 3 vẫn sáng · gõ tìm kiếm → không giật · hard reload URL có chapterId → crumb thứ 3 là "Môn học".
