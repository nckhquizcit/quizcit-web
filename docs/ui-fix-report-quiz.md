# Báo cáo sửa lỗi UI — Luồng làm bài

Phạm vi: `/app/quiz/:quizId`, `/app/adaptive/:attemptId`, `/app/quiz/result/:attemptId`.
Trạng thái: **5/5 fix xong**, test + lint + build sạch. Chưa verify bằng trình duyệt.

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1 | BLOCKER | Tự nộp khi hết giờ đọc `answers` từ closure của effect, có thể thiếu đáp án vừa bấm cùng nhịp đồng hồ về 0. | Thêm `answersRef` cập nhật ngay trong updater `setAnswers`; effect tự nộp đọc `answersRef.current`. |
| 2 | MAJOR | Tự nộp thất bại vẫn giữ cờ `autoSubmittedRef` → kẹt vĩnh viễn với đồng hồ 0, chỉ có 1 dòng lỗi. | Hạ cờ khi nộp **thất bại**, hiện banner `role="alert"` + nút "Thử nộp lại" gọi lại `doSubmit`. |
| 3 | MAJOR | `Object.keys(answers).length` đếm cả khoá câu đã bị gỡ khỏi đề → tiến độ vượt 100%, ô "Chưa trả lời" ra số âm. | Đếm theo `questions.filter(q => answers[q.questionId] != null)`; cả 8 chỗ dùng chung nguồn. |
| 4 | MAJOR | Nhóm cuối của bài thích ứng nộp thẳng, không xác nhận (bài thường đã có). | Nhóm cuối mở `Modal` xác nhận, nêu số câu chưa trả lời; nhóm giữa giữ nguyên nộp thẳng. |
| 5 | MAJOR | Trang kết quả dùng 1 thẻ lỗi "không tìm thấy" cho mọi loại lỗi → 403 báo sai bản chất; không có nút thử lại. | Thay bằng `ErrorState`, phân nhánh 403 / 404 / còn lại, thêm "Thử lại" gọi lại `loadResult`. |

**4 file, +198/−36.** `AdaptiveQuizPage` +87/−5 · `QuizResultPage` +56/−27 · `QuizTakingPage.jsx` +45/−4 · `QuizTakingPage.css` +10/−0.

**Lint:** exit 0. **Test:** `210 pass / 0 fail`. **Build:** exit 0 — `✓ 3268 modules transformed`, `✓ built in 7.43s`. Cảnh báo chunk >500 kB có sẵn từ trước.

**Lint fail rồi mới sạch:** lần đầu `eslint` báo `react-hooks/rules-of-hooks` ở `QuizTakingPage.jsx:694` vì `answeredCount` nằm sau các early return. Bỏ `useMemo`, dùng giá trị tính trực tiếp.

**Chưa làm được:** chưa verify bằng trình duyệt (không có tài khoản test, BE trả 401). Mọi kết luận là đọc code.

**Ngoài phạm vi, đã bỏ qua:** cảnh báo chunk >500 kB của `vite build` (chunk syntax highlighting của BlockNote, có sẵn từ trước).

**Không đụng:** `src/services/` (chỉ import `isAccessDenied`/`isNotFound`), endpoint nộp bài, cơ chế lưu nháp (effect ghi nháp phụ thuộc trực tiếp `answers` nên chạy ngay, không cần `sendBeacon`/`visibilitychange`).

**Kiểm tra tay nhanh:** bấm đáp án cuối lúc đồng hồ còn ~1s → câu đó vẫn tính "Bạn chọn" · DevTools Offline rồi để hết giờ → hiện banner + "Thử nộp lại", bật Online bấm lại → sang trang kết quả · chèn khoá rác vào nháp rồi F5 → tiến độ không vượt tổng, "Chưa trả lời" không âm · nhóm cuối bài thích ứng bấm "Nộp bài" → hiện hộp xác nhận kèm số câu chưa trả lời · mở kết quả của user khác → "Không có quyền xem kết quả này"; mở id không tồn tại → "Kết quả không tồn tại"; Offline rồi reload → "Không thể tải kết quả" + nút "Thử lại".
