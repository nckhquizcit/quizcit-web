# QuizCIT Web CSS Style Guide

Tài liệu này mô tả phong cách CSS hiện tại của frontend `quizcit-web`, dùng làm chuẩn thống nhất khi thêm/sửa UI.

## 1) Triết lý tổ chức CSS

- CSS chia theo feature/component: mỗi page/component có file riêng, ví dụ `ProfileHeader.css`, `SubjectsPage.css`.
- Dùng naming theo block-element-modifier ở mức nhẹ:
  - Block: `.profile-header-card`, `.subjects-page`
  - Element: `.subjects-page__hero`, `.subject-overview-card__meta-grid`
  - Modifier/state: `--active`, `--highlight`, `.active`, `.locked`, `.btn-warning`
- Có `styles/global.css` cho reset, font, và rule nền toàn cục.
- Tailwind có mặt trong dự án nhưng phần lớn UI đang dùng CSS thuần theo component.

## 2) Bảng màu chủ đạo

- **Primary xanh lá** (thương hiệu):
  - `#10b981`, `#009e60`, `#00d17f`
- **Neutrals (text/surface)**:
  - Text chính: `#1e293b`, `#11261a`
  - Text phụ: `#64748b`, `#6f8c7b`, `#94a3b8`
  - Border: `#e2e8f0`, `#dbefe4`, `#cbd5e1`
  - Surface: `#ffffff`, `#f8fafc`, `#effcf6`
- **Semantic accents**:
  - Warning: `#f59e0b`, `#d97706`
  - Error: `#e7040f` (ở admin modal)

## 3) Radius, shadow, spacing

- Radius thường dùng:
  - Card lớn: `24px`
  - Card/modal vừa: `16px`
  - Input/button nhỏ: `8-10px`
  - Pill/badge: `999px`
- Shadow thường dùng:
  - Nhẹ: `0 4px 12px rgba(...)`
  - Card nổi: `0 12px 32px rgba(...)`
- Spacing:
  - Block lớn: `24px`, `32px`
  - Gap nội dung: `8px`, `10px`, `12px`, `16px`

## 4) Typography

- Font mặc định toàn cục: `Inter, sans-serif` (`global.css`).
- Cỡ chữ:
  - Tiêu đề section: khoảng `1.4rem - 2rem`
  - Nội dung/body: `0.9rem - 1rem`
  - Label/meta: `0.82rem - 0.9rem`

## 5) Pattern thành phần

- **Card pattern**:
  - Nền sáng + border mảnh + radius lớn + shadow nhẹ.
- **Button pattern**:
  - Primary dùng gradient xanh (`#00d17f -> #009e60`), chữ trắng.
  - Outline button: nền trắng, border trung tính, hover đổi nền nhẹ.
- **Input pattern**:
  - Border xám nhạt, focus đổi border xanh + ring xanh mờ.
- **Modal pattern**:
  - Overlay tối mờ (`rgba(0,0,0,0.4-0.5)`), container trắng, radius 16, padding ~24.

## 6) Quy tắc khi thêm CSS mới

- Ưu tiên tái sử dụng token/màu đã có, tránh thêm màu lạ nếu không cần.
- Đặt class theo ngữ cảnh feature (`profile-*`, `subjects-*`, `admin-*`), tránh class quá generic.
- Giữ hierarchy đơn giản (không lồng selector quá sâu).
- Tránh inline style; nếu cần lặp lại >1 chỗ thì tách ra class CSS.
- Tạo hover/focus state nhất quán với style hiện có.

## 7) Gợi ý cải tiến tiếp theo (không bắt buộc)

- Chuẩn hóa màu/radius/spacing thành CSS variables trong `:root`.
- Gom các utility dùng chung (button/input/badge/modal-content) vào một file base components.
- Dọn trùng lặp giữa `features/admin/components/modal.css` và `features/admin/components/modals/modal.css`.
