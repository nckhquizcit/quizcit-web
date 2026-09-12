# Prompt sửa — cụm lịch sử và tiến độ

Bản audit cụm này có một mục BLOCKER và hai mục MAJOR **sai sự thật**. Chúng đã bị loại.
Năm mục còn lại đều nhỏ. Copy nguyên khối dưới đây cho agent.

```
Bạn sửa 5 lỗi nhỏ trong cụm lịch sử và tiến độ của frontend React tại D:\study\quizcit\quizcit-web
(Vite + React Router 6, JSX thuần, CSS theo component).

PHẠM VI CỨNG:
- Chỉ sửa trong src/features/history/ và src/features/progress/.
- KHÔNG đụng backend D:\study\quizcit\quizcit-backend. Không đổi hợp đồng API.
- KHÔNG sửa src/services/ và src/components/ui/. Nếu một fix có vẻ cần sửa hai chỗ đó thì dừng và báo cáo.
- Không thêm dependency. Không đổi bảng màu.
- Làm đúng 5 mục dưới, không hơn.
- Giữ phong cách code hiện có: comment tiếng Việt, class theo CSS_STYLE_GUIDE.md.

BỐN VIỆC CẤM LÀM, DÙ CÓ NGUỒN NÀO BẢO BẠN LÀM:
Tôi đã đọc code và xác nhận bốn cáo buộc sau đều SAI. Đừng sửa theo chúng.
1. Có ý kiến nói trang lịch sử hỏng hoàn toàn vì trường định danh lần làm bài không tồn tại sau khi
   map dữ liệu, khiến mọi liên kết trỏ tới trang không tồn tại. SAI. Hàm map trả về đồng thời cả ba
   biến thể tên của trường này. Trang lịch sử điều hướng bình thường. Đừng đổi tên trường đó.
2. Có ý kiến nói số câu hỏi hiển thị ra chữ undefined. SAI. Hàm map luôn ép trường này về số,
   mặc định là 0. Không có đường nào cho ra undefined.
3. Có ý kiến nói nút trong trạng thái rỗng của trang lịch sử không điều hướng được vì component
   Button không hỗ trợ điều hướng. SAI. Button có nhánh render thành liên kết khi được truyền đích đến.
4. Có ý kiến nói màu vòng tiến độ sai ở giá trị biên vì bảng màu thiếu khoá. SAI. Hàm tính tông màu
   chỉ trả về đúng bốn giá trị, và bảng màu có đủ cả bốn.
Nếu bạn thấy bằng chứng ngược lại, báo cáo chứ đừng tự sửa.

═══════════════════════════════════════════════════════════
FIX 1 — Bài không có câu hỏi bị hiển thị như điểm kém
═══════════════════════════════════════════════════════════
File: src/features/history/components/HistoryCard/HistoryCard.jsx (khoảng dòng 16 và 34)
File liên quan: src/features/history/pages/HistoryPage/HistoryPage.jsx (khoảng dòng 54)

Khi tổng số câu bằng 0, phần trăm được tính ra 0, thẻ lịch sử hiển thị 0 phần trăm, dòng "0/0 câu",
và rơi vào bậc màu thấp nhất tức màu đỏ. Người dùng đọc thành bài làm rất kém, trong khi thực tế là
không có dữ liệu.

Sửa: khi tổng số câu không lớn hơn 0, hiển thị dấu gạch ngang thay cho phần trăm, hiển thị dòng phụ
theo hướng không có dữ liệu thay vì "0/0 câu", và dùng bậc màu trung tính thay vì màu đỏ.
Nếu bảng bậc màu hiện chưa có mức trung tính thì thêm một mức mới trong CSS của chính component này,
dùng biến màu có sẵn trong src/styles/tokens.css.
Không đổi cách tính phần trăm, và tuyệt đối không sửa hàm map trong src/services/.

═══════════════════════════════════════════════════════════
FIX 2 — Mức cao nhất có thể hiện ra chữ NaN
═══════════════════════════════════════════════════════════
File: src/features/progress/pages/SkillDetailPage/SkillDetailPage.jsx (khoảng dòng 198-201)

Chỗ này duyệt lịch sử để tìm giá trị năng lực cao nhất, ép từng phần tử sang số rồi so sánh. Nếu một
phần tử mang giá trị không chuyển được sang số, phép ép cho ra giá trị không hợp lệ, và nó lan ra kết
quả cuối, làm ô thống kê hiển thị chữ NaN.

Sửa: bỏ qua những phần tử không phải số hợp lệ trước khi so sánh. Nếu sau khi lọc không còn phần tử
nào hợp lệ thì hiển thị dấu gạch ngang thay vì một con số.

═══════════════════════════════════════════════════════════
FIX 3 — Khung xương không khớp bố cục thật
═══════════════════════════════════════════════════════════
File: src/features/progress/pages/SkillsPage/SkillsPage.jsx (dòng 94)
File: src/features/progress/pages/SkillDetailPage/SkillDetailPage.jsx (dòng 145-152)
File: src/features/progress/pages/ProgressPage/ProgressPage.jsx (khối loading, tự tìm)

Ba trang này hiển thị khung xương xếp dọc trong lúc chờ, nhưng bố cục thật là lưới nhiều cột.
Khi dữ liệu về, chiều cao trang đổi đột ngột.
- SkillsPage: đang một khung xương đơn, bố cục thật là lưới class skills-page__grid, 2 cột ở màn
  rộng và 1 cột dưới 768px. Bọc khoảng 4 khung xương trong đúng class đó.
- SkillDetailPage: đang hai khung xương dọc, bố cục thật có thêm hàng thống kê class
  skill-detail-stats, 4 cột ở màn rộng và 2 cột dưới 768px. Thêm một hàng khung xương trong class đó.
- ProgressPage: tự đọc khối loading và khối render thật, làm cùng nguyên tắc.
KHÔNG sửa component khung xương dùng chung trong src/components/ui/.

═══════════════════════════════════════════════════════════
FIX 4 — Điều hướng bàn phím và tiếng ồn cho trình đọc màn hình
═══════════════════════════════════════════════════════════
4a. File: src/features/progress/pages/SkillDetailPage/SkillDetailPage.css (dòng 185-187)
    Selector .skill-detail-others__row chỉ có trạng thái di chuột, không có trạng thái nhận tiêu
    điểm, nên đi bằng phím Tab không thấy mình đang ở đâu. Đây là thẻ liên kết, có focus được.
    Thêm quy tắc :focus-visible copy y hệt kiểu đã dùng ở
    src/features/progress/components/SkillTile/SkillTile.css dòng 22-25.

4b. File: src/features/history/components/HistoryCard/HistoryCard.jsx (khoảng dòng 39-45)
    Thẻ lịch sử là một nút bấm, nhưng bên trong còn một phần tử trang trí mang nhãn mô tả riêng.
    Trình đọc màn hình đọc cả hai, gây lặp và rối.
    Gộp lại còn một nhãn mô tả duy nhất đặt trên nút, và ẩn phần trang trí bên trong khỏi trình đọc
    màn hình. Không đổi giao diện nhìn thấy.

═══════════════════════════════════════════════════════════
FIX 5 — Biểu đồ có thể làm trắng trang trên môi trường thiếu API
═══════════════════════════════════════════════════════════
File: src/features/progress/components/ThetaTrendChart/ThetaTrendChart.jsx (dòng 36-38)

Biểu đồ khởi tạo trình theo dõi thay đổi kích thước mà không kiểm tra API đó có tồn tại hay không.
Ở môi trường không có API này, dòng khởi tạo ném lỗi ngay trong effect và làm trắng cả trang.

Sửa: kiểm tra sự tồn tại của API trước khi khởi tạo, không có thì bỏ qua và giữ kích thước mặc định.
Đây là chốt phòng thủ rẻ tiền, không phải lỗi đã tái hiện được. Đừng viết lại logic vẽ biểu đồ.

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
- Liệt kê kịch bản kiểm tra tay, mỗi fix một kịch bản ngắn dạng "mở URL nào, làm gì, phải thấy gì".

BÁO CÁO CUỐI:
1. Bảng: Fix | File đã sửa | Số dòng thay đổi | Tóm tắt một câu.
2. Output thật của test, lint, build.
3. Danh sách kịch bản kiểm tra tay.
4. Mục nào không làm được và vì sao. Không im lặng bỏ qua.
Không thay đổi bất cứ thứ gì ngoài 5 mục trên.
```
