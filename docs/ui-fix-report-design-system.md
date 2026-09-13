# Báo cáo sửa lỗi UI — Design System (CSS admin rò rỉ toàn app)

Phạm vi: `src/routes/index.jsx`, `src/features/admin/Admin.css`, `src/styles/tokens.css`. Yêu cầu: `docs/ui-fix-prompt-design-system.md`.
Trạng thái: **3/3 fix xong**, lint + build sạch. Chưa verify bằng trình duyệt. Test không chạy được (lỗi sandbox).

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1 | BLOCKER | `AdminLayout` import **tĩnh**, mọi trang khác lazy → `Admin.css` (7255 dòng) nằm trong gói khởi động, tải cho cả học sinh. | Chuyển sang `lazy()` + bọc `withSuspense` sẵn có, giữ `ProtectedRoute` làm lớp ngoài. |
| 2 | BLOCKER | `.subject-card` trùng tên admin/học sinh → card môn học của học sinh ăn `cursor:pointer`, `min-height:178px`, `border-radius:18px`, `border:#e5e7eb` từ admin. FIX 1 chưa đủ vì chế độ xem thử giữ cả 2 file CSS trong trang. | Thêm tiền tố `.admin-layout` vào **19 selector** chứa `.subject-card`/`.subject-card-actions`. Không đổi giá trị thuộc tính nào. |
| 3a | MAJOR | `.adm2-badge--red` đặt chữ `--color-error` (#ef4444) trên nền `#fef2f2` → **3.44:1**, trượt AA. | Đổi sang `--color-error-strong` (#b91c1c) → **5.91:1**. |
| 3b | MAJOR | `.adm2-badge--info` đặt chữ `--color-info` (#3b82f6) trên nền `#eff6ff` → **3.38:1**, trượt AA. `tokens.css` chưa có biến sắc đậm tương ứng. | Thêm token `--color-info-strong: #1d4ed8` vào `tokens.css`, cho badge trỏ tới → **6.16:1**. |

**3 file, +30/−23.** `Admin.css` +24/−21 · `routes/index.jsx` +5/−2 · `tokens.css` +1/−0.

**FIX 1 — số đo thật:** `Admin.css` rời vào chunk riêng `Admin-cxj1oyMW.css` (112.71 kB, gzip 18.19 kB), không có `modulepreload`/`preload` nào trỏ tới. Gói CSS khởi động **158.21 kB → 45.51 kB** (−112.70 kB, −71.2%); gzip **25.94 kB → 8.44 kB** (−67.5%). Con số khớp chính xác kích thước chunk admin.

**Quét an toàn FIX 1:** quét 394 class chỉ định kiểu trong `Admin.css` đối chiếu mọi `className` thật trong JSX ngoài admin → **1 trường hợp thật: `.theory-editor-shell`** (7 selector). Đã điều tra: `TheoryEditor` chỉ render từ 3 nơi đều thuộc admin (`AdminChapterEdit.jsx:457`, `EditTheoryModal.jsx:50`, `AddTheoryModal.jsx:69`); trang học sinh dùng `TheoryContent` (chỉ đọc), không import editor → **an toàn, không cần chép CSS đi đâu**. Hai chỗ đã kiểm trước đúng như dự kiến: `.page-loader` ở `global.css:64`, class sidebar ở `Sidebar.css`.

**Không đụng** (theo 5 điều cấm): Modal admin · gộp component trùng · thay nút tự viết · chuẩn hoá font-size/radius/hex · validate prop `Card`/`Badge`/`Button`/`Input`. Không gặp trường hợp nào buộc sửa file thứ tư.

**Lint:** exit 0. **Build:** exit 0 — `✓ 3268 modules transformed`, `✓ built in 16.27s`. Cảnh báo chunk >500 kB có sẵn từ trước.

**Chưa làm được:** `npm run test` **không chạy được** — 33/33 test chết ở `spawn EPERM` (errno −4048) trước khi vào logic. Đã stash 3 file chạy lại trên cây nguyên bản → lỗi y hệt, xác nhận là giới hạn sandbox, không phải do code. **Cần chạy lại ngoài sandbox.** Chưa verify bằng trình duyệt (không có tài khoản test, không cài browser automation).

**Kiểm tra tay nhanh:** học sinh vào `/app/subjects` → Network chỉ có `index-*.css`, không có `Admin-*.css` · ADMIN vào `/admin/subjects` → bấm "Xem thử giao diện người dùng" (không F5) → sang `/app/subjects` → card môn học `cursor:auto`, `min-height:auto`, `border-radius:16px` (không phải `pointer`/`178px`/`18px`) · quay lại `/admin/subjects` → card admin **vẫn** `cursor:pointer`, `min-height:178px` · `/admin/quizzes` → huy hiệu `ADAPTIVE` chữ `rgb(29,78,216)`, nền giữ `#eff6ff` · `/admin/users` → huy hiệu đỏ chữ `rgb(185,28,28)`, nền giữ `#fef2f2`.
