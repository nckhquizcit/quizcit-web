# Báo cáo sửa lỗi UI — Cụm Auth

Phạm vi: `/login`, `/register`, `/verify`, `/forgot-password`. Yêu cầu: `docs/ui-fix-prompt-auth.md`.
Trạng thái: **5/5 fix xong**, lint + build sạch. Chưa verify bằng trình duyệt.

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1 | BLOCKER | Sai OTP bị kẹt: BE trả **401**, code chỉ bắt 429/400 nên không xoá 6 ô, không focus lại. | Tách 3 nhánh: **401 → giữ token, xoá OTP, focus ô 1**. |
| 2a | MAJOR | Đã đăng nhập vào lại `/login` vẫn thấy form. | `AuthLayout` check token + user → `<Navigate>` về `/admin` hoặc `/app`. |
| 2b | MAJOR | `LoginForm` không đọc `state.from` → luôn về `/app`. | Đọc `state.from.pathname`, chỉ dùng khi khác `/login`. |
| 3a | MINOR | Không dán được OTP. | Thêm `handlePaste` (lọc `\D`, tối đa 6, focus ô cuối). |
| 3b | MINOR | `isNaN(" ")` = false → dấu cách lọt vào ô. | Đổi thành `!/^\d$/.test(value)`. |
| 4a | MINOR | 6 banner lỗi thiếu `role="alert"`. | Thêm `role="alert"` vào 6 chỗ. |
| 4b | MINOR | Lỗi username hiện ở banner đầu form, không gắn field. | Thêm `usernameError` → `Field error=` + `Input invalid=`. |
| 5a | MAJOR | Reload `/verify` mất `location.state` → im lặng chuyển sang nhập email tay. | Thêm prop `sessionExpired`, hiện hướng dẫn. |
| 5b | MAJOR | Reload `/forgot-password` reset về bước 1 im lặng. | Fallback bước 1 + marker `sessionStorage` → báo phiên hết hạn. |

**10 file, +142/−29.** `VerifyForm` +29/−6 · `VerifyForgotPasswordForm` +35/−6 · `AuthLayout` +10/−1 · `LoginForm` +7/−3 · `RegisterForm` +7/−4 · `ForgotPasswordForm` +11/−3 · `ChangForgotPasswordForm` +3/−2 · `VerifyPage` +3/−0 · `ForgotPasswordPage` +9/−4 · `ForgotPasswordContext` +28/−0.

**Ngoại lệ phạm vi:** `ForgotPasswordContext.jsx` ngoài `src/features/auth/`, buộc chạm vì FIX 5b cần marker `sessionStorage`. Thuần cộng thêm, không sửa logic cũ.

**Lint:** exit 0. **Build:** exit 0 — `✓ 3266 modules transformed`, `✓ built in 9.38s`. Cảnh báo chunk >500 kB có sẵn từ trước.

**Chưa làm được:** chưa verify bằng trình duyệt (không có browser automation, không cài thêm); FIX 1 chưa test end-to-end với tài khoản đã verify.

**Lệch API (thuộc BE):** `API_SPEC.md` chỉ có 2/9 endpoint auth, mô tả sai response `register`. Sai tài liệu, FE đọc đúng hết field.

**Kiểm tra tay nhanh:** sai OTP → 6 ô tự xoá + focus ô 1 · đang login gõ `/login` → về `/app` · copy `" 123456 "` dán → đủ 6 ô · username `ab` → lỗi dưới ô username · F5 ở `/verify` → hiện "Phiên xác minh đã kết thúc" · F5 ở bước 2 forgot-password → về bước 1 kèm cảnh báo.
