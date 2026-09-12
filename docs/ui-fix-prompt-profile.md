# Prompt sửa — trang hồ sơ và modal cắt ảnh

Báo cáo audit cụm này chất lượng khá, chỉ một mục MINOR sai. Đã loại.
Fix 3 và 4 nằm trong component dùng chung `ImageCropModal`, có 3 nơi xài, nên sửa một lần ăn cả ba.
Copy nguyên khối dưới đây cho agent.

```
Bạn sửa 5 lỗi trong trang hồ sơ và modal cắt ảnh của frontend React tại D:\study\quizcit\quizcit-web
(Vite + React Router 6, JSX thuần, CSS theo component).

PHẠM VI CỨNG:
- Chỉ sửa trong src/features/profile/ và src/components/ui/ImageCropModal/.
- KHÔNG đụng backend D:\study\quizcit\quizcit-backend. Không đổi hợp đồng API.
- KHÔNG sửa src/services/. Nếu một fix có vẻ cần sửa chỗ đó thì dừng và báo cáo.
- KHÔNG sửa API_SPEC.md hay bất kỳ file tài liệu nào. Tài liệu đó đã lỗi thời so với backend,
  nhưng sửa tài liệu không thuộc việc lần này.
- Không thêm dependency. Không đổi bảng màu.
- Làm đúng 5 mục dưới, không hơn.
- Giữ phong cách code hiện có: comment tiếng Việt, class theo CSS_STYLE_GUIDE.md.

HAI VIỆC CẤM LÀM:
1. Có ý kiến nói mức phóng to trong modal cắt ảnh không được đặt lại khi mở lại cùng một ảnh.
   SAI. Effect đặt lại phụ thuộc vào cả cờ mở modal, đóng rồi mở lại là cờ đó đổi giá trị nên
   effect chạy lại và đặt lại đầy đủ. Đừng thêm prop key, đừng thêm code đặt lại lần hai.
2. Đừng gỡ hay viết lại phần chặn phím Escape trong modal cắt ảnh. Nó đang cố ý bắt ở pha capture
   và chặn lan truyền để không đóng nhầm modal cha. Đó là code đúng. Fix 3 chỉ THÊM xử lý phím Tab.

═══════════════════════════════════════════════════════════
FIX 1 — Lỗi tải ảnh lên bị nuốt hoàn toàn
═══════════════════════════════════════════════════════════
File: src/features/profile/pages/ProfilePage/ProfilePage.jsx (dòng 192-201)

Hàm xử lý sau khi cắt ảnh chỉ có try và finally, KHÔNG có catch. Khi tải ảnh lên thất bại vì file
quá lớn, server lỗi, hay mất mạng, khối finally vẫn tắt trạng thái chờ, modal cắt ảnh vẫn tự đóng,
ảnh đại diện giữ nguyên ảnh cũ, và không có một thông báo nào. Người dùng tin là đã đổi ảnh thành công.

Sửa: thêm nhánh catch, đặt thông báo lỗi vào đúng state lỗi của form mà file này đang dùng, với câu
mặc định theo hướng không tải được ảnh lên và mời thử lại. Dùng đúng helper lấy thông điệp lỗi mà
file này đã import sẵn.
Lưu ý: hàm tải ảnh trong tầng service đã bọc lỗi thành Error thường nên không còn trường mã trạng
thái HTTP. Đừng viết nhánh phân loại theo mã lỗi, và đừng sửa tầng service.
Mẫu đúng để tham khảo: src/components/ui/SubjectImageField/SubjectImageField.jsx khoảng dòng 122-127.

═══════════════════════════════════════════════════════════
FIX 2 — Ảnh đại diện hỏng hiện icon ảnh vỡ
═══════════════════════════════════════════════════════════
File: src/features/profile/pages/ProfilePage/ProfilePage.jsx (dòng 377-381 và dòng 483-487)

Cả hai chỗ render ảnh đại diện đều không có xử lý sự kiện lỗi tải ảnh. Đường dẫn ảnh chết hoặc 404
sẽ cho ra biểu tượng ảnh vỡ của trình duyệt nằm trong khung tròn.

Sửa: thêm state đánh dấu ảnh lỗi, gắn xử lý lỗi tải ảnh cho cả hai thẻ ảnh, khi lỗi thì rơi về chữ
cái đầu của tên hiển thị đúng như nhánh khi không có ảnh. Nhớ đặt lại cờ lỗi khi đường dẫn ảnh đổi,
nếu không tải ảnh mới thành công vẫn bị kẹt ở chữ cái đầu.
Mẫu đúng để tham khảo: src/layouts/MainLayout.jsx dòng 151-157.

═══════════════════════════════════════════════════════════
FIX 3 — Modal cắt ảnh không giữ tiêu điểm bàn phím
═══════════════════════════════════════════════════════════
File: src/components/ui/ImageCropModal/ImageCropModal.jsx (dòng 40-62 và 104-112)

CẢNH BÁO: component này có 3 nơi dùng, sửa là ảnh hưởng cả ba. Tự đọc cả ba trước khi sửa:
  src/features/profile/pages/ProfilePage/ProfilePage.jsx
  src/components/ui/SubjectImageField/SubjectImageField.jsx
  src/features/admin/components/modals/AdminEditProfileModal.jsx
Chỉ được sửa bên trong ImageCropModal, không sửa ba file kia. Không đổi danh sách prop.

Modal này chỉ chặn phím Escape và khoá cuộn nền, KHÔNG có xử lý phím Tab. Đi bằng Tab sẽ thoát khỏi
hộp thoại ra sidebar và thanh trên nằm sau lớp phủ, người dùng bàn phím lạc mất modal. Đóng modal
cũng không trả tiêu điểm về nút đã mở nó.

Sửa: thêm xử lý phím Tab để vòng tiêu điểm trong hộp thoại, và lưu phần tử đang có tiêu điểm lúc mở
rồi trả tiêu điểm về đó lúc dọn dẹp.
Copy nguyên cách làm đã có ở src/components/ui/Modal/Modal.jsx dòng 53-76. Đừng tự nghĩ cách khác.
Lưu ý phần tử có thể focus trong modal này thay đổi theo trạng thái xử lý, nên phải lấy danh sách
phần tử ngay lúc nhấn phím chứ không phải một lần lúc mở.

═══════════════════════════════════════════════════════════
FIX 4 — Hai lỗi CSS trong modal cắt ảnh
═══════════════════════════════════════════════════════════
File: src/components/ui/ImageCropModal/ImageCropModal.css

4a. Dòng 131 và dòng 164 dùng một biến màu viền không hề được khai báo ở đâu trong dự án. Tôi đã tìm
    toàn bộ src, biến đó chỉ được DÙNG 2 lần và KHAI BÁO 0 lần, lại không có giá trị dự phòng, nên
    thuộc tính đó vô hiệu và viền không đổi màu khi rê chuột.
    Sửa: đổi sang biến viền đậm đã có sẵn trong src/styles/tokens.css dòng 23. Tự đọc để lấy đúng tên.

4b. Dòng 13-25: hộp thoại không có giới hạn chiều cao và lại đang cắt phần tràn, trong khi lớp phủ
    canh giữa và không cuộn được. Vùng cắt ảnh ở dòng 84-90 cố định 360px không có media query.
    Trên màn hẹp hoặc điện thoại nằm ngang, tổng chiều cao vượt màn hình và nút áp dụng cắt ảnh bị
    đẩy ra ngoài, không bấm được.
    Sửa: đặt giới hạn chiều cao cho hộp thoại theo chiều cao khung nhìn trừ một khoảng đệm, cho vùng
    cắt ảnh co lại theo khung nhìn thay vì cố định, và cho phần giữa cuộn dọc được. Header và footer
    phải luôn nhìn thấy.
    Mẫu tham khảo giới hạn chiều cao: src/components/ui/Modal/Modal.css dòng 17.
    Tự kiểm tra ở bề rộng 360px và ở màn 400px chiều cao.

═══════════════════════════════════════════════════════════
FIX 5 — Hai chốt nhỏ
═══════════════════════════════════════════════════════════
5a. File: src/features/profile/pages/ProfilePage/ProfilePage.jsx (dòng 149-152)
    Luồng đổi email lấy mã phiên từ phản hồi mà không kiểm tra có hay không. Nếu phản hồi thiếu
    trường đó, các bước sau gửi đi giá trị rỗng, backend trả lỗi, giao diện chuyển sang trạng thái
    hết hạn và người dùng chỉ còn nút bắt đầu lại, bấm bao nhiêu lần cũng vậy.
    Sửa: nếu phản hồi không có mã phiên thì chuyển thẳng sang trạng thái thất bại kèm câu thông báo
    theo hướng không nhận được phiên xác thực, mời thử lại. Không đổi luồng gọi API.

5b. File: src/features/profile/pages/ProfilePage/ProfilePage.css (dòng 75-79)
    Tên hiển thị tối đa 100 ký tự và người dùng có thể nhập liền không khoảng trắng. Selector này
    thiếu quy tắc ngắt dòng nên chuỗi dài tràn ngang khỏi thẻ ở màn hẹp.
    Sửa: thêm quy tắc ngắt dòng ở mọi vị trí, y như cách hai selector bên dưới trong cùng file đã làm.

═══════════════════════════════════════════════════════════
CÁCH LÀM VÀ KIỂM CHỨNG
═══════════════════════════════════════════════════════════
- Làm lần lượt FIX 1 đến FIX 5, không gộp.
- Xong tất cả thì chạy trong D:\study\quizcit\quizcit-web:
    npm run test
    npm run lint
    npm run build
  Cả ba phải sạch. Dán output thật vào báo cáo, không tóm tắt.
- Riêng FIX 3 và FIX 4 chạm component dùng chung: nêu rõ trong báo cáo bạn đã đọc cả ba nơi dùng và
  vì sao thay đổi không làm hỏng nơi nào.
- Đừng cài thêm công cụ test hay browser automation nào.

BÁO CÁO CUỐI:
1. Bảng: Fix | File đã sửa | Số dòng thay đổi | Tóm tắt một câu.
2. Output thật của test, lint, build.
3. Kịch bản kiểm tra tay cho từng fix, dạng "mở URL nào, làm gì, phải thấy gì".
4. Mục nào không làm được và vì sao. Không im lặng bỏ qua.
Không thay đổi bất cứ thứ gì ngoài 5 mục trên.
```
