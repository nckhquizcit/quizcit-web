# Báo cáo sửa lỗi UI — Quản trị nội dung (môn học & chương)

Phạm vi: `/admin/subjects`, `/admin/subjects/:id/edit`, `/admin/subjects/:id/chapters`, `/admin/subjects/:id/chapters/:cid/edit`. Yêu cầu: `docs/ui-fix-prompt-admin-content.md`.
Trạng thái: **6/6 fix xong**, test + lint + build sạch. Chưa verify bằng trình duyệt.

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1 | BLOCKER | Trình soạn lý thuyết gắn `key` theo bài đang chọn → bấm sang bài khác / thêm bài mới là component tạo lại từ đầu, **mọi chỉnh sửa chưa lưu mất trắng**, không cảnh báo. Rời trang cũng vậy: grep toàn `src/`, cả cụm admin **không có chỗ nào** chặn rời trang. | Thêm `theoryDirty` + `theoryBaselineRef` giữ bản gốc lúc nạp, so sánh trong `handleTheoryContentChange` → **không bật cờ khi BlockNote phát sự kiện lúc khởi tạo**. Chuyển `handleSelectTheory`/`handleStartNewTheory`/tab thành hàm "yêu cầu" → mở `ConfirmActionModal` khi cờ bật. Thêm `useBlocker` + `beforeunload` theo đúng `QuizTakingPage.jsx:403-422`. |
| 2 | MAJOR | `subject-skills-tab-btn` và `subject-skills-tab-count` **không được định nghĩa ở bất kỳ file CSS nào** — chỉ xuất hiện trong 1 file JSX. Tab strip và các nút "Bài 1, Bài 2" render ra nút trần, trong khi "Thêm bài mới" cạnh đó có màu đặt thẳng trong JSX → nhìn như giao diện hỏng một nửa. | Thêm định nghĩa vào `Admin.css` bằng biến `tokens.css`: `.subject-skills-tabs`, `.subject-skills-tab-btn` (kèm `:hover`, `:focus-visible`, `.is-active`), `.subject-skills-tab-count`, `.subject-skills-pill-list`, `--pill`, `--dashed`. Chuyển 2 khối inline style (dải tab + danh sách nút chọn bài) và màu nút "Thêm bài mới" từ JSX thành class. |
| 3a | MAJOR | `.subject-grid > .subject-card` ghim cứng `height: 604px`. Môn **không có ảnh bìa** không render khối ảnh (`AdminSubjects.jsx:244-253`), thiếu ~200px nội dung nhưng thẻ vẫn cao 604px → chừa mảng trống lớn. | Bỏ `height`, đổi thành `min-height: 178px`. Căn chân thẻ đã có sẵn bằng `.adm2-card-footer { margin-top: auto }` (giữ nguyên). Xoá override `height: auto` trong media ≤760px vì chỉ để hoàn tác chiều cao cứng vừa bỏ. |
| 3b | MAJOR | `.subject-title`/`.chapter-title`/`.subject-code` **không có quy tắc ngắt dòng**, trong khi tên cho phép tới 200 ký tự và có thể gõ liền không dấu cách → tràn khỏi thẻ. | Thêm `overflow-wrap: anywhere` vào khối **có hiệu lực** (`Admin.css:4405`, khối sau thắng khối `:643`). Kẹp `.subject-title` 2 dòng bằng `-webkit-line-clamp`. |
| 4a | MAJOR | `handleDisplayOrderChange` ép khoảng **ngay trong lúc gõ**: muốn gõ `12` khi tổng chỉ 5 chương thì vừa gõ số đầu đã bị thay, không gõ tiếp được. | Bỏ 2 nhánh ép khoảng, chỉ giữ chặn ký tự không phải số (`isNaN`). Việc ép khoảng để nguyên cho `handleDisplayOrderBlur` đã có sẵn. |
| 4b | MAJOR | `totalChapters = Math.max(1, chapters.length \|\| 1)` → danh sách chương em tải hỏng/rỗng thì tổng thành 1, `clampChapterDisplayOrder` ép số thứ tự về 1. Admin mở chương 5, chỉ sửa tên, bấm lưu là **chương nhảy về vị trí 1** trong CSDL. | Thêm `canClampDisplayOrder = chapters.length > 0`. Không có dữ liệu thì `handleDisplayOrderBlur` giữ nguyên, và `save` giữ số thứ tự gốc đã nạp thay vì ép. |
| 5 | MAJOR | Bấm ✕ cạnh kỹ năng gọi `updateChapter` **ngay**, gỡ kỹ năng khỏi chương, không hỏi, không hoàn tác — trong khi xoá chương (cùng mức độ) lại có modal xác nhận hẳn hoi. | Tách `confirmRemoveSkill` khỏi `handleRemoveSkillFromChapter`, tái dùng `ConfirmActionModal` có sẵn, câu hỏi nêu rõ **tên kỹ năng và tên chương**. Không đổi hàm gọi API. |
| 6 | MAJOR | Đổi thứ tự chỉ dựa vào kéo thả HTML5. Khi bật sắp xếp, `tabIndex` bị bỏ (`AdminSubjects.jsx:249`) → **bàn phím không thao tác được gì**. Kéo thả HTML5 không chạy trên phần lớn trình duyệt di động → màn hẹp bật sắp xếp xong chỉ còn nước bấm huỷ. | Thêm cụm `.display-order-move-group` (grip + ▲▼) vào **cả hai** trang, giữ nguyên kéo thả. Vô hiệu hoá ▲ ở thẻ đầu, ▼ ở thẻ cuối. `event.stopPropagation()` + `preventDefault()` để không kích hoạt `onClick` của thẻ và không khởi động kéo thả. |

**4 file, +460/−70.** `AdminChapterEdit.jsx` +229/−25 · `Admin.css` +174/−10 · `AdminChapter.jsx` +78/−2 · `AdminSubjects.jsx` +49/−2.

**FIX 3 — nơi dùng của từng selector đã đụng:**

| Selector | Nơi dùng | Vì sao không hỏng trang khác |
|---|---|---|
| `.subject-title` | Chỉ `AdminSubjects.jsx:257` | Hai khối khai báo (`Admin.css:643` và `:4405`), sửa **khối sau (thắng)**. Class chỉ có trong lưới môn admin. |
| `.chapter-title` | Chỉ `AdminChapter.jsx:317` | Cùng nhóm selector chia sẻ với `.skill-card-title`; chỉ **thêm** khả năng ngắt dòng, không đổi font/size/màu. Trang Kỹ năng không thể xấu đi — tiêu đề dài trước tràn thì nay xuống dòng. |
| `.subject-code` | Chỉ `AdminSubjects.jsx:258` | Khối thắng `Admin.css:4417`. Chỉ thêm `overflow-wrap`. |
| `.subject-grid > .subject-card` | Chỉ `AdminSubjects.jsx:232/238` | Có tiền tố `.subject-grid >` nên không chạm `.subject-card` của `SubjectsPage` (trang user, dùng CSS riêng). |
| `.display-order-drag-handle` | `AdminSubjects.jsx:260`, `AdminChapter.jsx:341` | **Không sửa** rule gốc `:636`; chỉ thêm rule mới cho ngữ cảnh trong `.display-order-move-group`. |

**Ngoại lệ phạm vi:** xoá override `height: auto; min-height: 0` trong media ≤760px (`Admin.css:6504`) — nằm ngoài 4 khoảng dòng yêu cầu nêu cho FIX 3a, nhưng rule đó chỉ tồn tại để hoàn tác chiều cao cứng vừa bỏ; giữ lại là code chết gây hiểu nhầm.

**Đã cố ý KHÔNG làm** (theo 4 việc cấm): không thêm tự động lưu nháp vào `localStorage` · không sửa câu chữ "không thể hoàn tác" của 2 modal xoá (chưa ai xác minh BE xoá mềm hay cứng — sửa bây giờ là tạo thông tin sai mới) · không dọn hàng loạt inline style trong `AdminChapterEdit.jsx` (chỉ chuyển đúng 2 khối mà FIX 2 cần) · không thay màu hex hàng loạt trong `Admin.css` bằng biến.

**Lỗi tự gây ra khi đang sửa, đã tự sửa:** bản đầu của `applyTheories` đặt side effect (`setTheoryContent`, `setTheoryDirty`, gán ref) **bên trong** `setSelectedTheoryId(prev => …)`. `main.jsx:7` bật `StrictMode` nên React gọi hàm cập nhật **2 lần** → side effect chạy lặp. Đã đổi sang `selectedTheoryIdRef` để tính bài mục tiêu ngoài hàm cập nhật. Lint/build **không bắt được** lỗi này — phải kiểm tay theo kịch bản "chưa gõ gì" bên dưới.

**Test:** `210 pass / 0 fail`, `duration_ms 565.5605`. **Lint:** exit 0. **Build:** exit 0 — `✓ 3268 modules transformed`, `✓ built in 9.43s`. Cảnh báo chunk >500 kB có sẵn từ trước (`richTextSchema` 906 kB, `cpp` 1 MB — thư viện syntax highlight của BlockNote).

**Chưa làm được:** chưa verify bằng trình duyệt — repo không có tài khoản test, không có browser automation và không được cài thêm. FIX 1 **bắt buộc kiểm tay** vì không có test tự động nào phủ được.

**Hai điểm cần bạn biết:** (1) FIX 1 chỉ bảo vệ **tab lý thuyết**; form ở tab "Thông tin & Kỹ năng" (tên chương, thứ tự, kỹ năng) vẫn chưa có cảnh báo rời trang — đúng phạm vi yêu cầu giao, nhưng nếu muốn bảo vệ cả form đó thì là việc riêng. (2) `ConfirmActionModal` nhận prop `user` chỉ để hiển thị tên; tôi tận dụng bằng `{ displayName: "bản nháp" }` / `{ displayName: tên kỹ năng }` và luôn truyền `message` nên phần `user` không thực sự render. Cách này hơi lạm dụng prop — muốn gọn hơn thì nên cho `user` là optional trong `ConfirmActionModal`, nhưng file đó dùng chung với `AdminUsers` nên tôi không tự ý đụng.

**Kiểm tra tay nhanh:**
- **FIX 1 (mấu chốt):** mở `/admin/subjects/{id}/chapters/{cid}/edit`, **không gõ gì** → bấm đổi tab, đổi bài, bấm "Thêm bài mới" đều phải **chuyển ngay, không modal** (nếu modal hiện là cờ bật sai do sự kiện khởi tạo của BlockNote) · gõ 1 chữ rồi Ctrl+Z về đúng như cũ → đổi tab **không** hiện modal · gõ thêm 1 chữ → đổi tab/bài/thêm bài đều hiện modal đúng ngữ cảnh · đang sửa dở bấm Back hoặc breadcrumb → hiện modal rời trang, "Không" phải ở lại · F5 → hộp thoại của trình duyệt · lưu thành công rồi đổi tab → **không** hiện modal nữa.
- **FIX 2:** tab chính là pill trắng viền xám, tab đang chọn nền xanh nhạt viền xanh đậm kèm số bài trong vòng tròn; nút "Thêm bài mới" **viền nét đứt** xanh, không còn nút trần; rê chuột đổi nền, Tab qua thấy viền focus.
- **FIX 3a:** môn không ảnh bìa thấp hơn hẳn, không còn mảng trống; các thẻ cùng hàng thẳng chân; mô tả dài vẫn cắt sau 6 dòng.
- **FIX 3b:** dán tên ~200 ký tự **liền không dấu cách** vào tên môn → xuống dòng trong thẻ, tối đa 2 dòng, không tràn viền. Làm tương tự với tên chương.
- **FIX 4:** chương ở vị trí 5/5, xoá ô "Thứ tự", gõ `12` → **gõ được đủ "12"**, rời ô mới ép về 5 · gõ chữ → không nhập được.
- **FIX 5:** bấm ✕ gỡ kỹ năng → hiện modal nêu rõ tên kỹ năng + tên chương; "Không" thì **không có request nào**, "Có" thì hiện toast và kỹ năng biến mất.
- **FIX 6:** bật "Chỉnh thứ tự" ở cả 2 trang → ▲ mờ ở thẻ đầu, ▼ mờ ở thẻ cuối, bấm ▼ ở thẻ đầu đổi chỗ ngay · **Tab vào ▲/▼ rồi Enter phải di chuyển được** (trước đây không làm được) · thu cửa sổ ~375px bấm ▲▼ vẫn chạy · "Hủy" quay về thứ tự cũ.
