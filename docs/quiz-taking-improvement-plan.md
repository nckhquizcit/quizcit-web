# Quiz Taking Improvement Plan

## Mục tiêu

Nâng cấp trang làm bài của User để UX mượt hơn, dữ liệu câu hỏi đầy đủ hơn, và flow submit cập nhật điểm/năng lực skill đúng theo schema hiện có.

## Kết luận phân task

Không nên gom toàn bộ vào một task duy nhất. Phạm vi thay đổi chạm cả frontend, backend quiz/progress, tích hợp AI theta và kiểm thử end-to-end, nên chia thành 4 task để dễ review, rollback và nghiệm thu.

## Task 1 — Backend: Chuẩn hóa dữ liệu câu hỏi làm bài

### Phạm vi

- API lấy câu hỏi theo quiz cần trả đủ dữ liệu cho trang làm bài: question, options, skills.
- Sửa lỗi hiện tại câu hỏi chỉ hiển thị số thứ tự và nội dung, không render options.
- Chuẩn hóa response để frontend có thể hiển thị popup skill trên từng câu hỏi.

### Files dự kiến

- `quizcit-backend/src/main/java/vn/id/quiz/quizcitbackend/modules/quiz/service/QuestionServiceImplement.java`
- `quizcit-backend/src/main/java/vn/id/quiz/quizcitbackend/modules/quiz/service/QuestionMapper.java`
- `quizcit-backend/src/main/java/vn/id/quiz/quizcitbackend/modules/quiz/presentation/dto/QuestionResponse.java`
- `quizcit-backend/src/main/java/vn/id/quiz/quizcitbackend/modules/progress/repository/persistence/JpaQuestionSkillRepository.java`
- `quizcit-web/src/services/quizService.js`
- `quizcit-web/src/features/quiz/pages/QuizTakingPage/QuizTakingPage.jsx`

### Checklist

- [ ] Kiểm tra shape response thực tế của API lấy câu hỏi theo quiz.
- [ ] Đảm bảo `QuestionResponse.options` luôn được map khi User làm bài.
- [ ] Không expose đáp án đúng cho User trong flow làm bài, hoặc expose có kiểm soát nếu hiện architecture đang dùng chung DTO.
- [ ] Map `question_skills` vào response câu hỏi.
- [ ] Nếu cần hiển thị tên skill, enrich response thành object gồm `skillId`, `name`, `weight`, `primary` thay vì chỉ trả ID.
- [ ] Verify frontend đọc đúng field `options` và render được danh sách lựa chọn.

### Tiêu chí hoàn thành

- User mở quiz thấy đầy đủ nội dung câu hỏi và options.
- Mỗi câu có dữ liệu skill đủ để frontend mở popup.
- API response không làm lộ đáp án đúng ngoài nhu cầu cần thiết.

## Task 2 — Frontend: Pagination, navigation, flag và popup skill

### Phạm vi

- Trang làm bài chỉ render 5 câu hỏi mỗi trang/cụm.
- Load trước 5 câu đầu để hiển thị nhanh, phần còn lại load/cache âm thầm.
- Thanh điều hướng nhanh theo số câu.
- Cắm cờ câu hỏi và marker đỏ trên thanh điều hướng.
- Popup skill khi nhấn nút Skill trên câu hỏi.

### Files dự kiến

- `quizcit-web/src/features/quiz/pages/QuizTakingPage/QuizTakingPage.jsx`
- `quizcit-web/src/features/quiz/pages/QuizTakingPage/QuizTakingPage.css`
- `quizcit-web/src/services/quizService.js`

### Checklist

- [ ] Refactor state câu hỏi: `questions`, `visibleQuestions`, `currentPage`, `answers`, `flaggedQuestionIds`, `activeSkillQuestion`.
- [ ] Render mỗi cụm 5 câu theo `currentPage`.
- [ ] Click số câu `x` trên navigation sẽ chuyển tới page chứa câu `x`.
- [ ] Navigation hiển thị trạng thái current, answered, flagged.
- [ ] Câu flagged hiển thị marker/tick đỏ trên navigation.
- [ ] Thêm nút Skill và popup danh sách skill/trọng số.
- [ ] Đảm bảo chuyển page không mất đáp án đã chọn.

### Tiêu chí hoàn thành

- User có thể làm bài theo cụm 5 câu.
- User có thể nhảy nhanh tới bất kỳ câu nào qua navigation.
- User có thể cắm/gỡ cờ và thấy marker đỏ tương ứng.
- Popup skill hiển thị đúng skill của câu hỏi.

## Task 3 — Backend: Submit, scoring và cập nhật năng lực skill

### Phạm vi

- Submit gom answers thành `responses`.
- Tính đúng/sai dựa trên option được chọn.
- Tạo `attempts`, `responses`, cập nhật `user_skill_ability` và `ability_history`.
- Tạm thời cố định các giá trị chưa triển khai phức tạp theo yêu cầu.

### Files dự kiến

- `quizcit-backend/src/main/java/vn/id/quiz/quizcitbackend/modules/quiz/service/AttemptServiceImplement.java`
- `quizcit-backend/src/main/java/vn/id/quiz/quizcitbackend/modules/quiz/presentation/dto/SubmitQuizRequest.java`
- `quizcit-backend/src/main/java/vn/id/quiz/quizcitbackend/modules/quiz/presentation/dto/SubmitQuizResponse.java`
- `quizcit-backend/src/main/java/vn/id/quiz/quizcitbackend/modules/ai/client/AIClient.java`
- `quizcit-backend/src/main/java/vn/id/quiz/quizcitbackend/modules/ai/dto/EstimateThetaRequest.java`
- `AI/main.py`

### Checklist

- [ ] Kiểm tra submit hiện tại có tạo đủ `attempts` và `responses` không.
- [ ] Tính `rawScore` theo số câu đúng.
- [ ] Cập nhật `user_skill_ability.theta` theo kết quả đúng/sai của từng skill liên quan.
- [ ] Dùng `question_skills.weight` thay vì hardcode weight `1.0`.
- [ ] Lưu `ability_history` sau mỗi attempt nếu schema/model hiện có hỗ trợ.
- [ ] Thống nhất contract AI theta: backend hiện gọi `/api/v1/ai/estimate-theta`, AI folder expose `/estimate`; backend DTO có thể dùng `discriminations`, AI nhận `weights`.

### Ghi chú AI theta

AI service trong `AI/main.py` dùng Rasch model với Newton-Raphson:

- Input: `responses`, `difficulties`, `weights`.
- Xác suất đúng: `p = 1 / (1 + exp(-(theta - difficulty)))`.
- Gradient: tổng `weights * (responses - p)` trừ prior `theta / sigma^2`.
- Hessian: `-sum(weights * p * (1 - p)) - 1 / sigma^2`.
- Output: `{ "theta": number }`.

Cần thống nhất endpoint và field trước khi backend phụ thuộc vào AI hosted tại `https://quizcit-ai.onrender.com`.

### Tiêu chí hoàn thành

- Submit tạo attempt và responses đúng schema.
- `raw_score` phản ánh số câu đúng.
- `user_skill_ability` được cập nhật theo skill/weight của câu hỏi.

## Task 4 — Integration QA và nghiệm thu end-to-end

### Phạm vi

- Kiểm thử flow hoàn chỉnh từ mở quiz tới submit và xem result.
- Kiểm tra không regression admin CRUD quiz/question.
- Cập nhật tài liệu nếu có thay đổi contract API.

### Checklist

- [ ] Start backend và frontend local.
- [ ] Mở quiz có nhiều hơn 5 câu.
- [ ] Kiểm tra initial render chỉ hiển thị 5 câu đầu.
- [ ] Kiểm tra phần còn lại được cache/load để navigation mượt.
- [ ] Chọn đáp án ở nhiều page và đảm bảo không mất state.
- [ ] Cắm cờ/gỡ cờ và kiểm tra marker đỏ trên navigation.
- [ ] Mở popup skill trên nhiều câu.
- [ ] Submit quiz và kiểm tra attempt/responses trong DB.
- [ ] Kiểm tra raw score, theta tạm, standard error tạm.
- [ ] Kiểm tra result page nhận dữ liệu submit đúng.

### Tiêu chí hoàn thành

- Flow làm bài ổn định trên quiz nhiều câu.
- Không mất đáp án khi chuyển page.
- Navigation phản ánh đúng current/answered/flagged.
- Submit lưu đúng dữ liệu và trả result cho frontend.

## Thứ tự triển khai đề xuất

1. Task 1 — Backend response câu hỏi/options/skills.
2. Task 3 — Backend submit/scoring/skill ability.
3. Task 2 — Frontend pagination/navigation/flag/skill popup.
4. Task 4 — Integration QA và cập nhật docs/API notes.

## Rủi ro cần kiểm tra sớm

- API lấy câu hỏi đang dùng chung DTO cho admin và user, dễ lộ `corrected` nếu không tách response.
- Backend AI client và AI service hosted có thể đang lệch endpoint hoặc field request.
- Nếu backend chưa có phân trang câu hỏi thật, frontend chỉ có thể tối ưu render trước 5 câu; tối ưu network thật cần thêm API pagination.
- Skill popup cần tên skill; nếu response chỉ có `skillId`, frontend phải gọi thêm API/cache skill list.
