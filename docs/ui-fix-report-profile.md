# Báo cáo sửa lỗi UI — Trang hồ sơ `/app/profile`

Phạm vi: `/app/profile` + `ImageCropModal`. Yêu cầu: `docs/ui-fix-prompt-profile.md`.
Trạng thái: **5/5 fix xong**, test + lint + build sạch. Chưa verify bằng trình duyệt.

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1 | MAJOR | `handleAvatarCrop` chỉ có `try/finally`, **không có `catch`** → upload thất bại (file lớn, 500, mất mạng) vẫn tắt spinner, modal crop tự đóng, giữ ảnh cũ, **không thông báo gì**. User tin là đã đổi ảnh. | Thêm `catch` → `setFormError(getErrorMessage(error, "Không thể tải ảnh lên. Vui lòng thử lại."))`. Không phân loại theo mã lỗi vì service đã bọc thành `Error` thường. |
| 2 | MAJOR | Cả 2 chỗ render ảnh đại diện (header card + preview modal) **không có `onError`** → URL chết/404 hiện icon ảnh vỡ trong khung tròn. `MainLayout` đã có fallback, trang này thì không. | Thêm `headerAvatarError`/`previewAvatarError` + `onError` cho cả 2 `<img>`, rơi về `getInitial(displayName)`. 2 effect xoá cờ khi URL đổi. |
| 3 | MAJOR | `ImageCropModal` chỉ chặn Escape + khoá scroll, **không xử lý `Tab`** → Tab thoát ra sidebar/topbar sau lớp phủ; đóng modal không trả focus về nút mở. | Thêm nhánh `Tab`/`Shift+Tab` copy từ `Modal.jsx:53-76`, query focusable **ngay lúc nhấn phím**; lưu `document.activeElement` lúc mở, trả lại lúc dọn. Thêm `tabIndex={-1}` cho dialog. |
| 4a | MINOR | `--color-border-hover` dùng 2 lần, **khai báo 0 lần**, không có fallback → `border-color` vô hiệu, viền không đổi khi hover. | Đổi sang `--color-border-strong` (`tokens.css:23`). Nay biến chết còn 0 tham chiếu. |
| 4b | MINOR | Hộp thoại không giới hạn chiều cao, lại `overflow:hidden`; lớp phủ canh giữa không cuộn được; vùng cắt cứng `360px` không media query → màn thấp/điện thoại nằm ngang đẩy nút "Áp dụng" ra ngoài, **không bấm được**. | `max-height: calc(100vh - var(--space-8))` + `100dvh`; vùng cắt `min(360px, 45vh)` + `min-height: 140px`; header/footer `flex-shrink: 0`; thêm `@media (max-height: 560px)` cho vùng cắt. |
| 5a | MINOR | Luồng đổi email lấy `challengeId` mà không kiểm tra → thiếu field thì các bước sau gửi rỗng, BE lỗi, UI kẹt ở trạng thái "hết hạn", bấm "Bắt đầu lại" bao nhiêu lần cũng vậy. | Nếu `!challenge?.challengeId` → `setEmailStatus("failed")` + "Không nhận được phiên xác thực. Vui lòng thử lại." |
| 5b | MINOR | `.profile-header-card__top h2` thiếu quy tắc ngắt dòng → tên hiển thị tối đa 100 ký tự nhập liền không khoảng trắng tràn ngang khỏi thẻ ở màn hẹp. | Thêm `overflow-wrap: anywhere` (giống 2 selector cùng file). |

**4 file, net +79 dòng.** `ProfilePage.jsx` 828→852 (+24) · `ImageCropModal.jsx` 232→274 (+42) · `ImageCropModal.css` 194→206 (+12) · `ProfilePage.css` 394→395 (+1).

**Hai việc đã cố ý KHÔNG làm** (theo yêu cầu): không thêm prop `key`/reset zoom lần hai — effect `[imageSrc, open]` đã reset đủ khi đóng/mở lại vì `open` đổi giá trị; không gỡ/viết lại khối Escape — giữ nguyên pha capture + `stopImmediatePropagation`, chỉ thêm `return;` để không chạy tiếp xuống nhánh `Tab`.

**FIX 3 và 4 chạm component dùng chung — đã đọc cả 3 nơi gọi:** `ProfilePage.jsx:829`, `SubjectImageField.jsx:304`, `AdminEditProfileModal.jsx:252`. Cả 3 đều không phải sửa: không đổi danh sách prop, logic mới nằm trong `useEffect` chỉ chạy khi `open === true`, có guard `if (!dialog) return`. Escape bắt ở capture nên modal cha (`Modal` sửa hồ sơ, `Modal` admin) vẫn **không** bị đóng nhầm — hành vi cũ giữ nguyên. CSS dùng class `.image-crop-modal*` duy nhất nên không ảnh hưởng nơi khác.

**Test:** `210 pass / 0 fail`, `duration_ms 708.7`. **Lint:** exit 0, không output. **Build:** exit 0 — `✓ 3268 modules transformed`, `✓ built in 9.80s`. Cảnh báo chunk >500 kB có sẵn từ trước (chunk syntax-highlighting BlockNote), `ProfilePage.js` chỉ 16.42 kB.

**Chưa làm được:** chưa verify bằng trình duyệt — `/app/profile` sau `ProtectedRoute`, repo không có tài khoản test, máy không có Playwright/Chrome automation và không được cài thêm. Không viết test tự động cho 5 fix: repo dùng `node --test` thuần logic, không có jsdom/RTL, mà các fix này là DOM/CSS. FIX 5a khó tái hiện tay vì cần BE trả response thiếu `challengeId` → phải dùng "Override response" trong DevTools.

**Lệch API (thuộc tài liệu, không phải BE):** `API_SPEC.md` **lỗi thời** so với backend — thiếu `GET/PUT /api/users/me`, thiếu `avatarUrl` trong `UserResponse`, ghi sai body đổi mật khẩu (spec: `{password}`, BE thực tế: `{currentPassword, newPassword}`), thiếu 3 endpoint `email-change`. **FE đọc/gửi đúng hết so với BE thực tế** (`UserController.java:52,62,73,83,92,102`). Chỉ tài liệu sai; không đụng `API_SPEC.md` theo yêu cầu.

**Còn tồn (chưa sửa, thuộc đợt sau):** huỷ modal sửa hồ sơ vẫn giữ ảnh đã upload (file thành rác trên server, không được tham chiếu); input OTP dùng `autoFocus` chồng với `initialFocusRef` của `Modal`; loading lần đầu chỉ hiện dòng chữ nhỏ nên nội dung nhảy khi load xong (có `Skeleton` sẵn nhưng chưa dùng); input mật khẩu không có `maxLength` 255 và không chặn trùng mật khẩu cũ dù gợi ý trong form nói "Không dùng lại mật khẩu cũ"; nút "Xoay"/"Đặt lại" của `ImageCropModal` thiếu `aria-label`.

**Kiểm tra tay nhanh:** chặn `/api/uploads/image` (DevTools → Block request URL) rồi chọn ảnh → hiện dòng lỗi đỏ, **không** im lặng · sửa `user.avatarUrl` trong Local Storage thành URL chết → F5 ra chữ cái đầu, sửa lại URL đúng → ảnh hiện lại · mở modal crop nhấn Tab ~15 lần → focus vòng trong hộp thoại, không nhảy ra sidebar · Escape trong modal crop → chỉ đóng modal crop, modal sửa hồ sơ phía sau vẫn mở · rê chuột lên nút zoom → viền đổi màu · 360×640 và 800×400 → nút "Áp dụng cắt ảnh" luôn bấm được · tên 100 ký tự liền → ngắt dòng trong thẻ ở 360px.
