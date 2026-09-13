# Báo cáo sửa lỗi UI — Cụm Lịch sử & Tiến độ

Phạm vi: `/app/history`, `/app/progress`, `/app/progress/skills`, `/app/progress/skills/:skillId`. Yêu cầu: `docs/ui-fix-prompt-progress.md`.
Trạng thái: **5/5 fix xong**, test + lint + build sạch. Chưa verify bằng trình duyệt.

## Audit lần đầu báo sai 2 mục

Bản audit đầu có **1 BLOCKER + 1 MAJOR sai sự thật**, đã rút lại, không sửa theo:

| Cáo buộc | Thực tế | Kết luận |
|---|---|---|
| BLOCKER: `attemptId` không tồn tại sau map → mọi link hỏng. | `mappers.js:411-413` trả **cả ba** `id`, `attemptId`, `attempt_id`. | **SAI** — rút lại. |
| MAJOR: số câu hiện ra `undefined`. | `mappers.js:399` dùng `toNumber(..., 0)` → luôn là số. | **SAI** — rút lại. |

Hai cáo buộc khác cũng sai và không nằm trong 5 fix: `Button` **có** nhánh `to` → `Link` (`Button.jsx:39-45`); `getProgressTone` chỉ trả **đúng 4** giá trị và bảng màu có đủ 4 khoá.

## Bảng fix

| # | Mức | Lỗi | Đã sửa |
|---|---|---|---|
| 1 | MAJOR | Bài 0 câu → `percentage = 0` → hiện `0%`, `0/0 câu`, bậc **đỏ** như bài làm kém. | `hasQuestions = Number(totalQuestions) > 0`; không có câu → hiện `—`, dòng phụ "Chưa có dữ liệu câu hỏi", bậc `neutral` mới. |
| 2 | MAJOR | `peakScaled` ép `Number()` từng phần tử; giá trị không parse được → `NaN` lan ra ô "Mức cao nhất". | Lọc `Number.isFinite` trước `Math.max`; rỗng → `null` → hiện `—`. |
| 3 | MINOR | 3 trang dùng khung xương xếp **dọc** trong khi bố cục thật là **lưới nhiều cột** → chiều cao nhảy khi load xong. | SkillsPage: 4 khung trong `skills-page__grid`. SkillDetailPage: thêm hàng 4 khung trong `skill-detail-stats`. ProgressPage: 2 khung trong `progress-top-grid` + 1 khối dưới. |
| 4a | MINOR | `.skill-detail-others__row` chỉ có `:hover`, Tab không thấy vị trí. | Thêm `:focus-visible` copy y hệt `SkillTile.css:22-25`. |
| 4b | MINOR | Thẻ lịch sử là nút nhưng bên trong có phần tử mang `aria-label` riêng → trình đọc màn hình đọc lặp. | Gộp còn **1** `aria-label` trên nút; `aria-hidden="true"` cho badge/main/side. Giao diện không đổi. |
| 5 | MINOR | `new ResizeObserver()` không feature-detect → môi trường thiếu API ném lỗi trong effect, trắng trang. | Thêm `if (typeof ResizeObserver === "undefined") return undefined;` sau `syncWidth()`. Không viết lại logic vẽ. |

**7 file, +68/−19.** `HistoryCard.jsx` +26/−11 · `SkillDetailPage.jsx` +15/−5 · `ProgressPage.jsx` +8/−2 · `SkillsPage.jsx` +6/−1 · `HistoryCard.css` +5/−0 · `SkillDetailPage.css` +5/−0 · `ThetaTrendChart.jsx` +3/−0.

**Phạm vi:** cả 7 file nằm trong `src/features/history/` và `src/features/progress/`. Không chạm `src/services/`, `src/components/ui/`, backend. **Không có ngoại lệ phạm vi.**

**Test:** 210 pass / 0 fail. **Lint:** exit 0. **Build:** exit 0 — `✓ 3268 modules transformed`, `✓ built in 9.09s`. Cảnh báo chunk >500 kB có sẵn từ trước.

**Chưa làm được:** chưa verify bằng trình duyệt (không có browser automation, không cài thêm). Bộ test chỉ phủ logic thuần, **không render component**, nên 5 fix này không có test tự động — không thêm test vì yêu cầu "đúng 5 mục, không hơn".

**Đánh đổi FIX 4b:** `aria-hidden` trên khối `main` làm text bên trong **không select/copy được bằng chuột** ở một số trình duyệt. Giao diện nhìn thấy không đổi. Muốn tránh thì bỏ `aria-hidden` ở `main`, chỉ giữ `aria-label` trên nút.

**Lệch API (thuộc BE, ngoài phạm vi):** `API_SPEC.md` bị **cắt cụt ở dòng 755** giữa khối JSON mục 7.1 — thiếu toàn bộ 7.2+ (abilities history, average, skills-summary, detail-overview) và định nghĩa đầy đủ `QuizResultResponse`. Không ảnh hưởng 5 fix vì không đổi field nào.

**Kiểm tra tay nhanh:** bài 0 câu → `—` + nền xám, không đỏ · `thetaScaled: "abc"` → ô "Mức cao nhất" không ra `NaN` · Slow 3G ở `/app/progress/skills` → khung xương 2 cột, không nhảy chiều cao · Tab vào "Kỹ năng khác" → viền xanh 2px · NVDA ở `/app/history` → đọc **một** câu mô tả, không lặp · `delete window.ResizeObserver` rồi remount → biểu đồ vẫn vẽ, không trắng trang.
