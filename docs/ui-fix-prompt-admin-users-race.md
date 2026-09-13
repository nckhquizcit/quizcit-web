# Prompt sửa — trôi dữ liệu cũ ở danh sách người dùng

Lỗi này đã được hai đợt audit độc lập xác nhận, và tôi kiểm lại trong mã: hàm tải danh sách người
dùng là hàm DUY NHẤT trong trang không có chốt chống trôi, trong khi các trang học sinh đều đã có.
Sửa đúng một hàm là bịt được cả sáu nơi gọi nó.

Copy nguyên khối dưới đây cho agent.

```
Bạn sửa 2 lỗi trong trang quản lý người dùng của frontend React tại D:\study\quizcit\quizcit-web
(Vite + React Router 6, JSX thuần).

PHẠM VI CỨNG:
- Chỉ sửa đúng một file: src/features/admin/pages/AdminUsers.jsx.
- KHÔNG đụng backend D:\study\quizcit\quizcit-backend. Không đổi hợp đồng API.
- KHÔNG sửa src/services/. KHÔNG sửa src/features/admin/utils/adminUsersLogic.js.
- Không thêm dependency. Không sửa file tài liệu nào.
- Làm đúng 2 mục dưới, không hơn.
- Giữ phong cách code hiện có: comment tiếng Việt không dấu như file này đang viết.

NĂM VIỆC CẤM LÀM:
1. KHÔNG xoá trắng danh sách và số liệu mỗi khi BẮT ĐẦU một lượt tải mới. Có ý kiến đề nghị vậy.
   Làm thế thì bảng nháy rỗng mỗi lần gõ một phím và mỗi lần đổi trang, tệ hơn lỗi đang sửa.
   Dữ liệu cũ chỉ được dọn ở đúng nhánh lỗi, xem FIX 2.
2. KHÔNG dùng cơ chế huỷ request của trình duyệt. Nó phải đi qua tầng gọi API trong src/services/,
   đang bị cấm. Chốt bằng số thứ tự lượt tải ở tầng component là đủ và đúng phạm vi.
3. KHÔNG đụng vào bộ đếm hoãn 300ms của ô tìm kiếm. Nó đang chạy đúng, không phải nguyên nhân.
4. KHÔNG đụng vào nhánh dự phòng lọc phía client (nhánh chạy khi backend chưa lọc). Logic của nó
   đúng, chỉ thiếu chốt chống trôi như phần còn lại.
5. KHÔNG chuyển hàm tải thành effect, KHÔNG gộp các nơi gọi nó lại. Sáu nơi gọi hiện tại đều hợp
   lệ và đều được hưởng lợi từ cùng một chốt.

═══════════════════════════════════════════════════════════
FIX 1 — Kết quả của lượt tải cũ ghi đè lượt tải mới
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminUsers.jsx (hàm tải danh sách người dùng, khoảng dòng 76-143)

Hàm này gọi API rồi ghi thẳng kết quả vào state, KHÔNG kiểm tra xem lượt tải của mình còn là lượt
mới nhất hay không. Các trang phía học sinh đều đã có chốt này, riêng đây thì thiếu.

Hậu quả đo được: gõ "a" rồi "ab" rồi "abc", ba lời gọi bay đi, lời nào về sau thì ghi state sau,
bất kể gửi trước hay sau. Bảng hiện kết quả của "a" trong khi ô tìm kiếm đang là "abc". Đổi bộ lọc
vai trò hoặc trạng thái, hay bấm nhanh sang trang 2 rồi trang 3, đều dính y hệt.

Trong hàm có HAI điểm chờ API chứ không phải một: lời gọi chính, và lời gọi thứ hai trong nhánh
dự phòng lọc phía client. Cửa sổ đua vì thế rộng hơn bình thường.

Sửa:
- Thêm một ô tham chiếu giữ số thứ tự lượt tải, và trong hàm tải thì cấp một số riêng cho mỗi lượt
  ngay khi bắt đầu, kèm một hàm nhỏ kiểm tra lượt này còn là lượt mới nhất không.
- Kiểm chốt đó SAU MỖI điểm chờ API, trước khi ghi bất kỳ state nào. Không còn mới nhất thì thoát
  im lặng, không ghi gì cả.
- Chốt phải phủ đủ BA đường ra, đây là chỗ dễ sót nhất:
  a) đường thành công của nhánh dự phòng lọc phía client,
  b) đường thành công của nhánh backend đã lọc sẵn,
  c) khối bắt lỗi — một lượt cũ hỏng mà không chốt thì sẽ dựng màn báo lỗi đè lên dữ liệu mới vừa
     tải xong.
- Khối dọn dẹp cuối hàm đang tắt cờ đang tải. Chỗ này CŨNG phải chốt: lượt cũ về muộn mà tắt cờ
  thì skeleton biến mất trong khi lượt mới vẫn đang chạy, bảng đứng im như đã tải xong.
- Copy đúng cách làm đã có sẵn ở src/features/home/pages/HomePage/HomePage.jsx, phần đầu hàm tải
  dữ liệu. Dùng cùng tên biến và cùng lối viết để người sau đọc thấy quen.
Tự đọc danh sách import đầu file: móc React cần dùng cho ô tham chiếu hiện CHƯA được import, nhớ
thêm vào.

═══════════════════════════════════════════════════════════
FIX 2 — Số tổng tài khoản cũ đứng ngay trên thông báo lỗi
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminUsers.jsx (ô thống kê khoảng dòng 367-377, nhánh lỗi khoảng
dòng 384-386, khối bắt lỗi của hàm tải khoảng dòng 137-139)

Ô thống kê "Tổng tài khoản" nằm NGOÀI nhánh điều kiện lỗi, nên nó vẫn hiển thị. Khi tải hỏng, số
của lần tải thành công trước đó vẫn đứng nguyên, ngay phía trên tấm báo lỗi "không tải được danh
sách". Người dùng thấy một con số cụ thể cạnh một thông báo nói rằng không lấy được dữ liệu.

Sửa: trong khối bắt lỗi của hàm tải, ngoài việc đặt thông điệp lỗi như hiện tại, dọn luôn danh
sách và số liệu phân trang về trạng thái rỗng. Trong file đã có sẵn một hằng số mô tả trạng thái
phân trang rỗng, tự đọc để dùng lại, đừng viết lại giá trị bằng tay.
Việc dọn này cũng phải nằm sau chốt của FIX 1, không được để lượt cũ hỏng dọn mất dữ liệu mới.
KHÔNG đổi bố cục, KHÔNG chuyển ô thống kê vào trong nhánh lỗi, KHÔNG đổi chữ.

═══════════════════════════════════════════════════════════
CÁCH LÀM VÀ KIỂM CHỨNG
═══════════════════════════════════════════════════════════
- Làm FIX 1 trước, FIX 2 sau. FIX 2 phụ thuộc chốt của FIX 1.
- Xong thì chạy trong D:\study\quizcit\quizcit-web:
    npm run test
    npm run lint
    npm run build
  Cả ba phải sạch. Dán output thật vào báo cáo, không tóm tắt.
- Đừng cài thêm công cụ test hay browser automation nào.

BÁO CÁO CUỐI:
1. Liệt kê ĐẦY ĐỦ các điểm bạn đã đặt chốt, mỗi điểm một dòng dạng "dòng bao nhiêu — chốt cho
   đường nào". Phải có đủ bốn đường: hai đường thành công, khối bắt lỗi, khối dọn dẹp cuối.
2. Output thật của test, lint, build.
3. git diff --stat, phải chỉ có đúng một file.
4. Kịch bản kiểm tra tay:
   - Gõ nhanh vào ô tìm kiếm một chuỗi nhiều ký tự, kết quả cuối phải khớp chuỗi đang gõ.
   - Bấm nhanh trang 2 rồi trang 3, bảng phải dừng ở trang 3.
   - Làm cho lượt tải hỏng, phải thấy ô "Tổng tài khoản" về 0 chứ không giữ số cũ.
   - Chứng minh trường hợp NGƯỢC LẠI vẫn đúng: tải bình thường một lần, bảng và số liệu vẫn hiện
     đầy đủ, skeleton vẫn tắt đúng lúc.
5. Mục nào không làm được và vì sao. Không im lặng bỏ qua.
Không thay đổi bất cứ thứ gì ngoài 2 mục trên.
```
