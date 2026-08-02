# Rich text cho câu hỏi, đáp án và giải thích

Ngày: 2026-08-02

## Bối cảnh

Lý thuyết (`theories`) đã dùng BlockNote: entity có cột `content_format` nhận `plain | blocknote`,
frontend có `TheoryEditor` để soạn và `TheoryContent` để hiển thị. Câu hỏi, đáp án và giải thích thì
vẫn là `<textarea>` / `<input>` thuần trong `AddQuestionModal.jsx`, hiển thị bằng chuỗi thô.

Mục tiêu: đưa rich text sang cả ba ô đó, để người soạn bài chèn được ảnh, code block và định dạng chữ.

## Quyết định đã chốt

| Vấn đề | Chốt |
|---|---|
| Phạm vi | Câu hỏi + đáp án + giải thích (lý thuyết đã có sẵn) |
| Ảnh | Chỉ dán URL. Không làm endpoint upload. |
| Định dạng lưu trữ | BlockNote JSON, thống nhất với lý thuyết |

Lý do chọn BlockNote JSON thay vì HTML string: toàn app dùng một trình soạn thảo duy nhất, và nội dung
được render qua React element chứ không nhét HTML thô, nên không mở ra bề mặt XSS. Backend hiện **không
sanitize HTML ở bất kỳ đâu**, nên hướng HTML string sẽ đòi hỏi DOMPurify ở mọi chỗ render.

## Frontend

Module đặt ở `src/components/richtext/` (mối quan tâm dùng chung, giống `src/components/ui/`), không nằm
trong `features/content` vốn chỉ dành cho theory.

| File | Vai trò |
|---|---|
| `richTextBlocks.js` | Logic thuần trên block/inline content: gom danh sách, đọc bảng, rút chữ trần, lọc scheme của `src`/`href` |
| `richTextUtils.js` | Tầng chuỗi: parse, serialize, chuẩn hoá format, `isRichTextEmpty`, `toPreviewText` |
| `RichTextEditor.jsx` | Bọc BlockNote. `variant="block"` cho câu hỏi/giải thích/lý thuyết, `variant="inline"` cho đáp án |
| `RichTextView.jsx` | Hiển thị. Xem mục dưới |

`theoryContentUtils.js`, `TheoryEditor.jsx`, `TheoryContent.jsx` giữ nguyên tên và trở thành lớp bọc
mỏng, nên không call site theory nào phải sửa và test cũ vẫn xanh.

### RichTextView: renderer thuần React

Đọc mảng block JSON rồi dựng React element trực tiếp, **không tạo editor ProseMirror**.

`TheoryContent` trước đây render read-only bằng `useCreateBlockNote` + `<BlockNoteView editable={false}>`.
Với lý thuyết (một instance mỗi trang) thì chấp nhận được. Bê nguyên cách đó sang câu hỏi thì trang làm
bài sẽ tạo 5 editor cho mỗi câu (1 câu hỏi + 4 đáp án), bảng ngân hàng 20 dòng sẽ tạo 20 editor. Đó là lý
do phải có renderer riêng.

Vì vậy `TheoryContent` cũng chuyển sang `RichTextView` luôn, giữ nguyên class `theory-rich-text` để CSS
hiện có không vỡ. Kết quả đo được từ output của `vite build`: chunk BlockNote 907 kB giờ chỉ còn nằm
trong `RichTextEditor`, tức là chỉ các màn hình soạn thảo của admin mới tải. `SubjectDetailPage` từ
908 kB xuống 6.46 kB.

Phạm vi block hỗ trợ: `paragraph`, `heading` (level 1–3), `bulletListItem`, `numberedListItem`,
`checkListItem`, `codeBlock`, `quote`, `image`, `table`. Inline: bold, italic, underline, strike, code,
link, màu chữ/nền, căn lề. Block lạ fallback về đoạn văn lấy chữ trần thay vì làm vỡ giao diện.

An toàn: không dùng `dangerouslySetInnerHTML`. `src` của ảnh chỉ nhận `http`/`https` hoặc đường dẫn
tương đối; `href` nhận thêm `mailto`/`tel`. `javascript:` và `data:` bị chặn.

`variant="inline"` render bằng thẻ `span` để nhúng được vào chỗ HTML không cho phép thẻ khối, ví dụ
nhãn `<label>` của đáp án và thẻ `<h3>` ở trang kết quả.

### Nơi soạn thảo

| Chỗ | Thay đổi |
|---|---|
| `AddQuestionModal.jsx` (`QuestionForm`, dùng chung cho cả tạo và sửa) | Câu hỏi + giải thích dùng `variant="block"`, đáp án dùng `variant="inline"` |
| `QuestionImportPreview.jsx` | Giữ textarea/input thuần. Import sinh plain text, không cần rich text ở bước sửa nhanh |

Form **luôn làm việc ở định dạng BlockNote**: khi mở, nội dung plain cũ được nâng cấp ngay bằng
`toRichTextValue`. Nếu không làm vậy sẽ có trạng thái nửa vời — câu hỏi đã là JSON trong khi giải thích
vẫn là chữ thuần, mà cả hai lại dùng chung một cột `content_format`.

Kéo theo đó, `isReadyToSubmit` và `handleSubmit` không kiểm tra chuỗi rỗng được nữa vì tài liệu rỗng
serialize ra `"[{\"type\":\"paragraph\"}]"`. Đã thay bằng `isRichTextEmpty`.

Giải thích rỗng gửi lên chuỗi rỗng chứ không phải JSON rỗng, để trang kết quả không hiện khung trống.

### Nơi hiển thị

Render đầy đủ bằng `RichTextView`: `QuizTakingPage`, `AdaptiveQuizPage`, `QuizResultPage` (câu hỏi, đáp
án, giải thích), và hai khối xem trước trong `AddQuestionModal`.

Danh sách và ô bảng dùng `toPreviewText` để gộp khoảng trắng rồi cắt ngắn, **không** render rich trong ô
bảng: `AdminQuestion` (3 chỗ), `AdminQuizQuestions` (2 chỗ), `CreateQuizModal`.

### Ảnh

Không truyền prop `uploadFile` cho BlockNote. Thiếu prop đó thì bảng chèn ảnh chỉ còn tab dán URL, đúng
với việc backend không có endpoint upload.

## Backend

Migration `V4__add_question_content_format.sql`:

```sql
ALTER TABLE questions ADD COLUMN IF NOT EXISTS content_format VARCHAR(20) NOT NULL DEFAULT 'plain';
```

Không thêm cột cho `options`. Đáp án không bao giờ được tạo hoặc sửa độc lập — không có endpoint
`/api/options`, chúng luôn đi kèm câu hỏi qua `POST /api/questions` và `PUT /api/questions/{id}`.
`OptionResponse` vẫn mang `contentFormat` nhưng là bản sao từ câu hỏi cha, để frontend biết đường render.

Cột `content_format` áp cho cả `content` lẫn `explanation` của cùng một câu hỏi, vì hai trường này luôn
được ghi cùng lúc bởi cùng một form.

Thay đổi kèm theo:

- `Question.java`: thêm `contentFormat`, mặc định `"plain"`.
- `CreateQuestionRequest` / `UpdateQuestionRequest`: thêm `contentFormat` với getter tự chuẩn hoá về
  `plain` hoặc `blocknote`.
- `QuestionResponse`, `OptionResponse`, `QuestionResultResponse`: trả `contentFormat`.
- `QuestionServiceImplement`, `AttemptServiceImplement`: gán `contentFormat` cho từng `OptionResponse`
  từ câu hỏi cha ở mọi đường dẫn dựng response.
- Validation trước đây thiếu hoàn toàn ở `CreateQuestionRequest`: thêm `@NotBlank` cho `content` và
  `@Size(max = 200000)` cho `content`, `explanation`, `option.content`. JSON dài hơn plain text đáng kể
  nên cần chặn.

`UpdateQuestionRequest.content` cũng nhận `@NotBlank`: `updateQuestion` ghi đè `content` vô điều kiện
(khác với `options`/`skills` vốn coi `null` là "giữ nguyên"), nên để trống sẽ xoá sạch nội dung câu hỏi.

`@Size` trên `CreateOptionRequest.content` chỉ chạy khi danh sách `options` được đánh dấu `@Valid`, nên
đã thêm cả annotation đó.

## Tương thích ngược

Dữ liệu cũ mang `content_format = 'plain'`, đi đúng nhánh render cũ. Khi admin mở ra sửa, plain text
được chuyển thành các block paragraph; lưu lại thì thành `blocknote`. Không cần migrate dữ liệu.

Frontend còn một lớp đỡ nữa: `mapOption` nhận format của câu hỏi cha làm giá trị mặc định, nên kể cả khi
API không kèm `contentFormat` ở cấp đáp án thì vẫn render đúng.

## Test

Dự án dùng `node:test` thuần cho logic, không có DOM runner, và trước đó **không có script nào để chạy
test**. Đã thêm `npm test`.

26 test mới cho phần logic thuần, gồm: lọc scheme của `src`/`href`, đọc inline content ở cả dạng chuỗi
và dạng mảng, gom mục danh sách liền kề, đọc bảng ở cả hai kiểu cell, chuẩn hoá format, và phân biệt
tài liệu rỗng với chuỗi rỗng. Tổng cộng 67/67 test pass.

## Ghi chú môi trường

`.\mvnw.cmd test` hiện báo 5 lỗi **không liên quan** tới thay đổi này, đã kiểm chứng riêng:

- 4 lỗi ở `AdaptiveQuizServiceTest` và `AttemptServiceImplementTest`: Byte Buddy chưa hỗ trợ JDK 25
  (`Java 25 (69) is not supported`), chết khi mock `AIService`. Chạy kèm
  `-DargLine=-Dnet.bytebuddy.experimental=true` thì cả 4 đều pass.
- 1 lỗi ở `QuizcitBackendApplicationTests.contextLoads`: Postgres từ chối
  `TimeZone: "Asia/Saigon"` ngay lúc mở kết nối, trước cả khi Flyway chạm tới V4.

Migration V4 **chưa được áp lên database** — nó sẽ tự chạy ở lần khởi động backend tiếp theo.
