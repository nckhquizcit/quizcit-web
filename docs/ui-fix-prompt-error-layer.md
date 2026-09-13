# Prompt sửa — tầng hiển thị lỗi

Báo cáo này là báo cáo tốt nhất từ đầu tới giờ. Nó chạy trình duyệt thật, tái hiện được lỗi,
và tự bác bỏ giả thuyết của chính nó khi thực tế không khớp (mục "trắng trang" và mục toast chồng).
Tôi kiểm chứng lại 7 BLOCKER trong mã nguồn: **6 cái đúng**, 1 cái đã được sửa đúng từ trước
mà báo cáo hiểu nhầm thành lỗi.

Nặng nhất là FIX 1 — và đó là lỗi **do bản vá vòng trước của tôi gây ra**. Bước xác nhận đổi vai
trò được thêm vào nhưng nối dây sai, nên giờ nút Lưu không làm gì cả, và còn mở ra một đường cấp
nhầm quyền quản trị. Ưu tiên số một.

Copy nguyên khối dưới đây cho agent.

```
Bạn sửa 6 lỗi trong frontend React tại D:\study\quizcit\quizcit-web
(Vite + React Router 6, JSX thuần, CSS theo component).

PHẠM VI CỨNG:
- Chỉ sửa trong src/. KHÔNG đụng backend D:\study\quizcit\quizcit-backend.
- KHÔNG đổi hợp đồng API. KHÔNG sửa src/services/. Nếu một fix có vẻ cần sửa src/services/
  thì DỪNG và báo cáo — mọi fix dưới đây đều đã được thiết kế để không cần đụng vào đó.
- KHÔNG sửa file tài liệu nào. Không thêm dependency. Không đổi bảng màu.
- Làm đúng 6 mục dưới, không hơn.
- Giữ phong cách code hiện có: comment tiếng Việt không dấu như các file đang viết.

SÁU VIỆC CẤM LÀM, DÙ CÓ NGUỒN NÀO BẢO BẠN LÀM:
1. KHÔNG sửa hàm ánh xạ người dùng trong src/services/mappers.js. Đúng là giá trị mặc định của
   trường vai trò trong đó là gốc rễ của FIX 2, nhưng hàm đó còn phục vụ nhiều nơi khác và giá
   trị mặc định ở đó là có chủ đích. FIX 2 chặn ở tầng giao diện là đủ và an toàn hơn.
2. KHÔNG thêm thời gian chờ tối đa cho lời gọi mạng. Chỗ đặt là src/services/, ngoài phạm vi.
   Ghi vào mục "không làm được" của báo cáo cuối.
3. KHÔNG viết lại hệ thống toast, KHÔNG di chuyển nơi đặt nhà cung cấp toast, KHÔNG thêm giới
   hạn số toast hay cơ chế gộp toast trùng. Báo cáo đã thử và KHÔNG tái hiện được cảnh toast
   chồng lên nhau: các modal đang báo lỗi inline và giữ modal mở, đó là cách làm đúng.
4. KHÔNG đụng vào nhánh 403 của trang tổng quan quản trị. Có ý kiến nói nhánh đó thiếu nút thử
   lại. Đó là CỐ Ý và trong mã đã có comment giải thích: bị hạ quyền giữa phiên thì thử lại chắc
   chắn hỏng tiếp. Chính báo cáo đó khen cùng một cách làm ở trang kết quả bài kiểm tra. Để yên.
5. KHÔNG sửa file đặc tả API, KHÔNG sửa lệch giữa đặc tả và mã. Báo cáo đã xác nhận giao diện
   đang đọc ĐÚNG, chỉ có tài liệu lỗi thời. Đó là việc của tài liệu, ngoài phạm vi.
6. KHÔNG đụng vào chống trôi dữ liệu cũ khi tìm kiếm ở trang danh sách người dùng. Lỗi đó có
   thật, tôi đã xác nhận, nhưng FIX 1 đã sửa khá nhiều trong đúng file đó rồi. Trộn thêm vào sẽ
   khó soát. Để riêng lần sau.

═══════════════════════════════════════════════════════════
FIX 1 — Đổi vai trò: bấm Lưu không làm gì, và có đường cấp nhầm quyền
═══════════════════════════════════════════════════════════
File: src/features/admin/pages/AdminUsers.jsx (khoảng dòng 154-215, và khu vực khai báo các modal
      khoảng dòng 461-501)
File: src/features/admin/components/modals/AuthorizationModal.jsx (khoảng dòng 29-38)

Đây là lỗi nặng nhất toàn dự án. Có hai triệu chứng, chung một nguyên nhân.

Nguyên nhân: hàm lưu của modal cấp quyền gọi hàm lưu của trang rồi LUÔN LUÔN gọi tiếp hàm đóng
modal. Trong khi đó hàm lưu của trang, khi phát hiện vai trò có thay đổi, lại cố ý KHÔNG đóng
modal mà chỉ bật cờ mở modal xác nhận rồi thoát sớm, để chờ người dùng xác nhận. Hai bên đá nhau.

Diễn biến thật:
- Hàm lưu của trang bật cờ mở modal xác nhận rồi thoát.
- Quyền điều khiển quay về modal cấp quyền, nó gọi hàm đóng.
- Hàm đóng vừa hạ cờ modal cấp quyền, VỪA xoá luôn biến người dùng đang chọn — biến này lại là
  biến DÙNG CHUNG mà modal xác nhận vai trò cũng đang đọc.
- Modal xác nhận nhận người dùng rỗng nên nó tự trả về một modal đóng. Không có gì hiện ra.
- Hàm xử lý xác nhận cũng chặn ngay vì không còn người dùng.

Kết quả người dùng thấy: chọn vai trò, bấm Lưu, modal đóng lại, KHÔNG có hộp xác nhận, KHÔNG có
lời gọi API, KHÔNG có thông báo lỗi. Quản trị viên đinh ninh là đã lưu xong. Dòng gợi ý trong
form còn ghi rõ "sẽ đổi ... sau khi lưu" nên càng tin.

Triệu chứng thứ hai, nguy hiểm hơn: vì hàm đóng modal xác nhận vai trò KHÔNG BAO GIỜ chạy, nên cờ
mở nó và vai trò đang chờ vẫn còn bật. Lát sau quản trị viên mở "Khoá tài khoản" cho một người
khác, biến người dùng đang chọn được gán lại, và lúc đó CẢ HAI modal xác nhận cùng hiện ra chồng
lên nhau. Cái nằm trên là xác nhận ĐỔI VAI TRÒ, mang vai trò chờ cũ nhưng áp lên người dùng MỚI.
Bấm "Có" là cấp quyền quản trị nhầm người.

Sửa, theo đúng thứ tự này:
- Tách một biến trạng thái RIÊNG để giữ người dùng đang chờ đổi vai trò. Không dùng chung biến
  người dùng đang chọn nữa, vì biến đó bị các luồng khác xoá.
- Khi bàn giao sang bước xác nhận thì gán biến riêng đó, đồng thời cho phép modal cấp quyền đóng
  lại bình thường. Modal xác nhận phải đọc biến riêng, không đọc biến dùng chung.
- Hàm đóng modal xác nhận vai trò phải dọn SẠCH cả vai trò đang chờ lẫn người dùng đang chờ.
- Hàm xử lý xác nhận cũng đọc biến riêng đó.
- Tự kiểm lại bằng tay: sau khi huỷ ở bước xác nhận, mở "Khoá tài khoản" cho người khác thì chỉ
  được hiện ĐÚNG MỘT hộp thoại.
Đừng bỏ bước xác nhận. Đừng cho gọi API thẳng từ modal cấp quyền.

═══════════════════════════════════════════════════════════
FIX 2 — Một phản hồi hỏng khoá vĩnh viễn tài khoản quản trị
═══════════════════════════════════════════════════════════
File: src/features/admin/components/AdminNavbar.jsx (khoảng dòng 21-30)
File: src/layouts/MainLayout.jsx (khoảng dòng 56-65)
File: src/routes/index.jsx (thành phần trang từ chối truy cập, khoảng dòng 60-67)

Cả hai layout đều có một effect lúc mở trang: gọi API lấy thông tin người dùng hiện tại, rồi
trộn kết quả vào phiên đã lưu trong trình duyệt. Điều kiện bảo vệ chỉ kiểm tra kết quả có "tồn
tại" hay không.

Vấn đề: hàm ánh xạ người dùng LUÔN trả về một đối tượng đầy đủ, kể cả khi dữ liệu vào rỗng, và
trong đối tượng đó vai trò có giá trị mặc định là người dùng thường. Đối tượng thì luôn được coi
là tồn tại. Nên chỉ cần máy chủ trả về một phản hồi 200 có thân rỗng, thân HTML, hay thiếu trường
dữ liệu, là vai trò quản trị trong phiên bị ghi đè thành người dùng thường. Từ đó bộ bảo vệ tuyến
đường đá sang trang từ chối truy cập, và API có khôi phục cũng KHÔNG tự khỏi vì giá trị hỏng đã
nằm trong bộ nhớ trình duyệt.

Sửa:
- Ở cả hai chỗ, đổi điều kiện bảo vệ sang kiểm tra kết quả có mã định danh người dùng thật hay
  không, thay vì chỉ kiểm tra đối tượng tồn tại. Tự đọc hàm ánh xạ để lấy đúng tên trường mã định
  danh, đừng đoán. KHÔNG sửa hàm ánh xạ.
- Trang từ chối truy cập hiện là ngõ cụt: không có một liên kết hay nút nào để đi tiếp. Thêm một
  lối thoát rõ ràng, tối thiểu là đăng xuất để đăng nhập lại. Không tự viết component mới, dùng
  thành phần nút và liên kết đã có sẵn.

═══════════════════════════════════════════════════════════
FIX 3 — Lỗi render ném ra trang lỗi tiếng Anh kèm dấu vết gỡ rối
═══════════════════════════════════════════════════════════
File: src/components/ui/ErrorBoundary/ErrorBoundary.jsx (TẠO MỚI)
File: src/components/ui/index.js
File: src/main.jsx
File: src/routes/index.jsx

Không có lớp chặn lỗi render nào trong dự án, và không tuyến đường nào khai báo phần tử lỗi
riêng. Lưu ý: KHÔNG phải trắng trang — báo cáo đã ép lỗi và chụp lại được. Thứ hiện ra là trang
lỗi mặc định của thư viện định tuyến, bằng TIẾNG ANH, kèm dấu vết gỡ rối và đường dẫn nội bộ, và
nó thay thế cả cây tuyến đường nên mất luôn thanh bên và thanh trên. Không có nút nào để quay lại.

Sửa:
- Tạo component chặn lỗi dạng class, có cả hai móc vòng đời chuẩn của React cho việc này. Khi có
  lỗi thì render thành phần báo lỗi đã có sẵn trong thư viện dùng chung, với chữ tiếng Việt và
  một nút tải lại trang. TUYỆT ĐỐI không in thông điệp lỗi gốc hay dấu vết gỡ rối ra màn hình.
- Xuất nó theo đúng quy ước của file tổng hợp thành phần dùng chung.
- Bọc ở hai tầng:
  a) Ngoài cùng trong điểm khởi động ứng dụng, bọc quanh nhà cung cấp định tuyến. Đây là lưới an
     toàn cuối. Phần hiển thị ở tầng này phải tự chứa, không phụ thuộc file CSS nào có thể chưa
     tải kịp.
  b) Trong ba bố cục (bố cục chính, bố cục xác thực, bố cục quản trị), bọc quanh chỗ render nội
     dung tuyến đường con. Tầng này giữ được thanh bên và thanh trên khi một trang hỏng.
- Tầng trong bố cục phải được gắn khoá thay đổi theo đường dẫn hiện tại, để người dùng bấm sang
  trang khác là tự thoát khỏi màn hình lỗi. Không có nó thì người dùng kẹt luôn.
- Tự đọc để lấy đúng cách lấy đường dẫn hiện tại mà các file đó đang dùng.

═══════════════════════════════════════════════════════════
FIX 4 — Bảng ngân hàng câu hỏi bị cắt cứng trên màn hình nhỏ
═══════════════════════════════════════════════════════════
File: src/features/admin/Admin.css (dòng 4681-4683, khối media query khoảng dòng 1718-1735,
      và khối bao ngoài khoảng dòng 1106)

Trong khối media query cho màn hình nhỏ, bảng câu hỏi đã được đặt lại về không có chiều rộng tối
thiểu. Nhưng MÃI SAU ĐÓ, ở khoảng dòng 4682, có một khai báo đặt chiều rộng tối thiểu 860px nằm
NGOÀI mọi media query. Media query không làm tăng độ ưu tiên chọn lựa, nên khai báo đứng sau
thắng, kể cả trên màn hình 360px.

Cộng thêm: khối bao ngoài bảng đang cắt phần tràn, còn khối bọc trong lại được đặt cho tràn ra
tự do trong media query. Kết quả là bảng rộng 860px nằm trong khung 330px, bị cắt cứng và KHÔNG
cuộn ngang được. Không đọc được nội dung câu hỏi, không bấm được nút ở cột cuối.

Sửa: làm sao cho trên màn hình nhỏ bảng KHÔNG còn bị ép chiều rộng tối thiểu, và nếu vẫn còn rộng
hơn khung thì phải CUỘN NGANG được thay vì bị cắt. Giữ nguyên hiển thị trên màn hình lớn.
Tự đọc để chọn cách ít rủi ro nhất. TUYỆT ĐỐI KHÔNG sắp xếp lại thứ tự các khối trong file này —
nó dài hơn 7000 dòng và việc đó sẽ phá thứ tự tầng của nhiều thứ khác.
Kiểm ở cả ba bề rộng 1280, 768 và 360.

═══════════════════════════════════════════════════════════
FIX 5 — Hai bẫy bàn phím
═══════════════════════════════════════════════════════════
5a. File: src/components/Sidebar/Sidebar.css (khối media query cho ngăn kéo di động, khoảng dòng
    299-315)
    Ngăn kéo khi đóng chỉ được đẩy ra ngoài màn hình bằng phép dịch chuyển. Nó vẫn nằm trong cây
    tài liệu và vẫn nhận được tiêu điểm. Người dùng bấm Tab trên màn hình nhỏ sẽ rơi vào 5 mục
    điều hướng VÔ HÌNH nằm ngoài khung nhìn, không biết tiêu điểm đang ở đâu.
    Sửa: khi ngăn kéo đang đóng ở bề rộng di động, làm cho nó không còn nhận tiêu điểm được nữa,
    và phải bảo đảm hiệu ứng trượt lúc mở ra vẫn mượt như cũ. Chỉ sửa CSS nếu làm được bằng CSS.
    KHÔNG đổi cấu trúc component thanh bên.

5b. File: src/features/admin/components/ui/RowActions.jsx (khoảng dòng 26-46)
    Menu hành động trên từng dòng bảng có bắt sự kiện nhấn chuột ra ngoài, cuộn và đổi cỡ cửa sổ
    để đóng, nhưng KHÔNG bắt phím Escape. Menu lại được render qua cổng ra ngoài cây nên tiêu điểm
    không tự đi vào. Người dùng chỉ dùng bàn phím không mở rồi thao tác được: không đổi vai trò,
    không đặt lại mật khẩu, không khoá, không xoá.
    Sửa: thêm đóng menu bằng phím Escape, và khi đóng bằng Escape thì trả tiêu điểm về đúng nút
    đã mở menu. Khi menu vừa mở thì đưa tiêu điểm vào mục đầu tiên trong menu.
    Đừng đổi cách định vị menu, đừng bỏ cổng render.

═══════════════════════════════════════════════════════════
FIX 6 — Thông điệp lỗi tiếng Anh và dữ liệu lạ lọt ra màn hình
═══════════════════════════════════════════════════════════
File: src/components/ui/ErrorState/ErrorState.jsx

Khi máy chủ trả lỗi 500 mà thân phản hồi không có trường thông điệp, hoặc trả về một trang HTML,
thì chuỗi lọt tới giao diện là thông điệp gốc của thư viện gọi mạng, bằng tiếng Anh. Báo cáo xác
nhận trên 8 trên 8 màn hình đã thử. Cùng đường đó, nếu thân phản hồi là HTML thì cả khối HTML thô
bị đổ vào phần mô tả, và nếu trường thông điệp lại là một đối tượng thì React ném lỗi render.

Nguồn gốc nằm ở src/services/ và ĐANG BỊ CẤM sửa. Nên dựng lá chắn ngay trong thành phần báo lỗi
dùng chung — đây là nơi phần lớn màn hình đi qua.

Sửa: ngay trước khi render phần mô tả, lọc giá trị nhận được:
- Không phải chuỗi thì bỏ, dùng câu mô tả mặc định sẵn có.
- Trông như HTML thì bỏ, thay bằng câu tiếng Việt theo hướng: máy chủ trả về dữ liệu không hợp lệ,
  vui lòng thử lại sau.
- Trông như thông điệp tiếng Anh của thư viện gọi mạng thì bỏ, thay bằng câu tiếng Việt theo
  hướng: máy chủ đang gặp sự cố, vui lòng thử lại sau.
- Chuỗi rỗng hoặc chỉ có khoảng trắng thì dùng câu mặc định sẵn có.
Viết gọn trong chính file này, đừng tạo file tiện ích mới, đừng đổi danh sách prop của component.

Lưu ý trung thực trong báo cáo: lá chắn này KHÔNG phủ được các chỗ render thẳng biến lỗi ra JSX
mà không đi qua thành phần này. Những chỗ đó nằm ngoài phạm vi lần này, đừng đụng tới, nhưng hãy
liệt kê chúng ở cuối báo cáo để lần sau xử lý.

═══════════════════════════════════════════════════════════
CÁCH LÀM VÀ KIỂM CHỨNG
═══════════════════════════════════════════════════════════
- Làm lần lượt FIX 1 đến FIX 6, không gộp.
- FIX 1 và FIX 2 chạm đường phân quyền. Với mỗi cái, nêu rõ trong báo cáo đường đi cũ hỏng ở đâu
  và đường đi mới chặn ở đâu.
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
   Riêng FIX 1 phải có hai kịch bản: một chứng minh đổi vai trò giờ hiện đúng hộp xác nhận và
   gọi API; một chứng minh sau khi HUỶ ở bước xác nhận rồi mở "Khoá tài khoản" cho người khác thì
   chỉ hiện đúng một hộp thoại, và là hộp khoá tài khoản.
   Riêng FIX 2 phải có kịch bản chứng minh phản hồi 200 thân rỗng KHÔNG còn hạ quyền phiên.
   Riêng FIX 4 phải nêu kết quả ở cả ba bề rộng 1280, 768, 360.
4. Danh sách các chỗ render thẳng biến lỗi ra JSX mà FIX 6 không phủ được.
5. Mục nào không làm được và vì sao. Không im lặng bỏ qua.
Không thay đổi bất cứ thứ gì ngoài 6 mục trên.
```
