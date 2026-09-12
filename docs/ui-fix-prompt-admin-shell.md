# Prompt sửa — khung admin và 4 trang quản trị

Báo cáo audit cụm này dài và phần lớn đúng, NHƯNG mục BLOCKER duy nhất của nó lại sai, và nếu làm theo
sẽ xoá mất style đang dùng thật. Tôi đã kiểm chứng và chặn lại. Sáu mục còn lại là thật.
Copy nguyên khối dưới đây cho agent.

```
Bạn sửa 6 lỗi trong khung admin và 4 trang quản trị của frontend React tại D:\study\quizcit\quizcit-web
(Vite + React Router 6, JSX thuần, CSS theo component).

PHẠM VI CỨNG:
- Chỉ sửa trong src/features/admin/ và src/components/Sidebar/.
- KHÔNG đụng backend D:\study\quizcit\quizcit-backend. Không đổi hợp đồng API.
- KHÔNG sửa src/services/. Nếu một fix có vẻ cần sửa chỗ đó thì dừng và báo cáo.
- KHÔNG sửa file tài liệu nào.
- Không thêm dependency. Không đổi bảng màu.
- Làm đúng 6 mục dưới, không hơn.
- Giữ phong cách code hiện có: comment tiếng Việt không dấu như các file admin đang viết.

NĂM VIỆC CẤM LÀM, DÙ CÓ NGUỒN NÀO BẢO BẠN LÀM:
1. TUYỆT ĐỐI KHÔNG xoá 247 dòng đầu của src/features/admin/pages/AdminProfile.css, và không xoá khối
   biến ở đầu file đó. Có ý kiến nói khối này đã chết hoàn toàn vì bị phần sau của chính file ghi đè
   100%. SAI, tôi đã đối chiếu từng selector. Phần sau KHÔNG khai báo lại các selector nhãn trường,
   giá trị trường, đường kẻ ngăn, nhãn ô thống kê, ba biến thể màu của icon thống kê, và nhóm icon
   theo cỡ. Bộ biến ở đầu file cũng đang được dùng ở 11 chỗ trong chính 247 dòng đó. Xoá đi là trang
   hồ sơ admin mất chữ và mất màu. Không xoá, không đổi selector, không nâng độ ưu tiên. Bỏ qua
   hoàn toàn mục này.
2. KHÔNG gộp modal riêng của admin vào modal dùng chung ở src/components/ui/. Có 17 file đang import
   bản admin. Ngoài phạm vi lần này.
3. KHÔNG thay hàng loạt màu hex cứng trong Admin.css bằng biến. Rủi ro cao, lợi ích bằng không cho
   người dùng. Chỉ đụng tới màu nếu chính mục fix bên dưới yêu cầu.
4. KHÔNG đổi tên prop của các modal xác nhận cho đồng bộ với nhau. Không có lỗi thật, chỉ là churn.
5. KHÔNG sửa hàm tạo dữ liệu hồ sơ admin dự phòng trong tầng service. Nó có vấn đề thật nhưng nằm
   ngoài phạm vi UI, tôi xử lý riêng.

═══════════════════════════════════════════════════════════
FIX 1 — Lỗi tải thống kê thổi bay cả trang tổng quan
═══════════════════════════════════════════════════════════
1a. File: src/features/admin/pages/AdminDashboard.jsx (dòng 88-93 và 108-110)

Khối catch đặt một chuỗi lỗi cố định, KHÔNG dùng helper lấy thông điệp lỗi, nên lỗi 403 do bị hạ
quyền giữa phiên và lỗi 500 hiện ra chữ giống hệt nhau. Tệ hơn, nhánh lỗi thay thế TOÀN BỘ nội dung
trang, nên khối thao tác nhanh bên dưới cũng biến mất, dù nó chỉ là mấy liên kết tĩnh không phụ
thuộc API chút nào.

Sửa:
- Dùng helper lấy thông điệp lỗi từ src/services/apiClient (chỉ import, không sửa file đó), với câu
  mặc định giữ nguyên như hiện tại.
- Nếu lỗi là loại bị từ chối quyền, dùng thông điệp riêng mà apiClient đã có sẵn hằng số cho nó, và
  KHÔNG hiện nút thử lại, vì thử lại chắc chắn lại hỏng.
- Tách nhánh lỗi ra: chỉ lưới thẻ thống kê bị thay bằng khối lỗi, còn khối thao tác nhanh luôn hiển
  thị. Tự đọc file để biết chỗ nào là ranh giới.

1b. File: src/features/admin/pages/AdminProfile.jsx (hàm định dạng số thống kê và 4 ô thống kê)

Khi tải thống kê thất bại, bốn ô vẫn hiện số 0 ngay cạnh băng báo lỗi. Người quản trị đọc số 0 đó
thành sự thật.
Sửa: khi đang có lỗi thì bốn ô hiện dấu gạch ngang thay vì số 0.

═══════════════════════════════════════════════════════════
FIX 2 — Mỗi lần gõ phím tìm kiếm bắn thừa một request
═══════════════════════════════════════════════════════════
File: src/features/admin/components/ui/DataTable.jsx (dòng 116-127)

Trong chế độ phân trang phía server, hàm xử lý gõ tìm kiếm gọi callback đổi trang về 0. Nơi duy nhất
dùng chế độ đó là trang quản lý người dùng, và callback đó của nó gọi thẳng hàm tải danh sách. Nhưng
từ khoá tìm kiếm có độ trễ 300ms, nên request này luôn bắn đi kèm từ khoá CŨ. Trang quản lý người
dùng đã có sẵn một effect tự tải lại khi từ khoá đã trễ thay đổi, nên lời gọi này hoàn toàn thừa, và
còn tạo nguy cơ kết quả của truy vấn cũ về sau đè lên kết quả mới.

Sửa: bỏ lời gọi callback đổi trang trong nhánh chế độ server của hàm đó. Giữ nguyên nhánh chế độ
client. Tự xác nhận lại rằng trang quản lý người dùng là nơi duy nhất dùng chế độ server trước khi
sửa, và nói rõ trong báo cáo.

═══════════════════════════════════════════════════════════
FIX 3 — Hai mươi nút hành động giống hệt nhau với trình đọc màn hình
═══════════════════════════════════════════════════════════
File: src/features/admin/components/ui/RowActions.jsx (dòng 60-68)
File: src/features/admin/pages/AdminUsers.jsx (chỗ dựng cột hành động)

Nút mở menu hành động có nhãn mô tả cố định giống nhau ở mọi dòng. Trình đọc màn hình đọc hai mươi
nút y hệt, người dùng không biết nút nào thuộc về ai.

Sửa: thêm một prop nhãn mô tả cho component đó, mặc định giữ nguyên chuỗi hiện tại để các nơi dùng
khác không đổi hành vi. Ở trang quản lý người dùng thì truyền nhãn có kèm tên hiển thị hoặc tên đăng
nhập của dòng đó.
Trước khi sửa, tự tìm hết các nơi đang dùng component này và xác nhận không nơi nào vỡ.

═══════════════════════════════════════════════════════════
FIX 4 — Khoá dòng rỗng làm React ghép nhầm, xoá một mất nhiều
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminSkills.jsx (dòng 17, 109-111, 194)

Hàm lấy định danh kỹ năng trả về chuỗi rỗng khi thiếu cả hai tên trường. Chuỗi rỗng đó vừa làm khoá
dòng của bảng, vừa làm điều kiện lọc sau khi xoá. Hậu quả: nhiều dòng cùng khoá rỗng thì React ghép
nhầm, và xoá một kỹ năng không có định danh sẽ quét sạch MỌI dòng không có định danh khỏi giao diện.

Sửa:
- Khoá dòng: dùng định danh nếu có, không có thì rơi về một khoá dựa trên chỉ số dòng. Tự đọc chữ ký
  của prop khoá dòng trong DataTable để biết nó có nhận chỉ số hay không, nếu không nhận thì tự tính
  khoá khi dựng dữ liệu chứ ĐỪNG đổi chữ ký của DataTable.
- Lọc sau khi xoá: nếu định danh của mục đang xoá là rỗng thì đừng lọc theo định danh, hãy tải lại
  danh sách. Mục đích là không bao giờ xoá nhầm nhiều dòng.

═══════════════════════════════════════════════════════════
FIX 5 — Ảnh đại diện hỏng trong sidebar
═══════════════════════════════════════════════════════════
File: src/components/Sidebar/Sidebar.jsx (dòng 133-134)

Thẻ ảnh đại diện trong chân sidebar không có xử lý lỗi tải ảnh, nên đường dẫn chết cho ra biểu tượng
ảnh vỡ trong khung tròn. Thanh điều hướng admin cùng dự án đã làm đúng việc này rồi.

Sửa: thêm state đánh dấu ảnh lỗi và rơi về chữ cái đầu của tên hiển thị, đúng như nhánh khi không có
ảnh. Nhớ đặt lại cờ lỗi khi đường dẫn ảnh đổi.
Mẫu đúng để copy: src/features/admin/components/AdminNavbar.jsx, phần xử lý ảnh đại diện.
Lưu ý sidebar này dùng chung cho cả phía người dùng lẫn phía admin, nên tự kiểm cả hai.

═══════════════════════════════════════════════════════════
FIX 6 — Nâng quyền quản trị không hỏi lại một câu nào
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminUsers.jsx (hàm lưu vai trò, khoảng dòng 190-206)
File: src/features/admin/components/modals/AuthorizationModal.jsx

Bấm lưu trong modal phân quyền là đổi vai trò ngay. Nâng một tài khoản thường lên quản trị viên là
thao tác leo thang đặc quyền, vậy mà không có bước xác nhận nào, trong khi thao tác khoá tài khoản
nhẹ hơn và hoàn tác được thì lại có modal xác nhận hẳn hoi.

Sửa, chọn cách rẻ nhất trong hai cách sau và nêu rõ bạn chọn cách nào:
- Cách tối thiểu: trong modal phân quyền, hiện rõ một dòng so sánh vai trò hiện tại và vai trò sau
  khi lưu, và chỉ bật nút lưu khi hai giá trị khác nhau.
- Cách đầy đủ: thêm bước xác nhận khi vai trò mới khác vai trò hiện tại, dùng lại modal xác nhận
  hành động đã có sẵn trong cùng thư mục, câu hỏi phải nêu rõ tên người dùng và chiều đổi vai trò.
Không viết component modal mới. Không đổi hàm gọi API.

═══════════════════════════════════════════════════════════
CÁCH LÀM VÀ KIỂM CHỨNG
═══════════════════════════════════════════════════════════
- Làm lần lượt FIX 1 đến FIX 6, không gộp.
- FIX 2, 3, 4, 5 chạm component dùng chung. Với mỗi fix đó, liệt kê trong báo cáo TẤT CẢ nơi đang
  dùng và giải thích vì sao thay đổi không làm hỏng nơi nào.
- Xong tất cả thì chạy trong D:\study\quizcit\quizcit-web:
    npm run test
    npm run lint
    npm run build
  Cả ba phải sạch. Dán output thật vào báo cáo, không tóm tắt.
- Đừng cài thêm công cụ test hay browser automation nào.

BÁO CÁO CUỐI:
1. Bảng: Fix | File đã sửa | Số dòng thay đổi | Tóm tắt một câu.
2. Danh sách nơi dùng đã kiểm cho từng component dùng chung.
3. Output thật của test, lint, build.
4. Kịch bản kiểm tra tay cho từng fix, dạng "mở URL nào, làm gì, phải thấy gì".
5. Mục nào không làm được và vì sao. Không im lặng bỏ qua.
Không thay đổi bất cứ thứ gì ngoài 6 mục trên.
```
