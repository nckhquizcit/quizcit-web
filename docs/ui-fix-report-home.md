# Báo cáo sửa lỗi UI — Trang chủ `/app`

Phạm vi: `/app` + `MainLayout` (topbar). Yêu cầu: `docs/ui-fix-prompt-home.md`.
Trạng thái: **6/6 fix xong**, test + lint + build sạch. Chưa verify bằng trình duyệt.

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1a | MAJOR | Chuỗi số dài liền mạch tràn khỏi ô thống kê (2 cột ở ≤640px). | `StatTile.css`: thêm `overflow-wrap: anywhere; min-width: 0`. |
| 1b | MAJOR | Tên môn dài làm card cao hơn card cùng hàng → link đáy card lệch hàng. | `HomePage.css`: `-webkit-line-clamp: 2` + `overflow: hidden` cho `h3`. |
| 2 | MAJOR | Nút tài khoản topbar chỉ có `title`, không có `aria-label`; tên bị ẩn ở ≤640px → button không tên với screen reader. | Thêm `aria-label={\`Trang cá nhân của ${displayName}\`}`, giữ `title`. |
| 3 | MAJOR | `getMyEnrollments().catch(() => [])` nuốt lỗi → lỗi tải hiện thành "Bạn chưa đăng ký môn học nào" kèm lời mời đăng ký, dẫn user sai hướng. | Thêm state `enrollmentsFailed`, reset đầu `loadData`; render `ErrorState` + nút thử lại thay `EmptyState`. |
| 4 | MAJOR | Skeleton 3 card chung chung, không mô phỏng card thật → chiều cao trang nhảy khi dữ liệu về. | `SubjectCardSkeleton` mới (ảnh 16:9 → badge → tiêu đề → meta → link), 6 khung xương. |
| 5 | UPGRADE | `totalChapterCount` đã có trong payload nhưng UI chưa dùng → card môn không hiện tiến độ. | Thêm `ProgressBar` + nhãn `N/M`; **chỉ render khi `totalChapterCount > 0`** để tránh chia 0 ra Infinity. |
| 6 | MINOR | `Number("abc")` = NaN vẫn được coi là có dữ liệu → hiện năng lực "0.00 / 4" thay vì empty state. | Tách `toFiniteTheta()`, chỉ nhận khi `Number.isFinite()`; thêm 1 test. |

**6 file sửa + 2 file mới, +91/−22.** `HomePage.jsx` +70/−14 · `HomePage.css` +20/−0 · `homeSummary.js` +7/−4 · `homeSummary.test.js` +7 · `StatTile.css` +3 · `MainLayout.jsx` +1 · `SubjectCardSkeleton.jsx` +17 (mới) · `SubjectCardSkeleton.css` +18 (mới).

**Test:** `210 pass / 0 fail`. Case mới đã kiểm tra là regression guard thật — revert fix thì case `returns null averageTheta when the backend sends a non-numeric value` **fail**, có fix thì pass.
**Lint:** exit 0. **Build:** exit 0 — `✓ 3268 modules transformed`, `✓ built in 9.12s`. Cảnh báo chunk >500 kB có sẵn từ trước.

**Chưa làm được:** chưa verify bằng trình duyệt — `/app` sau `ProtectedRoute`, đề bài không cấp tài khoản test; sandbox chặn Chromium (`mojo platform_channel.cc: Access is denied`), không cài thêm browser automation theo yêu cầu.

**Lệch phạm vi (đã báo, không tự quyết):** FIX 3 đặt cờ qua biến cục bộ rồi `setState` sau `if (!isCurrent()) return;` thay vì `setState` thẳng trong `.catch` — tránh race khi `loadData` chạy chồng. Hành vi vẫn đúng yêu cầu.

**Ngoài phạm vi (không đụng):** `ScrollRestoration`, `redirectToLogin`, `src/services/**`, `Skeleton.jsx`.

**Còn tồn (chưa sửa, thuộc đợt sau):** `HomePage.jsx` bỏ qua `greeting.firstName`/`greeting.period`/`abilityOverview.abilityLevel` mà BE đã trả và tự tính lại ở client; ngưỡng `abilityLevel` lệch giữa BE (2.25) và `mappers.js` (2.5). Ảnh bìa môn không có `onError` fallback. Chip "0 kỹ năng đã có dữ liệu" vẫn hiện với user mới.

**Kiểm tra tay nhanh:** 360px với số liệu lớn → số xuống dòng trong ô · tên môn >80 ký tự → cắt 2 dòng, link đáy thẳng hàng · 360px bật screen reader trên nút tài khoản → đọc "Trang cá nhân của {tên}" · block `course-enrollments` + `home-summary` → hiện "Không tải được danh sách môn học" + Thử lại, **không** hiện empty state đăng ký · Slow 3G → 6 khung xương, hết nhảy trang · môn có `totalChapterCount = 0` → không có thanh tiến độ, card không hở khoảng trống.
