# Bộ prompt audit UI — quizcit-web

Cách dùng: mỗi lần audit 1 cụm UI = copy **BLOCK CHUNG** + **1 prompt** bên dưới, dán vào agent.
Chạy tuần tự từng cụm, đừng gộp hết vào 1 lần (agent sẽ đọc nông và bỏ sót).

---

## BLOCK CHUNG (luôn dán kèm)

```
Bạn đang audit UI của frontend React tại D:\study\quizcit\quizcit-web (Vite + React Router, JSX thuần,
CSS theo từng component, Tailwind v4 có cài nhưng phần lớn UI dùng CSS thuần).

Bối cảnh kỹ thuật:
- Dev server: `npm run dev` → http://localhost:5174 (strictPort).
- Backend Spring Boot chạy sẵn ở http://localhost:8080. Hầu hết route nằm sau ProtectedRoute nên cần đăng nhập.
- Tài khoản test: <ĐIỀN USER/PASS, nếu không có thì audit thuần bằng đọc code và nói rõ phần nào chưa verify được trên trình duyệt>
- Router: src/routes/index.jsx (đọc file này trước để biết route + layout bao ngoài).
- Layout: src/layouts/MainLayout.jsx, src/layouts/AuthLayout.jsx, src/features/admin/AdminLayout.jsx
- Component dùng chung: src/components/ui/ (Badge, Button, Card, EmptyState, ErrorState, Field, Input,
  Modal, ProgressRing, Skeleton, Spinner, StatTile, Toast, ImageCropModal, SubjectImageField)
- Design token: src/styles/tokens.css, src/styles/global.css
- Chuẩn CSS bắt buộc tuân theo: CSS_STYLE_GUIDE.md (đọc trước khi phán một chỗ là "sai style")
- Hợp đồng API: API_SPEC.md (dùng để đối chiếu field FE đọc vs field BE trả)

Phạm vi kiểm tra cho MỌI màn hình được giao:
1. Lỗi hiển thị: layout vỡ, tràn chữ, overflow ngang, chồng z-index, sticky/scroll sai, ảnh vỡ/không có alt,
   spinner hoặc skeleton không bao giờ tắt, nội dung nhảy khi load xong.
2. Trạng thái thiếu: loading / empty / error / unauthorized (401, 403) / lỗi 500 / danh sách 0 phần tử /
   chuỗi rất dài / số rất lớn / dữ liệu null. Chỉ ra chỗ nào code không xử lý và sẽ crash hoặc hiện "undefined".
3. Đối chiếu dữ liệu: field FE đọc từ response có khớp API_SPEC.md không. Nêu rõ field lệch.
4. Responsive ở 360px, 768px, 1280px.
5. Accessibility cơ bản: label cho input, alt cho ảnh, focus nhìn thấy được, điều hướng bằng bàn phím,
   tương phản màu, aria cho modal/dialog.
6. Nhất quán: có chỗ nào tự vẽ lại thứ đã có trong src/components/ui/ không; màu/spacing có lệch tokens.css không.
7. Đề xuất nâng cấp: chỉ những thứ đổi được trải nghiệm thật, kèm ước lượng công sức.

PHẠM VI CỨNG — CHỈ UI:
- Chỉ được đọc và chỉ được đề xuất thay đổi trong: src/components/, src/features/**/ (phần pages + components),
  src/layouts/, src/styles/, và file CSS đi kèm component.
- TUYỆT ĐỐI không đụng backend D:\study\quizcit\quizcit-backend: không sửa entity, controller, migration, SQL, config.
- Không đề xuất đổi hợp đồng API. Nếu BE trả sai hoặc thiếu field, chỉ ghi nhận là "lệch hợp đồng, thuộc BE,
  ngoài phạm vi" rồi nêu cách FE hiển thị an toàn với dữ liệu hiện có.
- Không refactor src/services/ và src/stores/ về mặt logic. Chỉ được chạm khi lỗi thể hiện trực tiếp
  ra màn hình, và khi đó phải nói rõ đó là ngoại lệ.
- Không đổi thư viện, không thêm dependency mới.

Quy tắc làm việc:
- KHÔNG sửa code. Chỉ báo cáo.
- Mọi phát hiện phải kèm đường dẫn file:dòng cụ thể. Không có file:dòng = không được báo cáo.
- Phân biệt rõ "đã verify trên trình duyệt" và "suy ra từ đọc code".
- Không bịa. Không chắc thì ghi "cần kiểm tra thủ công".

Định dạng báo cáo:
| Mức | Màn hình | Vấn đề | File:dòng | Cách sửa đề xuất |
Mức: BLOCKER (không dùng được) / MAJOR (sai hoặc xấu rõ) / MINOR (cosmetic) / UPGRADE (đề xuất thêm).
Sắp xếp BLOCKER trước. Cuối báo cáo thêm mục "Top 5 nên làm trước" xếp theo impact/effort.
```

---

## Prompt 1 — Auth

```
Audit cụm màn hình xác thực.
Route: /login, /register, /verify, /forgot-password
Layout: src/layouts/AuthLayout.jsx
Thư mục: src/features/auth/
Context đăng nhập: src/stores/contexts/ForgotPasswordContext.jsx (bọc riêng cho /forgot-password)

Chú ý riêng:
- Validate form: thông báo lỗi có tiếng Việt, rõ ràng, gắn đúng field chưa.
- Trạng thái submit: có disable nút khi đang gửi không, double-submit có chặn không.
- Luồng nhiều bước của forgot-password: reload giữa chừng thì state có mất, có rơi vào màn hình trắng không.
- Verify email: link sai/hết hạn hiển thị gì.
- Chuyển hướng sau khi đăng nhập thành công, và khi đã đăng nhập rồi mà vào lại /login.
- Bảo mật hiển thị: có lộ thông báo phân biệt "email không tồn tại" vs "sai mật khẩu" không.
```

## Prompt 2 — Trang chủ người dùng

```
Audit trang chủ sau đăng nhập.
Route: /app
Thư mục: src/features/home/
Layout: src/layouts/MainLayout.jsx (audit luôn header, nav, menu người dùng, trạng thái active của link)

Chú ý riêng:
- Người dùng mới hoàn toàn (chưa học gì, chưa làm quiz nào) thì trang này hiện gì. Có empty state tử tế không.
- Các card thống kê: số 0, số null, số rất lớn hiển thị ra sao.
- MainLayout ở màn hình hẹp: menu có thu gọn không, có bị che nội dung không.
```

## Prompt 3 — Môn học và lý thuyết

```
Audit cụm môn học.
Route: /app/subjects, /app/subjects/:subjectId, /app/subjects/:subjectId/theories/:theoryId
Thư mục: src/features/subjects/, src/features/content/

Chú ý riêng:
- Danh sách môn: ảnh thiếu/lỗi, tên môn quá dài, lưới khi có 1 phần tử và khi có rất nhiều.
- Chi tiết môn: chương bị khoá (.locked) hiển thị và giải thích lý do khoá rõ chưa.
- Trang lý thuyết: nội dung rich text render từ BlockNote — kiểm tra tràn chữ, bảng rộng, code block,
  ảnh trong nội dung, và trường hợp nội dung rỗng hoặc sai định dạng.
- subjectId hoặc theoryId không tồn tại thì màn hình ra gì (404 tử tế hay màn hình trắng).
```

## Prompt 4 — Làm quiz

```
Audit luồng làm bài, phần quan trọng nhất của sản phẩm.
Route: /app/quiz/:quizId, /app/adaptive/:attemptId, /app/quiz/result/:attemptId
Thư mục: src/features/quiz/
Đọc thêm: docs/quiz-taking-improvement-plan.md, docs/richtext-question-answer.md

Chú ý riêng:
- Đồng hồ đếm ngược: hết giờ có tự nộp không, chuyển tab rồi quay lại thì giờ còn đúng không.
- Reload giữa bài: câu đã trả lời có mất không.
- Điều hướng câu hỏi, đánh dấu câu, nộp bài: có xác nhận trước khi nộp không.
- Câu hỏi rich text và đáp án rich text: tràn, ảnh, công thức.
- Adaptive: trạng thái chờ server chọn câu tiếp theo hiển thị gì, mạng chậm thì có kẹt không.
- Trang kết quả: chia sai, chia cho 0, không có kỹ năng nào, lời khuyên AI rỗng hoặc lỗi.
- Bấm nút nộp nhiều lần liên tiếp.
```

## Prompt 5 — Lịch sử và tiến độ

```
Audit cụm theo dõi kết quả.
Route: /app/history, /app/progress, /app/progress/skills, /app/progress/skills/:skillId
Thư mục: src/features/history/, src/features/progress/

Chú ý riêng:
- Phân trang, sắp xếp, lọc: có giữ trạng thái khi back lại không.
- Biểu đồ và ProgressRing: 0%, 100%, giá trị âm, NaN.
- Lịch sử rỗng, kỹ năng chưa có dữ liệu.
- Định dạng ngày giờ và số có nhất quán tiếng Việt không.
- Bảng dài trên màn hình hẹp: có scroll ngang trong khung riêng hay làm vỡ cả trang.
```

## Prompt 6 — Hồ sơ người dùng

```
Audit trang hồ sơ.
Route: /app/profile
Thư mục: src/features/profile/
Component liên quan: src/components/ui/ImageCropModal/, src/components/ui/SubjectImageField/

Chú ý riêng:
- Upload và crop ảnh đại diện: file quá lớn, sai định dạng, huỷ giữa chừng, ảnh dọc/ngang cực đoan.
- Lưu thông tin: phản hồi thành công/thất bại, có Toast không.
- Đổi mật khẩu nếu có: validate và thông báo lỗi.
- Modal crop: khoá scroll nền, đóng bằng Esc, bẫy focus.
```

## Prompt 7 — Khung quản trị và dashboard

```
Audit khung admin và các trang tổng quan.
Route: /admin/dashboard, /admin/profile, /admin/users, /admin/skills
Layout: src/features/admin/AdminLayout.jsx
Guard: src/features/admin/components/guard/ProtectedRoute.jsx
Thư mục: src/features/admin/pages/AdminDashboard.jsx, AdminProfile.jsx, AdminUsers.jsx, AdminSkills.jsx

Chú ý riêng:
- Sidebar admin: trạng thái active, thu gọn ở màn hình hẹp, cuộn khi nhiều mục.
- ProtectedRoute: user thường vào /admin thì thấy gì, có nháy nội dung admin trước khi bị đá ra không.
- Dashboard gọi GET /api/v1/admin/data-stats. Kiểm tra xử lý khi API lỗi hoặc trả 0 hết.
- Quản lý người dùng: phân trang, tìm kiếm, đổi vai trò, khoá tài khoản — có hỏi xác nhận không.
```

## Prompt 8 — Admin: môn học và chương

```
Audit quản trị nội dung.
Route: /admin/subjects, /admin/subjects/:subjectId/edit,
       /admin/subjects/:subjectId/chapters, /admin/subjects/:subjectId/chapters/:chapterId/edit
Thư mục: src/features/admin/pages/AdminSubjects.jsx, AdminSubjectEdit.jsx, AdminChapter.jsx, AdminChapterEdit.jsx

Chú ý riêng:
- Form dài: rời trang khi chưa lưu có cảnh báo không.
- Upload ảnh môn học.
- Soạn lý thuyết bằng BlockNote: lưu nháp, nội dung lớn, dán từ Word.
- Xoá: có xác nhận không, xoá mềm hay cứng, phản hồi ra sao.
- Thứ tự chương: kéo thả hoặc nhập số thứ tự, trùng số thì sao.
```

## Prompt 9 — Admin: câu hỏi

```
Audit quản trị câu hỏi.
Route: /admin/questions, /admin/questions/new, /admin/questions/import,
       và bản lồng trong chương: /admin/subjects/:subjectId/chapters/:chapterId/questions{,/new,/import}
Thư mục: src/features/admin/pages/AdminQuestion.jsx, AdminQuestionCreate.jsx, AdminQuestionImport.jsx
Đọc thêm: docs/richtext-question-answer.md

Chú ý riêng:
- Hai biến thể route (có chapter và không) dùng chung component: kiểm tra breadcrumb, nút back,
  và giá trị mặc định của form có đúng theo ngữ cảnh không.
- Trình soạn rich text cho câu hỏi và đáp án: ảnh, code, công thức, dán nội dung lạ.
- Đánh dấu đáp án đúng: cho phép 0 đáp án đúng hoặc nhiều đáp án đúng thì UI thể hiện thế nào.
- Import hàng loạt: file sai định dạng, file rỗng, file lớn, báo lỗi theo dòng, tiến độ import,
  và trạng thái sau khi import xong một phần.
- Gắn kỹ năng cho câu hỏi.
```

## Prompt 10 — Admin: đề thi

```
Audit quản trị đề thi.
Route: /admin/quizzes, /admin/quizzes/new, /admin/quizzes/:quizId/edit, /admin/quizzes/:quizId/edit/questions
Thư mục: src/features/admin/pages/AdminQuizzes.jsx, AdminQuizCreate.jsx, AdminQuizEdit.jsx, AdminQuizQuestions.jsx

Chú ý riêng:
- Đề adaptive vs đề thường: UI có phân biệt rõ không, trường nào không áp dụng cho adaptive.
- Chọn câu hỏi vào đề: tìm kiếm, lọc, chọn nhiều, bỏ chọn, đếm số câu đã chọn, giới hạn số câu.
- Thời lượng và tổng số câu: nhập số âm, số 0, số cực lớn.
- Rời trang khi đang sửa danh sách câu hỏi mà chưa lưu.
- Đề chưa có câu hỏi nào mà vẫn cho xuất bản thì cảnh báo gì.
```

## Prompt 11 — Xuyên suốt: component dùng chung và design system

```
Audit ngang toàn bộ app, không theo từng trang.
Thư mục: src/components/ui/, src/styles/tokens.css, src/styles/global.css
Chuẩn: CSS_STYLE_GUIDE.md

Nhiệm vụ:
- Liệt kê những chỗ trong src/features/ tự viết lại thứ đã có sẵn trong src/components/ui/
  (nút, thẻ, badge, empty state, error state, skeleton, modal, toast). Nêu file:dòng từng chỗ.
- Tìm màu hardcode, spacing hardcode, font-size hardcode lệch khỏi tokens.css.
- Tìm CSS class trùng tên giữa các feature có nguy cơ đè nhau, và các selector quá rộng
  (ví dụ selector trần lên thẻ html) gây ảnh hưởng ngoài phạm vi.
- Kiểm tra từng component trong src/components/ui/ có prop bắt buộc nào thiếu giá trị mặc định,
  hoặc không xử lý children rỗng.
- Đề xuất danh sách gộp/xoá cụ thể, xếp theo số chỗ dùng lại được nhiều nhất.
KHÔNG sửa code.
```

## Prompt 12 — Xuyên suốt: màn hình lúc lỗi

```
Audit ngang: khi có lỗi thì NGƯỜI DÙNG NHÌN THẤY GÌ. Chỉ xét phần hiển thị.
Được đọc src/services/ và src/stores/ để hiểu lỗi đi tới đâu, nhưng KHÔNG đề xuất sửa logic trong đó.
Mọi đề xuất phải nằm ở tầng UI: src/components/, src/features/**/, src/layouts/.

Nhiệm vụ:
- Có ErrorBoundary ở cấp app chưa. Không có thì lỗi render một component làm trắng cả trang — đây là lỗi UI.
- Màn hình nào gọi API mà không có nhánh hiển thị lỗi, dẫn tới trang trống hoặc spinner quay mãi. Nêu file:dòng.
- Mất mạng, backend trả 500, backend trả HTML thay vì JSON, token hết hạn: mỗi trường hợp màn hình hiện gì.
  Chỗ nào hiện "undefined", "[object Object]", hoặc thông báo tiếng Anh lẫn tiếng Việt thì chỉ ra.
- Toast lỗi: chồng nhiều cái, không tự tắt, che mất nút thao tác.
- Đổi trang hoặc đổi bộ lọc nhanh: màn hình có nháy dữ liệu cũ rồi mới đúng không.
- Thông báo lỗi có nói cho người dùng biết phải làm gì tiếp theo không, hay chỉ báo "đã có lỗi".
KHÔNG sửa code.
```
