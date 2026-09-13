# Báo cáo sửa lỗi UI — Cụm Quản trị đề thi

Phạm vi: `/admin/quizzes`, `/admin/quizzes/new`, `/admin/quizzes/:quizId/edit`, `/admin/quizzes/:quizId/edit/questions`. Yêu cầu: `docs/ui-fix-prompt-admin-quizzes.md`.
Trạng thái: **5/5 fix xong**, test + lint + build sạch. Chưa verify bằng trình duyệt.

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1a | BLOCKER | Huy hiệu loại đề chỉ 2 nhánh màu: `FINAL` hổ phách, **mọi loại còn lại xám** → đề thích ứng và đề theo chương nhìn giống hệt. | Bảng `QUIZ_TYPE_BADGE_CLASSES` + `getQuizTypeBadgeClass`, `ADAPTIVE` dùng `adm2-badge--info` có sẵn. |
| 1b | BLOCKER | `AdminQuizQuestions` **không đọc `quiz.type` một lần nào** → bày giao diện thêm/bớt câu cho đề thích ứng, nút lưu gửi danh sách câu tĩnh lên. | Dừng sớm `if (isAdaptiveQuiz(quiz))` → `EmptyState` giải thích + nút quay lại; ẩn nút thêm và nút lưu. |
| 1c | BLOCKER | Bảng đề thi vẫn cho bấm "Câu hỏi" trên đề thích ứng → dẫn thẳng vào màn 1b. | Lọc `items` của `RowActions`, bỏ nút "Câu hỏi" khi `type === "ADAPTIVE"`. |
| 2 | MAJOR | `handleSubmit` chỉ check môn/chương/tên/câu, **không check thời lượng và số thứ tự**. `min="1"` chỉ là gợi ý trình duyệt. Xoá trắng → `0`, gõ `-5` → gửi `-5`, không chặn trên. | Thêm 2 khối validate vào `handleSubmit`: thời lượng `1..600`, thứ tự `> 0` (để trống hợp lệ). Báo lỗi bằng `setError` inline sẵn có, không toast. |
| 3 | MAJOR | Trang sửa câu hỏi **không có cơ chế chặn rời trang nào**. Thêm/bỏ câu rồi back, đổi mục sidebar, F5 → mất sạch, im lặng. Nút "Hủy thay đổi" đi thẳng. | Cờ `isDirty` so với bản gốc sau `load`, `useBlocker` + `beforeunload` + `ConfirmActionModal`, nút hủy hỏi lại. |
| 4a | MAJOR | Nút lưu **không bị vô hiệu hoá** khi danh sách rỗng — bấm xong mới biết sai. | `disabled={saving \|\| !quiz \|\| !quizQuestions.length}`. |
| 4b | MAJOR | Lỗi kiểm tra hợp lệ lúc lưu hiện bằng `ErrorState` của trang → lỗi nhập liệu trông như cả trang hỏng. | Tách state `saveError` → render `modal-inline-error` cạnh nút lưu. `ErrorState` chỉ còn cho lỗi nạp dữ liệu. |
| 4c | MINOR | Danh sách rỗng chỉ có một dòng chữ nhỏ, không gợi ý làm gì tiếp. | `EmptyState` có tiêu đề + mô tả + nút mở ngân hàng câu hỏi. |
| 5 | MAJOR | `handleChapterChange` gọi API không có chốt kiểm tra chương. Bấm nhanh A → B, phản hồi A về sau **ghi đè danh sách của B**. | Thêm `selectedChapterIdRef`, so `selectedChapterIdRef.current !== nextChapterId` thì bỏ qua kết quả ở cả `then`/`catch`/`finally`. |

**3 file, +194/−21.** `AdminQuizQuestions.jsx` +141/−21 · `AdminQuizzes.jsx` +53/−4 · `CreateQuizModal.jsx` +21/−3.

**Ngoại lệ phạm vi:** không có. Cả 3 file đều nằm trong `src/features/admin/`. Không đụng `src/services/`, không đụng backend, không đổi hợp đồng API, không thêm dependency, không đổi bảng màu.

**Test:** exit 0 — `pass 210`, `fail 0`, `duration_ms 595.58`. **Lint:** exit 0, không output. **Build:** exit 0 — `✓ 3268 modules transformed`, `✓ built in 8.57s`. Cảnh báo chunk >500 kB có sẵn từ trước (`cpp`, `richTextSchema` của BlockNote).

**Chưa làm được:** chưa verify bằng trình duyệt — cả 4 route nằm sau `ProtectedRoute roles={["ADMINISTRATOR"]}`, phiên này không có tài khoản test nên không đăng nhập được (`/admin/quizzes` redirect về `/login`). Bù lại đã chứng minh bằng máy: build transform đủ 3 chunk `AdminQuizQuestions`/`AdminQuizzes`/`CreateQuizModal`, bắt được lỗi cú pháp, import sai và vi phạm thứ tự hook (`useBlocker` khai báo trước early return 1b).

**Cố ý không làm** (theo yêu cầu): không thêm khối bắt lỗi cho hàm xoá đề (modal xác nhận đã tự await + hiện lỗi inline) · không thêm ô chọn loại đề (`type: "CHAPTER"` giữ hardcode) · không thêm kéo thả sắp xếp câu hỏi · không thay ô tìm kiếm hiện tại bằng ô của `DataTable`.

**`clampChapterDisplayOrder` không dùng lại được** cho FIX 2: hàm ép `""` → `1`, phá ngữ nghĩa "để trống xếp cuối" của ô thứ tự, và không có khái niệm tổng số đề để chặn trên. Nên chỉ validate, không clamp.

**Lệch hợp đồng (thuộc BE):** `API_SPEC.md:46` ghi `QuizType` chỉ có `CHAPTER, FINAL`, thực tế `QuizType.java:3-6` có thêm `ADAPTIVE`. Sai tài liệu, ngoài phạm vi.

**Kiểm tra tay nhanh:** đề thích ứng → huy hiệu xanh dương, không có nút "Câu hỏi", mở thẳng URL questions → khối rỗng + nút quay lại, không có nút lưu · xoá trắng thời lượng → lỗi "phải từ 1 đến 600 phút", không gửi request · vào trang câu hỏi **không sửa gì** rồi bấm back → **không hiện modal**; thêm 1 câu rồi back → hiện modal xác nhận · bỏ hết câu → nút Lưu mờ, hiện `EmptyState` có nút thêm · Slow 3G, đổi chương A rồi B liền → bảng hiện đúng đề chương B.
