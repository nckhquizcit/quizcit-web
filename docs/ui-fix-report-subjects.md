# Báo cáo sửa lỗi UI — Cụm môn học

Phạm vi: `/app/subjects`, `/app/subjects/:subjectId`, `/app/subjects/:subjectId/theories/:theoryId`.
Trạng thái: **5/5 fix xong**, test + lint + build sạch. Chưa verify bằng trình duyệt.

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1a | MAJOR | Nhánh dự phòng chỉ coi là lỗi khi promise rejected. BE trả 200 kèm data rỗng cho id sai → `setSubject` nhận giá trị rỗng, trang render với "Môn học" / "—", không báo gì. | Chốt `subjectIdValue = value?.subjectId \|\| value?.subject_id`; không có → `EmptyState` "Không tìm thấy môn học" + nút về `/app/subjects`. |
| 1b | MAJOR | Cùng lỗi ở `TheoryPage`: `setTheory` nhận thẳng dữ liệu, không kiểm tra → khung trang có breadcrumb nhưng vùng nội dung trắng. | Chốt `theoryId` ở **cả hai** nhánh (reader-view + fallback waterfall) → `EmptyState` "Không tìm thấy bài học". |
| 1c | MINOR | Bài học tồn tại nhưng nội dung rỗng: `TheoryContent` trả `null` → vùng nội dung trắng không lời giải thích. | Dùng `isRichTextEmpty` (bắt cả `"[]"` và chuỗi toàn khoảng trắng) → `EmptyState` "Bài học chưa có nội dung". |
| 2 | MAJOR | `SubjectsPage.jsx:206` gọi `subject.name.toLowerCase()` không chốt, trong khi dòng dưới đã chốt cho `course_code`. Catalog-summary trải dữ liệu thô → bản ghi thiếu tên làm sập cả trang. | Đổi thành `(subject.name \|\| "")`, giống hệt cách `course_code` đang làm. |
| 3a | MINOR | `TheoryPage.jsx:312` truyền `leftIcon` nhưng `Button` chỉ nhận `iconLeft` → icon không render, prop lạ dồn vào `rest` và xuống thẳng thẻ DOM. | Đổi thành `iconLeft`; grep toàn `src/` không còn chỗ nào dùng `leftIcon`. |
| 3b/3c | MINOR | Hai nút "Thử lại" (`SubjectsPage.jsx:317`, `:359`) gọi `window.location.reload()` — tải lại cả trang. | Truyền `loadData()` đã có sẵn. |
| 4 | MINOR | Hàng điều hướng tự dựng bằng `button`/`link` không có `:focus-visible` → Tab không thấy đang đứng ở đâu. | Thêm 7 quy tắc `outline: 2px solid var(--color-primary-600); outline-offset: 2px` — khớp `Card.css`. |
| 5 | MAJOR | Banner khoá chương nói về "năng lực (theta)" — thuật ngữ nội bộ, người học không biết phải làm gì; khối kỹ năng ngay dưới chỉ render khi có `skills`, nên nhiều ca bị khoá mà không có hướng dẫn nào. | Chữ đổi sang hướng hành động, rẽ nhánh theo có/không có `skills`; nhãn khối → "Kỹ năng cần đạt để mở khóa". |

**5 file, +122/−24.** `TheoryPage.jsx` +51/−8 · `TheoryPage.css` +21/−0 · `SubjectDetailPage.jsx` +34/−7 · `SubjectDetailPage.css` +13/−0 · `SubjectsPage.jsx` +3/−9.

**Không đụng:** `src/services/**` (không fix nào cần sửa services), backend, `SubjectCard.jsx`, khối ảnh môn và khối kỹ năng chương.

**Test:** `210 pass / 0 fail` (`node --test`), không thêm test mới.
**Lint:** exit 0 (không output).
**Build:** exit 0 — `✓ 3268 modules transformed`, `✓ built in 9.17s`. Cảnh báo chunk >500 kB có sẵn từ trước (BlockNote/shiki).

**Chưa làm được:** chưa verify bằng trình duyệt — lúc kiểm tra Vite `5174` và backend `8080` **đều không listen** (chỉ `3080` của DSH GUI), repo không có tài khoản test. Mọi kết luận là từ đọc code + test/lint/build.

**Chốt phòng thủ, không phải bug đã tái hiện:** FIX 1a/1b giả định BE có thể trả 200 kèm data rỗng cho id sai. Nhiều khả năng BE ném 404 — khi đó rơi vào nhánh `ErrorState` cũ, vẫn đúng. Không viết lại luồng tải.

**Quyết định tự chọn (có thể đổi):** (1) "không tìm thấy" dùng `EmptyState` + nút về danh sách, **không** dùng `ErrorState`, vì nút "Thử lại" ở đây vô nghĩa. (2) `TheoryPage` retry bằng state `reloadToken` đưa vào dependency của `useEffect`, vì `load` nằm trong closure của effect, không gọi được từ render. (3) `SubjectDetailPage:410` cũng đổi `onRetry` sang `load` cho nhất quán với FIX 3 dù đề chỉ yêu cầu ở `SubjectsPage`.

**Không cần thêm rule focus:** nút "Bắt đầu làm" trong `.quiz-nav-row` là component `Button` dùng chung, đã có `.ui-btn:focus-visible` (`Button.css:23-26`).

**Kiểm tra tay nhanh:** sửa URL thành `/app/subjects/00000000-0000-0000-0000-000000000000` → "Không tìm thấy môn học" + nút về danh sách · đổi `theoryId` thành id sai → "Không tìm thấy bài học" · bài có nội dung trắng → "Bài học chưa có nội dung" · gõ ô tìm kiếm ở `/app/subjects` → lọc bình thường, không trắng trang · cuối bài lý thuyết → nút "Quay lại Chương N" **có mũi tên**, DOM không còn attribute `lefticon` · tắt backend rồi bấm Thử lại → chỉ vùng dữ liệu tải lại, trang không reload · Tab qua hàng chương/lý thuyết/mục lục → viền xanh 2px rõ · chương bị khoá → banner "Chương này chưa mở khóa." + câu hướng hành động.
