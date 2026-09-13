# Prompt sửa — dọn hai chỗ sót của vòng tầng lỗi

Vòng trước làm đúng cả 6 mục, test/lint/build đều sạch. Chỉ còn hai chỗ nhỏ, mỗi chỗ một dòng.
Copy nguyên khối dưới đây cho agent.

```
Bạn dọn 2 chỗ sót trong frontend React tại D:\study\quizcit\quizcit-web.

PHẠM VI CỨNG:
- Chỉ sửa đúng 2 file: src/routes/index.jsx và src/components/ui/ErrorState/ErrorState.jsx.
- Mỗi file chỉ sửa đúng một dòng. Không đụng file nào khác.
- KHÔNG đụng backend. KHÔNG sửa src/services/. Không thêm dependency.
- Không sửa file tài liệu nào.
- Đây là dọn dẹp, KHÔNG phải dịp để tái cấu trúc. Thấy gì khác cũng để yên.

═══════════════════════════════════════════════════════════
FIX 1 — Xoá import chết
═══════════════════════════════════════════════════════════
File: src/routes/index.jsx (dòng 8)

Dòng import từ thư viện thành phần dùng chung đang kéo vào ba thứ, trong đó có thành phần chặn
lỗi render. Cả file KHÔNG dùng thành phần đó lần nào — nó được bọc ở điểm khởi động ứng dụng và
trong ba bố cục, không phải ở đây. ESLint của dự án không bật luật bắt import thừa nên lint vẫn
xanh, nhưng đây là code chết.

Sửa: bỏ thành phần chặn lỗi render ra khỏi dòng import đó. Giữ nguyên hai thứ còn lại.
Tự đọc để xác nhận đúng là cả file không dùng nó ở đâu trước khi xoá.

═══════════════════════════════════════════════════════════
FIX 2 — Bộ lọc thông điệp lỗi đang bắt quá rộng
═══════════════════════════════════════════════════════════
File: src/components/ui/ErrorState/ErrorState.jsx (hằng số mẫu nhận diện thông điệp mạng,
khoảng dòng 9-11)

Mẫu này có nhiệm vụ nhận ra thông điệp tiếng Anh của thư viện gọi mạng để thay bằng câu tiếng
Việt. Nhưng nó đang có thêm ba nhánh khớp với thông điệp của lỗi kiểu dữ liệu JavaScript phía
trình duyệt: gọi thứ không phải hàm, duyệt thứ không lặp được, và đọc thuộc tính của giá trị
rỗng.

Ba thứ đó KHÔNG phải lỗi máy chủ. Chúng là lỗi của chính mã frontend. Khớp chúng vào mẫu này
nghĩa là giao diện sẽ báo "Máy chủ đang gặp sự cố" cho một lỗi nằm hoàn toàn ở phía client —
nói sai với người dùng, và lần sau có ai đi tìm nguyên nhân thì bị dắt nhầm hướng sang backend.

Sửa: bỏ đúng ba nhánh đó khỏi mẫu. Giữ nguyên toàn bộ các nhánh còn lại (thông điệp thất bại
theo mã trạng thái, lỗi mạng, hết thời gian chờ, lỗi tải, tên lớp lỗi của thư viện gọi mạng).
Giữ nguyên cờ không phân biệt hoa thường.
KHÔNG đổi ba hằng số câu chữ tiếng Việt. KHÔNG đổi hàm lọc, KHÔNG đổi thứ tự các nhánh kiểm tra
trong hàm đó. KHÔNG đổi mẫu nhận diện HTML.

═══════════════════════════════════════════════════════════
CÁCH LÀM VÀ KIỂM CHỨNG
═══════════════════════════════════════════════════════════
- Xong thì chạy trong D:\study\quizcit\quizcit-web:
    npm run test
    npm run lint
    npm run build
  Cả ba phải sạch. Dán output thật vào báo cáo, không tóm tắt.

BÁO CÁO CUỐI:
1. Dán nguyên nội dung dòng trước và sau khi sửa, cho cả hai file.
2. Output thật của test, lint, build.
3. Xác nhận `git diff --stat` chỉ có đúng 2 file. Dán ra.
Không thay đổi bất cứ thứ gì ngoài 2 mục trên.
```
