# Prompt sửa — quản trị đề thi

Báo cáo audit cụm này khá chắc tay, tôi kiểm chứng lại và xác nhận năm lỗi thật dưới đây.
Một mục của nó tự mâu thuẫn trong chính đoạn văn của nó, đã loại. Một mục là thêm tính năng mới
chứ không phải sửa lỗi, tôi để bạn quyết định riêng.
Copy nguyên khối dưới đây cho agent.

```
Bạn sửa 5 lỗi trong cụm quản trị đề thi của frontend React tại D:\study\quizcit\quizcit-web
(Vite + React Router 6, JSX thuần, CSS theo component).

PHẠM VI CỨNG:
- Chỉ sửa trong src/features/admin/.
- KHÔNG đụng backend D:\study\quizcit\quizcit-backend. Không đổi hợp đồng API.
- KHÔNG sửa src/services/. Nếu một fix có vẻ cần sửa chỗ đó thì dừng và báo cáo.
- Không thêm dependency. Không đổi bảng màu.
- Làm đúng 5 mục dưới, không hơn.
- Giữ phong cách code hiện có: comment tiếng Việt không dấu như các file admin đang viết.

BỐN VIỆC CẤM LÀM:
1. Có ý kiến nói hàm xoá đề thi thiếu khối bắt lỗi nên lỗi bị nuốt và modal đóng như đã thành công.
   SAI, và chính ý kiến đó tự bác bỏ mình ở nửa sau. Modal xác nhận xoá đang await hàm này bên trong
   khối try của nó và hiện lỗi inline. Đừng thêm khối bắt lỗi, đừng đổi luồng xoá.
2. KHÔNG thêm ô chọn loại đề khi tạo mới. Hiện loại đề bị đặt cứng, đó là thật, nhưng mở ra cho chọn
   là thêm tính năng mới và chưa ai xác minh backend nhận loại nào ở endpoint này. Ngoài phạm vi.
3. KHÔNG thêm kéo thả sắp xếp thứ tự câu hỏi trong đề. Nâng cấp lớn, để lần khác.
4. KHÔNG thay component ô tìm kiếm hiện tại bằng ô tìm kiếm dựng sẵn của bảng dữ liệu. Không có lỗi
   thật, chỉ là churn.

═══════════════════════════════════════════════════════════
FIX 1 — Đề thích ứng bị đối xử y hệt đề thường
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminQuizzes.jsx (dòng 236-241 và cột hành động khoảng 270-292)
File: src/features/admin/pages/AdminQuizQuestions.jsx (toàn trang)

Đề thích ứng chọn câu theo năng lực người làm, không có danh sách câu cố định. Nhưng:
- Nhãn loại đề có đủ ba loại, trong khi màu huy hiệu chỉ có hai nhánh: một loại riêng có màu hổ
  phách, MỌI loại còn lại màu xám. Nên đề thích ứng và đề theo chương nhìn giống hệt nhau.
- Trang sửa danh sách câu hỏi KHÔNG đọc trường loại đề một lần nào, tôi đã tìm cả file. Nó bày ra
  đúng giao diện thêm bớt câu như đề thường, và nút lưu gửi danh sách câu hỏi tĩnh lên.

Sửa:
- Thêm nhánh màu riêng cho đề thích ứng trong huy hiệu loại đề, dùng biến thể huy hiệu đã có sẵn
  trong Admin.css, không tạo màu mới.
- Ở trang sửa danh sách câu hỏi, nếu loại đề là thích ứng thì dừng sớm: hiện trạng thái rỗng giải
  thích rằng đề này chọn câu tự động theo năng lực nên không cấu hình danh sách câu, kèm nút quay
  lại. Ẩn cả nút thêm từ ngân hàng lẫn nút lưu. Dùng component trạng thái rỗng đã có sẵn.
- Trong bảng danh sách đề, ẩn hoặc vô hiệu hoá nút dẫn sang trang câu hỏi khi đề là loại thích ứng.
Tự đọc để lấy đúng chuỗi giá trị của loại đề, đừng đoán.

═══════════════════════════════════════════════════════════
FIX 2 — Thời lượng nhận số 0 và số âm
═══════════════════════════════════════════════════════════
File: src/features/admin/components/modals/CreateQuizModal.jsx (dòng 175-201)

Hàm gửi form chỉ kiểm tra môn, chương, tên đề và danh sách câu. KHÔNG kiểm tra thời lượng và số thứ
tự. Thuộc tính giá trị nhỏ nhất trên ô nhập chỉ là gợi ý của trình duyệt, không chặn được khi giá
trị được ép kiểu trong code. Xoá trắng ô thời lượng ra số 0, gõ số âm thì gửi số âm, và không có
chặn trên nên gõ bao nhiêu cũng lọt.

Sửa: thêm kiểm tra trong chính hàm gửi form, cùng chỗ với các kiểm tra đang có:
- Thời lượng phải là số hữu hạn, từ 1 đến 600 phút.
- Số thứ tự nếu có nhập thì phải là số hữu hạn và lớn hơn 0.
Báo lỗi bằng đúng cơ chế báo lỗi inline mà form này đang dùng, không dùng toast.
Trong dự án đã có sẵn hàm ép số thứ tự về khoảng hợp lệ ở src/features/admin/utils/displayOrder.js,
xem có dùng lại được không trước khi tự viết.

═══════════════════════════════════════════════════════════
FIX 3 — Sửa danh sách câu hỏi xong rời trang là mất sạch
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminQuizQuestions.jsx

Trang này không có bất kỳ cơ chế chặn rời trang nào, tôi đã tìm cả file. Thêm câu, bỏ câu, rồi bấm
back hoặc đổi mục trên thanh bên hoặc tải lại trang là thay đổi bay hết, im lặng. Nút huỷ thay đổi
cũng điều hướng đi thẳng, không hỏi lại.

Sửa:
- Thêm cờ đánh dấu đã thay đổi, so sánh danh sách câu hiện tại với bản gốc ngay sau khi nạp xong.
- Khi cờ đang bật, chặn điều hướng trong ứng dụng và chặn đóng tab trình duyệt.
- Nút huỷ thay đổi cũng phải hỏi xác nhận khi cờ đang bật.
Copy đúng cách làm đã có ở src/features/admin/pages/AdminChapterEdit.jsx, phần chặn rời trang khi
nội dung chưa lưu. Dùng lại modal xác nhận hành động có sẵn trong thư mục modal của admin, KHÔNG
viết component mới.
Tự kiểm để cảnh báo KHÔNG hiện khi người dùng chỉ vào xem rồi đi ra mà chưa sửa gì.

═══════════════════════════════════════════════════════════
FIX 4 — Nút lưu vẫn bấm được khi đề chưa có câu nào
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminQuizQuestions.jsx (khoảng dòng 142-143, 175, 200, 208-210)

Ba chuyện cùng một chỗ:
- Nút lưu không bị vô hiệu hoá khi danh sách rỗng, người dùng bấm xong mới biết là sai.
- Lỗi kiểm tra hợp lệ lúc lưu lại được hiển thị bằng component báo lỗi tải trang, nên một lỗi nhập
  liệu trông như cả trang hỏng.
- Khi danh sách rỗng chỉ có một dòng chữ nhỏ, không có nút gợi ý làm gì tiếp.

Sửa:
- Vô hiệu hoá nút lưu khi danh sách câu rỗng.
- Lỗi kiểm tra hợp lệ hiển thị bằng dòng lỗi inline cạnh nút lưu, tách khỏi component báo lỗi tải
  trang. Component báo lỗi tải trang chỉ dành cho lỗi nạp dữ liệu.
- Danh sách rỗng dùng component trạng thái rỗng có sẵn, kèm nút mở ngân hàng câu hỏi.
Tham khảo màn tạo đề mới trong cùng cụm, nó đã có chỉ báo đủ hay thiếu điều kiện làm sẵn.

═══════════════════════════════════════════════════════════
FIX 5 — Đổi chương nhanh, danh sách đề hiện sai chương
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminQuizzes.jsx (dòng 132-151, đặc biệt 144-147)

Hàm đổi chương gọi API lấy danh sách đề mà không có chốt kiểm tra kết quả trả về còn đúng chương
đang chọn hay không. Bấm nhanh chương A rồi chương B, phản hồi của A về sau sẽ ghi đè danh sách của
B. Các effect khác trong cùng file đều có chốt này, chỗ này thì thiếu.

Sửa: trước khi ghi kết quả vào state, so lại với chương đang chọn, khác thì bỏ qua kết quả đó. Giữ
nguyên cấu trúc hàm hiện tại, đừng chuyển thành effect.

═══════════════════════════════════════════════════════════
CÁCH LÀM VÀ KIỂM CHỨNG
═══════════════════════════════════════════════════════════
- Làm lần lượt FIX 1 đến FIX 5, không gộp.
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
   Riêng FIX 3 phải có kịch bản chứng minh cảnh báo KHÔNG hiện khi người dùng chưa sửa gì.
4. Mục nào không làm được và vì sao. Không im lặng bỏ qua.
Không thay đổi bất cứ thứ gì ngoài 5 mục trên.
```
