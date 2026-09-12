# Prompt sửa — quản trị câu hỏi

Báo cáo audit cụm này sai nặng ở phần đầu: cả hai mục BLOCKER đều không đứng vững, một cái sai hẳn,
một cái bị thổi phồng. Hai mục MAJOR nữa cũng sai. Tôi đã đọc code kiểm chứng từng cái.
Năm mục còn lại là thật. Copy nguyên khối dưới đây cho agent.

```
Bạn sửa 5 lỗi trong cụm quản trị câu hỏi của frontend React tại D:\study\quizcit\quizcit-web
(Vite + React Router 6, JSX thuần, CSS theo component).

PHẠM VI CỨNG:
- Chỉ sửa trong src/features/admin/.
- KHÔNG đụng backend D:\study\quizcit\quizcit-backend. Không đổi hợp đồng API.
- KHÔNG sửa src/services/. Nếu một fix có vẻ cần sửa chỗ đó thì dừng và báo cáo.
- Không thêm dependency. Không đổi bảng màu.
- Làm đúng 5 mục dưới, không hơn.
- Giữ phong cách code hiện có: comment tiếng Việt không dấu như các file admin đang viết.

NĂM VIỆC CẤM LÀM, DÙ CÓ NGUỒN NÀO BẢO BẠN LÀM:
Tôi đã đọc code và xác nhận bốn cáo buộc đầu đều SAI. Đừng sửa theo chúng.
1. Có ý kiến nói nút phân tích nội dung trong modal nhập câu hỏi KHÔNG BAO GIỜ bấm được ở tab tải
   file, vì điều kiện vô hiệu hoá dựa vào nội dung nguồn mà nội dung nguồn chỉ được gán trong hàm
   đọc file xong. SAI. Đó chính là đường chạy bình thường: đọc file xong thì nội dung được gán và
   nút bật lên. Nút chỉ đứng im khi file rỗng hoặc đọc hỏng, và như vậy là đúng. Đừng nới điều kiện.
2. Có ý kiến nói biến thể form toàn trang thiếu ô chọn số đáp án nên không rút gọn được số đáp án.
   SAI. Biến thể đó có nút xoá riêng trên từng dòng đáp án, xoá bớt được bình thường. Đừng thêm ô
   chọn số đáp án vào đó.
3. Có ý kiến nói sau khi nhập một phần thành công, các dòng đã lưu biến mất nên không nhập tiếp
   được. SAI về kết luận. Danh sách cố tình chỉ giữ lại dòng lỗi, đúng thứ người dùng cần sửa rồi
   nhập lại. Đừng đổi.
4. KHÔNG làm nhiều đáp án đúng hay không có đáp án đúng. Backend chỉ có một cờ đúng sai trên từng
   lựa chọn, đổi là đổi hợp đồng API. Ngoài phạm vi.
5. KHÔNG thêm tự động lưu nháp vào bộ nhớ trình duyệt cho form soạn câu hỏi. Nâng cấp lớn, để lần khác.

═══════════════════════════════════════════════════════════
FIX 1 — Kỹ năng đã gắn bị xoá âm thầm, lưu là mất luôn
═══════════════════════════════════════════════════════════
File: src/features/admin/components/modals/AddQuestionModal.jsx (dòng 262-293, đặc biệt dòng 276)

Đây là lỗi nặng nhất cụm này. Khi mở form sửa câu hỏi, effect nạp danh sách kỹ năng của chương rồi
LỌC danh sách kỹ năng đang chọn, chỉ giữ lại những cái có trong danh sách vừa nạp. Nếu chương trả về
danh sách kỹ năng rỗng, vì chương thật sự chưa gắn kỹ năng nào hoặc vì backend không trả trường đó,
thì TOÀN BỘ kỹ năng đang gắn của câu hỏi bị bỏ khỏi state mà không báo gì. Người dùng chỉ sửa mỗi
cái tiêu đề rồi bấm lưu là kỹ năng của câu hỏi bay sạch.

Sửa:
- Chỉ chạy bước lọc khi danh sách kỹ năng nạp về THỰC SỰ có phần tử. Rỗng thì giữ nguyên kỹ năng
  đang chọn, đừng tự ý bỏ.
- Khi giữ nguyên trong tình huống đó, hiện một dòng cảnh báo ngắn trong form theo hướng: không đọc
  được danh sách kỹ năng của chương nên đang giữ nguyên kỹ năng cũ. Dùng đúng kiểu thông báo lỗi
  inline mà form này đang dùng sẵn, đừng dùng toast.

═══════════════════════════════════════════════════════════
FIX 2 — Mở form sửa bị chặn khi phản hồi chi tiết thiếu đáp án
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminQuestion.jsx (dòng 442-472, đặc biệt dòng 454 và 461)

Hàm mở form sửa gộp dữ liệu dòng trong bảng với dữ liệu chi tiết gọi từ API. Nhưng dòng gán đáp án
lấy CỨNG từ phản hồi chi tiết, rơi về mảng rỗng nếu thiếu, ghi đè luôn đáp án vốn đã có sẵn trong
dòng của bảng. Ngay sau đó có nhánh kiểm tra đáp án rỗng thì báo lỗi và bỏ cuộc. Nghĩa là chỉ cần
phản hồi chi tiết không kèm đáp án là không ai sửa được câu hỏi đó, dù dữ liệu vẫn nằm sẵn trong bảng.

Sửa: ưu tiên đáp án từ phản hồi chi tiết khi nó có phần tử, không có thì rơi về đáp án của dòng
trong bảng. Chỉ khi cả hai đều rỗng mới báo lỗi và dừng như hiện tại.
Giữ nguyên nhánh kiểm tra ở hàm lưu chỉnh sửa, đừng nới nó.

═══════════════════════════════════════════════════════════
FIX 3 — File nhập không giới hạn kích thước, treo tab
═══════════════════════════════════════════════════════════
File: src/features/admin/components/modals/ImportQuestionsModal.jsx (ba chỗ đọc file, khoảng dòng
627, 662, 697; chỗ đã chặn phần mở rộng nằm quanh dòng 588)

Ba hàm xử lý chọn file đều đọc thẳng toàn bộ file vào bộ nhớ mà không kiểm tra kích thước, rồi phân
tích đồng bộ ngay trên luồng giao diện. Một file vài chục MB là treo tab trước khi kịp làm gì.

Sửa: chặn file vượt quá 5MB ở cả ba chỗ, đặt ngay cạnh chỗ đang chặn phần mở rộng, thông báo nêu rõ
giới hạn và kích thước file người dùng vừa chọn. Tách ngưỡng ra một hằng số dùng chung, đừng viết số
5MB ba lần.

═══════════════════════════════════════════════════════════
FIX 4 — Tải một dòng làm khoá nút sửa của cả bảng
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminQuestion.jsx (khoảng dòng 850)

Nút sửa bị vô hiệu hoá khi CÓ BẤT KỲ dòng nào đang tải chi tiết, nên bấm sửa một câu là cả bảng đơ
nút sửa cho tới khi xong.

Sửa: chỉ vô hiệu hoá nút sửa của đúng dòng đang tải. Nếu component menu hành động hỗ trợ hiển thị
trạng thái chờ thì bật cho đúng dòng đó, không hỗ trợ thì thôi, đừng đổi component dùng chung.

═══════════════════════════════════════════════════════════
FIX 5 — Ba chốt nhỏ
═══════════════════════════════════════════════════════════
5a. File: src/features/admin/pages/AdminQuestion.jsx (khoảng dòng 363-374 và 676)
    Ô tìm kiếm lọc lại toàn bộ danh sách câu hỏi ngay mỗi lần gõ một phím, không có độ trễ nào. Ngân
    hàng vài nghìn câu là giật khi gõ.
    Sửa: dùng hook hoãn giá trị có sẵn của React 18 cho giá trị tìm kiếm truyền vào hàm lọc. KHÔNG
    thêm thư viện, KHÔNG tự viết bộ đếm thời gian.

5b. File: src/features/admin/pages/AdminQuestion.jsx (khoảng dòng 586-588)
    File: src/features/admin/pages/AdminQuestionImport.jsx (khoảng dòng 96)
    Mẩu breadcrumb trỏ tới danh sách chương của môn đang lấy nhãn dự phòng là chữ "Chương" khi chưa
    nạp xong tên môn. Nhãn đó không khớp với nơi liên kết dẫn tới.
    Sửa: đổi nhãn dự phòng thành "Môn học" ở cả hai chỗ.

5c. File: src/features/admin/components/modals/ImportQuestionsModal.jsx (các dòng chữ báo đang đọc
    file, khoảng dòng 1264 và các chỗ tương tự)
    Dòng chữ báo đang đọc file không được đánh dấu là vùng thông báo trạng thái, nên trình đọc màn
    hình im lặng suốt lúc chờ.
    Sửa: đánh dấu các dòng đó là vùng trạng thái. Không đổi chữ, không đổi giao diện nhìn thấy.

═══════════════════════════════════════════════════════════
CÁCH LÀM VÀ KIỂM CHỨNG
═══════════════════════════════════════════════════════════
- Làm lần lượt FIX 1 đến FIX 5, không gộp.
- FIX 1 và FIX 2 chạm đường dữ liệu có thể gây mất dữ liệu. Với mỗi cái, nêu rõ trong báo cáo đường
  đi cũ hỏng ở đâu và đường đi mới chặn ở đâu.
- Xong tất cả thì chạy trong D:\study\quizcit\quizcit-web:
    npm run test
    npm run lint
    npm run build
  Cả ba phải sạch. Dán output thật vào báo cáo, không tóm tắt.
- Đừng cài thêm công cụ test hay browser automation nào.

BÁO CÁO CUỐI:
1. Bảng: Fix | File đã sửa | Số dòng thay đổi | Tóm tắt một câu.
2. Output thật của test, lint, build.
3. Kịch bản kiểm tra tay cho từng fix, dạng "mở URL nào, làm gì, phải thấy gì".
   Riêng FIX 1 phải có kịch bản chứng minh kỹ năng KHÔNG bị mất khi chương không trả kỹ năng nào.
4. Mục nào không làm được và vì sao. Không im lặng bỏ qua.
Không thay đổi bất cứ thứ gì ngoài 5 mục trên.
```
