# Audit UI ngang toàn app — trọng tâm: `src/components/ui/`, `src/styles/`, chuẩn `CSS_STYLE_GUIDE.md`

**Phạm vi:** `quizcit-web` — UI layer only. KHÔNG sửa code. KHÔNG đụng backend.
**Ngày:** Phiên audit hiện tại.
**Phương pháp:** đọc code tĩnh + phân tích CSS tự động (đếm selector, hex, px, keyframes) + tính toán contrast WCAG bằng công thức.

## Trạng thái verify — ĐỌC KỸ PHẦN NÀY

| Mức độ | Nội dung |
|---|---|
| ❌ **CHƯA verify trên trình duyệt** | **Không có tài khoản test.** Mọi màn hình nằm sau `ProtectedRoute` (`src/features/admin/components/guard/ProtectedRoute.jsx:9-15`) nên không đăng nhập được → **toàn bộ audit này suy ra từ đọc code + phân tích CSS tĩnh**. Không có screenshot, không có DevTools. |
| ⚠️ **Hệ quả** | Các kết luận về *giá trị CSS*, *trùng selector*, *trùng component*, *contrast*, *đếm số chỗ* là **chắc chắn** (chứng minh được bằng số). Các kết luận về *thứ tự cascade thực tế khi chạy* là **suy luận từ thứ tự import** — cần kiểm tra thủ công trên trình duyệt. |
| ✅ **Có thể tin** | Mọi con số đếm (hex, selector, `<button>`, keyframes) và mọi công thức contrast đều tái lập được. |

---

## 0. Phát hiện quan trọng nhất (đọc trước nếu chỉ đọc 1 mục)

`src/features/admin/Admin.css` **7.255 dòng** là một **file CSS toàn cục** bị import bởi `AdminLayout.jsx:8` và bundle vào **một stylesheet duy nhất** cho toàn app (Vite gộp mọi `import "./x.css"` — không có CSS Modules, không có scoping).

Bằng chứng file tự khai báo là 2 hệ design chồng lên nhau:

```
Admin.css:5776-5781
/* =====================================================================
   ADM2 — Figma redesign additions (pages 07–13, admin screens)
   Scoped, additive primitives only. Prefixed `adm2-` to avoid collisions
   with the legacy rules above. Prefer adding new adm2- classes on top of
   existing markup over editing the rules above this block.
   ===================================================================== */
```

Comment này nói rõ tác giả **biết** có vấn đề trùng lặp và cố né bằng prefix `adm2-`. Nhưng **250 class vẫn bị định nghĩa lại nhiều lần cùng file**, và **~30 class đụng tên với file CSS ngoài admin**.

**Hệ quả định lượng:**

| Chỉ số | Giá trị |
|---|---|
| Tổng dòng | 7.255 |
| Tổng lượt dùng hex | **745** |
| Số màu hex **khác nhau** | **110** |
| Khai báo `font-size` | **198** (đa số là px cứng) |
| `border-radius` px cứng | ~160 (dùng 16 giá trị khác nhau) |
| `rgba()` literal | 39 |
| Class định nghĩa **>1 lần trong chính file này** | **250** |
| Class trần/đụng tên file khác | ~30 |

---

# BẢNG PHÁT HIỆN CHÍNH

Sắp xếp BLOCKER trước.

| Mức | Màn hình / Phạm vi | Vấn đề | File:dòng | Cách sửa đề xuất |
|---|---|---|---|---|
| **BLOCKER** | Toàn app (mọi trang học sinh) | `.subject-card` bị định nghĩa **14 lần** trong `Admin.css`, trong đó có rule áp `position:relative; min-height:178px; padding:16px; cursor:pointer` — đè lên card môn học thật của học sinh (`SubjectCard.jsx:28` dùng `className="subject-card"`). Vì CSS bundle chung, học sinh có thể thấy card bị ép `min-height:178px` + `cursor:pointer` sai. | Định nghĩa: `Admin.css:422,4388,4225,4247,6484,6489,6493,6502`; nạn nhân: `SubjectCard.jsx:28`, `SubjectCard.css:1-6` | Đổi class admin sang `adm2-subject-card` (đã có `adm2-*` sẵn) và xoá `subject-card` khỏi mọi selector trong `Admin.css`. |
| **BLOCKER** | Mọi modal admin | `.modal-overlay` / `.modal-container` / `.modal-header` / `.modal-body` / `.modal-footer` / `.modal-content` / `.cancel-btn` / `.add-btn` / `.submit-btn` / `.danger-btn` / `.close-btn` / `.modal-inline-error` / `.form-group` / `.answer-item` / `.correct` **đều định nghĩa 2–3 lần ở 3 file khác nhau**, load order quyết định kết quả. Đây là lý do các modal admin trông không đồng nhất. | `features/admin/Admin.css` + `features/admin/components/modals/modal.css:1-520` + `features/admin/components/ui/ui.css:1-235` | Giữ **1** file `modal.css`, xoá 2 bản kia. Xem mục "Danh sách gộp/xoá" bên dưới. |
| **BLOCKER** | `ImageCropModal` (dùng ở ProfilePage + AdminEditProfileModal + AddSubjectModal) | Component **tự viết lại toàn bộ logic focus-trap** đã có sẵn trong `ui/Modal` (cùng 1 `FOCUSABLE_SELECTOR`, cùng vòng Tab, cùng khoá scroll body, cùng trả focus). Đây là bản copy thứ 3 của cùng một đoạn ~50 dòng. Kèm theo: dùng `document.addEventListener("keydown", handleKeyDown, true)` (capture phase) + `stopImmediatePropagation` để chặn modal cha — chính là hệ quả của việc không tái dùng `ui/Modal`. | Copy: `ui/ImageCropModal/ImageCropModal.jsx:10-17, 51-102`; bản gốc: `ui/Modal/Modal.jsx:8-15, 34-86`; bản copy thứ 2: `features/admin/components/ui/Modal.jsx:6-13, 34-86` | `ImageCropModal` nên render **bên trong** `ui/Modal` (truyền `footer`, `title`) thay vì tự `createPortal` + tự trap focus. Xoá 2 selector list trùng. |
| **BLOCKER** | `/admin/users` (`AdminUsers.jsx:287`) | `adm2-badge--info` và `adm2-badge--red` dùng `--color-info` (#3b82f6) và `--color-error` (#ef4444) làm **màu chữ** trên nền `-soft`. Contrast đo được **3.38:1** và **3.44:1** — **trượt WCAG AA (4.5:1)** cho chữ 12px. Badge dùng chung `ui/Badge` làm **đúng** cùng màu đó (6.16:1 / 5.91:1). | Sai: `Admin.css:5811,5813,5831,6549-6550`; Đúng: `ui/Badge/Badge.css:37-44` | Đổi `var(--color-error)` → `var(--color-error-strong)`, `var(--color-info)` → `#1d4ed8`, giống hệt `Badge.css`. |
| **BLOCKER** | `/admin/users` (`AdminUsers.css:100-111`) | `.status-badge--success` dùng `--color-success` (#10b981) làm chữ trên `#ecfdf5` → **2.41:1**. `--warning` → **2.07:1**. `--error` → **3.44:1**. Cả 3 trượt AA. (Class này hiện **không được JSX nào dùng** → CSS chết, nhưng vẫn nằm trong bundle.) | `features/admin/pages/AdminUsers.css:92-115` | Xoá hẳn block `.status-badge*` (dead code) — đã có `adm2-badge` thay thế. |
| **MAJOR** | Toàn app | **213 `<button>` tự viết** so với **70 `<Button>` dùng chung** trong `src/features/`. Tỉ lệ 3:1 nghiêng về tự vẽ. Mỗi `<button>` tự viết là một chỗ thiếu `:focus-visible`, thiếu `loading`, thiếu `disabled` nhất quán. | Đếm toàn `src/features/**/*.jsx`. Nhiều nhất: `QuizTakingPage.jsx` (21), `ProfilePage.jsx` (20), `AdminQuestion.jsx` (16), `AddQuestionModal.jsx` (16) | Không cần đổi hết. Ưu tiên 3 nhóm có CSS riêng đã trùng `ui/Button`: `.add-btn` (13 định nghĩa), `.cancel-btn` (9), `.danger-btn` (8). |
| **MAJOR** | `Admin.css` toàn cục | `.search-bar:focus` và `.search-input:focus` được gom vào một rule chung set `outline: none` + `box-shadow: var(--admin-focus)`. Đây là **selector trần theo class generic** — `.search-input` chỉ dùng ở admin (`SearchBar.jsx:8`) nhưng `.search-bar` là tên rất dễ bị dùng lại ở trang học sinh. | `Admin.css:4198-4209` (rule gom), `.search-bar` định nghĩa `Admin.css:394,410` | Thêm tiền tố: `.admin-search-bar`. Không set `outline:none` toàn cục cho class generic. |
| **MAJOR** | Toàn app | `@keyframes spin` **định nghĩa 2 lần với duration khác nhau** (0.8s vs 1s). File load sau thắng → animation của file kia thành dead code, và tốc độ quay không xác định. | `Admin.css:7242` (0.8s), `features/admin/components/modals/modal.css:513` (1s) | Xoá 1 bản. Tốt nhất: dùng `ui/Spinner` (đã có `ui-spin`) thay vì `LoaderCircle + className="spin"` — hiện có ở `AdminQuizCreate.jsx:57`, `AdminQuizEdit.jsx:61`, `CreateQuizModal.jsx:474,574`. |
| **MAJOR** | `/admin/*` (mọi trang) | `ui.css` và `modal.css` **định nghĩa lại `.modal-overlay` với 2 màu nền khác nhau**: `rgba(0,0,0,0.4)` (`ui.css:8`) vs `rgba(0,0,0,0.5)` (`modal.css:7`) vs `rgba(15,23,42,0.46)` (`ui.css:190`, `modal.css:235`). Overlay sáng/tối khác nhau tuỳ thứ tự load. | `ui.css:8,190`; `modal.css:7,235` | Giữ 1 định nghĩa, dùng token `--color-overlay` (`tokens.css:27`). |
| **MAJOR** | `Admin.css` (7.255 dòng) | **110 màu hex khác nhau**, 745 lượt dùng. Nhiều màu lệch hẳn khỏi `tokens.css` (không tương đương token nào). | Xem bảng "Màu lạ" bên dưới | Thay dần bằng token. Bắt đầu từ 10 màu dùng nhiều nhất. |
| **MAJOR** | `Admin.css` | **250 class bị định nghĩa lại** trong cùng file. Ví dụ `.import-questions-modal-shell` **65 lần**, `.question-import-page-shell` **41 lần**, `.form-field` **30 lần**, `.question-bank-table` **19 lần**, `.difficulty-pill` **18 lần**, `.icon-btn` **17 lần**. Không thể đoán rule nào thắng. | `Admin.css:4964...5580` (65 chỗ); `.form-field`: `2109,2117,2118,2122,2123,2124,2139,2140,2141,2146,2152,2157,2158,2601,5129...` | Đây là dấu hiệu "CSS append-only". Cần một lượt dọn riêng, không gộp vào sprint UI. |
| **MAJOR** | `ui/StatTile` | Prop `value` và `label` **không có giá trị mặc định** (`StatTile.jsx:6-7`). Nếu thiếu, render ra chuỗi rỗng/`undefined` không có guard. | `components/ui/StatTile/StatTile.jsx:6-7` | Thêm `value = "", label = ""` hoặc return `null` nếu `!label`. |
| **MAJOR** | `ui/Field` | Khi `label` có nhưng `htmlFor` không được truyền, `<label>` render ra **không gắn với input nào** (`htmlFor={undefined}`) → click label không focus input, screen reader không đọc được tên field. Không có cảnh báo. | `components/ui/Field/Field.jsx:3-19` | Fallback sang `useId()` khi thiếu `htmlFor`. Hiện 20/20 chỗ gọi đều truyền `htmlFor` (đã kiểm tra), nhưng API vẫn cho phép sai. |
| **MAJOR** | `ui/Modal` / `features/admin/ui/Modal` | Cả 2 **không xử lý `onClose` null** ở overlay: `onClick={() => onCloseRef.current?.()}` — an toàn, nhưng nút X luôn render kể cả khi modal không cho đóng. Thiếu prop để ẩn nút X. | `ui/Modal/Modal.jsx:111-118`; `features/admin/components/ui/Modal.jsx:105-112` | Thêm `hideClose` prop. |
| **MAJOR** | `ImageCropModal` | `!important` ×3 để đè chính `modal-container` mà nó tự gắn: `max-width:640px !important; width:95% !important; padding:0 !important`. Đây là dấu hiệu component đang chống lại hệ thống modal thay vì dùng nó. | `ui/ImageCropModal/ImageCropModal.jsx:148` (`className="... modal-container"`); `ui/ImageCropModal/ImageCropModal.css:18,19,23` | Bỏ `modal-container` khỏi className, định nghĩa style riêng, xoá `!important`. |
| **MAJOR** | `Admin.css` | `.empty-state` định nghĩa **3 lần** (`3741` italic/xám, `4850` biến thể error, `4858` bản refresh). Trong JSX admin dùng như `<div className="empty-state">` (`AdminChapter.jsx:468,470,472`, `AdminChapterEdit.jsx:451,453`) trong khi chỗ khác dùng `ui/EmptyState` — **2 cách hiển thị empty state khác nhau trong cùng app**. | `Admin.css:308,3741,4850,4858`; JSX: `AdminChapter.jsx:468-472`, `AdminChapterEdit.jsx:451-453` | Thay bằng `ui/EmptyState` (đã import sẵn ở nhiều file admin). |
| **MAJOR** | `Admin.css` | `.admin-page-state` định nghĩa lại lần 2 ở `4857` dù đã có ở `296` — bản sau set `border/background/color` khác bản đầu. | `Admin.css:296-305` vs `4857-4864` | Xoá bản cũ. |
| **MINOR** | `features/admin/components/AdminPageState.jsx` | **Wrapper mỏng vô nghĩa**: bọc `ui/ErrorState` trong `<div className="admin-page-state error">` và bọc skeleton trong `<div className="admin-page-state">`. Lớp div này chỉ thêm border/background trùng với ErrorState (đã có `border: 1px solid var(--color-error-soft)`). | `AdminPageState.jsx:17-33`; `Admin.css:296-312` | Trả thẳng `ErrorState` / `<SkeletonCard>`, xoá wrapper + xoá `.admin-page-state`. |
| **MINOR** | `features/admin/components/ui/RowActions.css` | Class `g` xuất hiện như một class CSS thật (bị bắt bởi regex `.g` trong danh sách trùng) — **cần kiểm tra thủ công** đây là class thật hay là false-positive từ selector như `.row-actions__btn--labelled.g` / `svg`. | `features/admin/components/ui/RowActions.css` (cần xem dòng cụ thể) | Xác nhận thủ công. |
| **MINOR** | `Admin.css` | `@keyframes` đặt tên generic `fadeIn`, `slideIn` (không prefix) — dễ đụng. Hiện chưa đụng nhưng `fadeIn` nằm ở `ui.css:50` còn `slideIn` ở `modal.css:29`, cả hai đều là tên rất phổ biến. | `features/admin/components/ui/ui.css:50`; `features/admin/components/modals/modal.css:29` | Đổi thành `admin-modal-fade-in` / `admin-modal-slide-in`. |
| **MINOR** | `Admin.css:5809,5830` | `.adm2-badge--amber` và `.adm2-chip--amber` hardcode `#92400e` — đây là màu **lạ**, không có token tương đương (`--color-warning-strong` = `#b45309`). | `Admin.css:5809,5830` | Dùng `var(--color-warning-strong)`. Contrast `#92400e`/`#fffbeb` đạt (7.3:1) nên không phải lỗi a11y, chỉ là lệch token. |
| **MINOR** | `Admin.css:5812` | `.adm2-badge--dark` hardcode `background: #0f172a; color: #fff` — `#0f172a` chính là `--color-text`. | `Admin.css:5812` | `var(--color-text)`. |
| **MINOR** | `Admin.css` | 39 literal `rgba()` không dùng token. `tokens.css` đã có `--color-overlay` và các shadow token. | `Admin.css` (39 chỗ) | Thay dần. |
| **MINOR** | `Admin.css` | 16 giá trị `border-radius` px khác nhau: `2,4,5,6,7,8,9,10,12,13,14,16,18,20,999`. `tokens.css` chỉ có 5 (`8,12,16,24,999`). Giá trị `24px` (=`--radius-xl`) **không hề dùng**, còn `18px`, `14px`, `13px` là bịa thêm. | `Admin.css` — 18px×5, 14px×9, 13px×1, 9px×4 | Chuẩn hoá về 5 token. |
| **MINOR** | `Admin.css` | `font-size` px cứng bịa ngoài type scale: **11px** (×7), **13px** (×65), **13.5px** (×2), **15px** (×11), **17px** (×1), **21px** (×2), **23px** (×3), **26px** (×1), **28px** (×2), **34px** (×1), **64px** (×1). | `Admin.css:7003` (64px), `980` (34px), `1100,2396,3413` (23px), `1925,5006` (21px), `4406` (17px), `2818,2863` (13.5px) | Map về `--fs-*`. |
| **MINOR** | `Admin.css:6567` | Dùng `:has()` (`\.adm2-answer-option:has(.adm2-answer-radio:checked)`) và `Admin.css:1687,1692,5516`. `:has()` không hỗ trợ trên trình duyệt cũ và **không có fallback** → trạng thái "đã chọn" mất hoàn toàn. | `Admin.css:1687,1692,5516,6567` | Thêm class `.is-checked` từ JS làm fallback (React đã biết trạng thái). |
| **MINOR** | `ui/Toast` | `useToast()` khi không có Provider **im lặng trả no-op** (`Toast.jsx:68-76`). Toast biến mất không dấu vết → bug cực khó tìm. | `components/ui/Toast/Toast.jsx:66-77` | `console.warn` trong dev, hoặc throw ở dev. |
| **MINOR** | `ui/Toast` | `setTimeout` trong `show()` **không được clear** khi unmount → rò rỉ timer + `setState` trên component đã unmount. | `components/ui/Toast/Toast.jsx:23-33` | Lưu timer id, clear trong `useEffect` cleanup. |
| **MINOR** | `ui/Button` khi `to` được truyền | Render `<Link>` với `aria-disabled={disabled}` nhưng **không chặn điều hướng** và không chặn bàn phím → nút "disabled" vẫn click được. | `components/ui/Button/Button.jsx:39-45` | Khi `disabled`, `onClick={e => e.preventDefault()}` + `tabIndex={-1}`. |
| **MINOR** | `ui/Card` | `padding` chỉ nhận `none/sm/md/lg`; truyền giá trị lạ (vd `"xl"`) → class `ui-card--pad-xl` **không tồn tại** → card mất padding hoàn toàn, không cảnh báo. | `components/ui/Card/Card.jsx:14`; `Card.css:7-18` | Validate danh sách hợp lệ hoặc luôn có fallback `ui-card--pad-md`. |
| **MINOR** | `ui/Badge`, `ui/Button`, `ui/Card`, `ui/Input` | Cùng pattern enum-không-validate: `variant`/`size` sai → class CSS không tồn tại → mất style im lặng. | `Badge.jsx:11-18`; `Button.jsx:19-28`; `Card.jsx:12-19`; `Input.jsx:8-15` | Dùng một map hằng số + fallback về mặc định. |
| **MINOR** | `ui/StatTile` | `value` không được xử lý khi `null`/`undefined` — sẽ hiện "undefined". Đã kiểm tra: **tất cả 21 chỗ gọi hiện tại đều truyền giá trị hợp lệ** nên chưa lộ. | `StatTile.jsx:16`; các chỗ gọi: `QuizResultPage.jsx:267-270`, `SubjectDetailPage.jsx:476-478`, `QuizTakingPage.jsx:1117-1123`, ... | Guard `value ?? "—"`. |
| **MINOR** | `ui/EmptyState` | `title` mặc định tốt, nhưng `icon={null}` → render icon mặc định `Inbox`; không có cách tắt icon. | `EmptyState.jsx:4,13` | Thêm `icon={false}` để ẩn. |
| **MINOR** | Toàn app | **Không có component `Pill`/`Chip`/`Tag` dùng chung.** Đã có `Badge` nhưng feature tự vẽ lại: `.home-chip`, `.home-kicker-chip`, `.subject-card__meta-pill`, `.filter-chip` (`QuizResultPage.css:273`), `.quiz-page-pill` (`QuizTakingPage.css:452`), `.adm2-chip`, `.adm2-status-chip`, `.adm2-count-pill`, `.diff-badge`, `.chapter-nav__locked-tag`, `.quiz-nav-row__warning-tag`. | Danh sách dài — xem grep `.*-pill\|.*-badge\|.*-chip` | `Badge` đã đủ khả năng (có `size="sm"`). Thay dần các chip đơn giản. |
| **MINOR** | Toàn app | Tương tự, **không có component `ProgressBar` dùng chung** — chỉ có `ProgressRing`. Feature tự vẽ `ProgressBar` riêng ở `features/home/components/ProgressBar.jsx` (viết đúng, có ARIA đầy đủ) nhưng không ở `ui/`. | `features/home/components/ProgressBar.jsx:1-23` | Chuyển lên `ui/ProgressBar` (đã có ARIA đúng, chi phí ~0). |
| **UPGRADE** | Toàn app | Chuyển `Admin.css` sang **CSS Modules** (`Admin.module.css`) để hết trùng tên vĩnh viễn. Vite hỗ trợ sẵn, không thêm dependency. | Kiến trúc | Ước lượng: **3–5 ngày** cho 7.255 dòng. Rủi ro cao, cần làm từng trang. |

---

## 1. Chi tiết: `src/features/` tự viết lại thứ đã có trong `src/components/ui/`

### 1.1 Modal — có **3** implementation

| # | File | Ghi chú |
|---|---|---|
| 1 | `components/ui/Modal/Modal.jsx` | **Bản chuẩn.** Portal, focus trap, `aria-modal`, `aria-labelledby`, khoá scroll, trả focus, `size sm/md/lg`, `footer`, `title`. |
| 2 | `features/admin/components/ui/Modal.jsx:1-125` | **Bản copy ~95%.** Cùng `FOCUSABLE_SELECTOR` (`:6-13` vs `:8-15`), cùng logic Tab (`:47-76` vs `:47-76`), cùng Escape, cùng trả focus. Khác: dùng class `modal-overlay`/`modal-container` thay vì `ui-modal*`, và **bug**: `aria-labelledby={labelId}` nhưng `id` gắn cho `<h2>` lại là `generatedTitleId` (`:115`) — **nếu truyền `labelledById` từ ngoài thì `labelId` trỏ tới id không tồn tại → modal mất tên**. |
| 3 | `components/ui/ImageCropModal/ImageCropModal.jsx:10-102` | **Bản copy thứ 3**, thêm capture-phase + `stopImmediatePropagation`. |

**Bug cụ thể của bản #2** (đáng báo riêng):
```
features/admin/components/ui/Modal.jsx:28   const labelId = labelledById || (title ? generatedTitleId : undefined);
features/admin/components/ui/Modal.jsx:101  aria-labelledby={labelId}
features/admin/components/ui/Modal.jsx:115  <h2 id={generatedTitleId} ...>
```
→ Khi `labelledById` được truyền (mọi modal admin đều truyền, ví dụ `ConfirmActionModal.jsx:30`, `ConfirmDeleteModal.jsx:52`), `aria-labelledby` trỏ tới một id **không hề tồn tại trong DOM**. Modal mất accessible name. **Ảnh hưởng: mọi modal admin.**

### 1.2 Empty state

| File | Dòng | Ghi chú |
|---|---|---|
| `components/ui/EmptyState/EmptyState.jsx` | chuẩn | Đủ `icon/title/description/action` |
| `Admin.css` `.empty-state` | `308, 3741, 4850, 4858` | Bản tự vẽ, **3 lần**, `font-style: italic` ở bản gốc |
| `AdminChapter.jsx` | `468, 470, 472` | Dùng `<div className="empty-state">` thô |
| `AdminChapterEdit.jsx` | `451, 453` | Dùng `<div className="empty-state">` thô |
| `AdminUsers.css` `.admin-empty-state` | `75, 82` | Bản tự vẽ **thứ 4** của cùng khái niệm |

### 1.3 Error state

| File | Dòng | Ghi chú |
|---|---|---|
| `components/ui/ErrorState/ErrorState.jsx` | chuẩn | |
| `Admin.css` `.admin-page-state.error` | `307-312`, `4849` | Bản tự vẽ |
| `AdminUsers.css` `.admin-error-text` | `76, 87` | Bản tự vẽ |
| `Admin.css` `.modal-inline-error` | `314, 4848` | Bản tự vẽ (inline trong modal), **trùng ở 3 file** |
| `Admin.css` `.dashboard-error` | `131` | Bản tự vẽ |
| `AdminProfile.css` `.admin-profile-error` | `33` | Bản tự vẽ |

### 1.4 Skeleton / Loading

| File | Dòng | Ghi chú |
|---|---|---|
| `components/ui/Skeleton/Skeleton.jsx` | chuẩn | `Skeleton` + `SkeletonCard` |
| `Admin.css` `.question-bank-row-skeleton` | `1583-1598` | **Tự viết lại shimmer** + `@keyframes question-bank-shimmer` riêng, thay vì dùng `Skeleton` (đã import sẵn trong `DataTable.jsx:3`) |
| `Admin.css` `.admin-loading-placeholder` | `502-507` | Bản text-loading tự vẽ |
| `Admin.css` `.quiz-inline-empty` | dùng ở `AdminQuizQuestions.jsx:289,322`, `CreateQuizModal.jsx:497,598` | Loading text tự vẽ |
| `AdminQuizCreate.jsx:57`, `AdminQuizEdit.jsx:61`, `CreateQuizModal.jsx:474,574` | `<LoaderCircle className="spin" />` | **Tự chế spinner** thay `ui/Spinner` — nguồn gốc của `@keyframes spin` trùng |

**Ghi chú tích cực:** các trang học sinh (`QuizTakingPage.jsx:659`, `TheoryPage.jsx:127`, `QuizResultPage.jsx:152`, `SubjectDetailPage.jsx:376`, `ProfilePage.jsx:383`) **đều dùng `ui/Spinner` đúng cách**. Vấn đề chỉ nằm ở admin.

### 1.5 Badge/Pill

`ui/Badge` tồn tại và **làm đúng** (contrast đạt). Nhưng feature tự vẽ **~15 biến thể khác**:
`Admin.css:1480-1547` (`.difficulty-pill`, `.published-pill`, `.unpublished-pill`, `.status-pill`, `.preview-difficulty`), `Admin.css:5795-5831` (`.adm2-badge--*`, `.adm2-chip--*`), `Admin.css:5938` (`.adm2-count-pill`), `Admin.css:6539` (`.adm2-status-chip`), `Admin.css:6906` (`.question-import-diff-badge`), `AdminUsers.css:92-115` (`.status-badge--*`), `ImportSkillsModal.css:497-518` (`.skill-status-pill.*`), `HomePage.css:29,77` (`.home-kicker-chip`, `.home-chip`), `SubjectCard.css:76` (`.subject-card__meta-pill`), `QuizResultPage.css:273` (`.filter-chip`), `QuizTakingPage.css:452` (`.quiz-page-pill`), `SubjectDetailPage.css:231,324,450`.

### 1.6 Toast — **KHÔNG có bản tự vẽ.** ✅ Đây là điểm sáng: `ToastProvider` được dùng nhất quán ở `MainLayout.jsx:5,180` và `AdminLayout.jsx:5,38`.

### 1.7 Button
`ui/Button` tồn tại nhưng `.add-btn` (13 định nghĩa), `.cancel-btn` (9), `.danger-btn` (8), `.submit-btn` (6), `.back-btn` (7), `.icon-btn` (17), `.outline-action` (11), `.import-question-btn` (7), `.view-questions-btn` (8), `.filter-btn` (4), `.preview-toggle` (6), `.table-actions button` (9), `.admin-btn--*` — **tất cả đều là Button tự vẽ lại**, và tất cả đều được gom vào rule `:focus-visible` thủ công ở `Admin.css:4188-4210` — tức là tác giả phải **liệt kê tay** từng class để bù cho việc không dùng `Button`.

---

## 2. Màu hardcode lệch `tokens.css`

### 2.1 Top màu dùng nhiều (Admin.css) — đều đã có token

| Hex | Số lần | Token tương đương | Dòng ví dụ |
|---|---|---|---|
| `#fff` | 63 | `--color-surface` | 36, 66, 90, 477, 600 |
| `#e2e8f0` | 57 | `--color-border` | 67, 299, 475, 515, 673 |
| `#047857` | 56 | `--color-primary-700` | 46, 102, 206, 504, 1047 |
| `#64748b` | 49 | `--color-text-muted` | 302, 494, 587, 676, 1093 |
| `#10b981` | 40 | `--color-primary` | 45, 100, 106, 261, 288 |
| `#0f172a` | 35 | `--color-text` | 981, 1008, 1099, 1149, 1182 |
| `#f8fafc` | 28 | `--color-surface-2` | 301, 518, 547, 1129, 1246 |
| `#ecfdf5` | 25 | `--color-primary-soft` | 101, 503, 683, 1087, 1408 |
| `#059669` | 23 | `--color-primary-600` | 277, 574, 684, 688, 703 |
| `#111827` | 22 | (≈ `--color-text`) | 488, 780, 1034, 1640, 1654 |
| `#94a3b8` | 16 | `--color-text-subtle` | 517, 606, 614, 1154, 1390 |
| `#fecaca` | 14 | (không có token) | 309, 318, 2692, 2724, 2994 |
| `#334155` | 14 | (không có token) | 37, 91, 560, 1218, 1295 |
| `#d8dde6` | 12 | (màu lạ border) | 34, 1032, 1651, 2368, 2561 |
| `#b91c1c` | 11 | `--color-error-strong` | 1521, 2750, 2897, 3037, 3140 |
| `#ffffff` | 11 | `--color-surface` | 1383, 2831, 4071, 4081, 4118 |
| `#cbd5e1` | 11 | `--color-border-strong` | 88, 598, 1917, 1976, 2223 |
| `#e5e7eb` | 11 | (màu lạ border, ≈ `#e2e8f0`) | 149, 250, 331, 399, 427 |
| `#ef4444` | 10 | `--color-error` | 3556, 3557, 5811, 5831, 5973 |
| `#fef2f2` | 10 | `--color-error-soft` | 310, 320, 3036, 3558, 5706 |

### 2.2 "Màu lạ" — không tương đương token nào trong `tokens.css`

| Hex | Số lần | Dòng ví dụ | Ghi chú |
|---|---|---|---|
| `#d8dde6` | 12 | 34, 1032, 1651, 2368, 2561 | Border xám — gần `--color-border` nhưng không khớp |
| `#fecaca` | 14 | 309, 318, 2692, 2724, 2994 | Border đỏ nhạt |
| `#334155` | 14 | 37, 91, 560, 1218, 1295 | Chữ xám đậm — gần `--color-text` nhưng không khớp |
| `#e5e7eb` | 11 | 149, 250, 331, 399, 427 | Tailwind gray-200, lệch `--color-border` |
| `#d8fae5` | 7 | 1497, 1539, 2287, 2571, 3011 | Xanh lá nhạt — lệch `--color-primary-100` (#d1fae5) |
| `#fffbeb` | 6 | 5760, 5809, 5830, 6025, 6757 | ≈ `--color-warning-soft` |
| `#fde68a` | 6 | 2293, 5758, 6024, 6653, 6755 | Vàng — không có token |
| `#fee2e2` | 6 | 1520, 2749, 2896, 3766, 5705 | Đỏ nhạt |
| `#475569` | 6 | 1477, 1865, 2532, 2612, 3093 | Xám |
| `#eff6ff` | 6 | 1886, 2467, 2638, 3005, 5813 | ≈ `--color-info-soft` |
| `#92400e` | 5 | 2902, 5761, 5809, 5830, 6026 | Nâu cam — lệch `--color-warning-strong` (#b45309) |
| `#6ee7b7` | 4 | 5603, 5644, 6731, 6795 | ≈ `--color-primary-300` |
| `#667085` | 4 | 988, 1834, 3122, 3384 | Xám |
| `#bfdbfe` | 4 | 2636, 3004, 5198, 5439 | Xanh dương nhạt |
| `#1e293b` | 4 | 3583, 3684, 6721, 6788 | ≈ `--color-text` |
| `#be123c` | 4 | 1516, 2303, 2727, 2996 | Đỏ hồng |
| `#1d4ed8` | 4 | 2468, 2639, 3006, 5201 | Xanh dương đậm (= màu Badge dùng, **đúng**) |
| `#e6f4ea` | 3 | 727, 831, 897 | Xanh lá nhạt |
| `#166534` | 3 | 2932, 6843, 6870 | Xanh lá đậm |
| `#fffafa` | 3 | 2154, 4752, 5283 | Trắng hồng |
| `#dcfce7` | 3 | 2474, 2744, 4715 | Xanh lá nhạt |
| `#98a2b3` | 3 | 1818, 1919, 3407 | Xám |
| `#065f46` | 3 | 934, 962, 3712 | `--color-primary-800` |
| `#246bfe` | — | `Admin.css:1051` | Xanh dương **hoàn toàn ngoài palette** (dùng ở `.outline-action.blue`) |
| `#34c759` | — | `Admin.css:960` | Xanh iOS green — ngoài palette |
| `#b7d6c7` | — | `Admin.css:1451` | Xanh mint — ngoài palette |
| `#dce5ef` | — | `Admin.css:1215` | Xám xanh — ngoài palette |
| `#7b8794` | — | `Admin.css:443` | Xám — ngoài palette |
| `#243b53` | — | (nếu có) | cần kiểm tra thủ công |
| `#0b1220` | — | `AdminProfile.css:88,106` | **Gần đen, ngoài palette** — không có token nào gần |

### 2.3 File CSS **sạch token** (điểm sáng, nên làm mẫu)

Các file dưới đây có **0 hex hardcode**, chỉ dùng `var(--*)`:
`features/auth/**/*.css` (toàn bộ), `features/home/pages/HomePage/HomePage.css`, `features/subjects/components/SubjectCard.css`, `features/progress/**/*.css`, `features/history/**/*.css`, `components/ui/Card/Card.css`, `components/ui/Field/Field.css`, `components/ui/Input/Input.css`, `components/ui/Modal/Modal.css`, `components/ui/EmptyState/EmptyState.css`, `components/ui/StatTile/StatTile.css`, `components/ui/ErrorState/ErrorState.css`, `components/ui/ProgressRing/ProgressRing.css`, `components/ui/Skeleton/Skeleton.css`, `components/ui/Toast/Toast.css`, `components/ui/ProgressRing/ProgressRing.css`, `features/auth/styles/authShared.css` (mẫu viết CSS tốt nhất dự án).

**Trừ `ImageCropModal.css` (6 hex), `Badge.css` (4), `Button.css` (3), `Spinner.css` (1), `SubjectImageField.css` (8)** — các file `ui/` còn lại đều sạch. Nghĩa là: **thư viện `ui/` đang tốt, feature đang phá chuẩn.**

---

## 3. CSS class trùng tên giữa các feature

### 3.1 Trùng giữa `Admin.css` và file ngoài admin (nguy hiểm nhất)

| Class | Định nghĩa ở | Nguy cơ |
|---|---|---|
| `.subject-card` | `Admin.css:422,438,630,636,654,661,3780,4225,4247,4388,6484,6489,6493,6502` + `features/subjects/components/SubjectCard.css:1` | **BLOCKER** — học sinh bị ảnh hưởng |
| `.search-bar` | `Admin.css:394,410` + `Admin.css:4198` | Selector trần, dễ đụng |
| `.search-input` | `Admin.css:742,4199,4317` | Selector trần |
| `.question-content` | `Admin.css:907` + `QuizTakingPage.jsx:108` + `AdaptiveQuizPage.jsx:244` | **Rule admin áp lên nội dung câu hỏi của học sinh** |
| `.cancel-btn` | `Admin.css` + `modal.css:156,296` + `ui.css:123,136` + `AdminQuizzes.css` + `ImageCropModal.jsx:252` | 4 file |
| `.add-btn` | `Admin.css` + `AdminQuizzes.css:256` + `ImageCropModal.jsx:261` + `Admin.css:256` | `ImageCropModal` (ui/) dùng class admin |
| `.is-active` | `SubjectImageField.css:50` + `Admin.css` + `AdminAccess.css` + `QuizResultPage.css:289` + `QuizTakingPage.css:473` + `SubjectsPage.css` | 6 file |
| `.is-danger` | `SubjectImageField.css:142` + `Admin.css` + `RowActions.css` + `AdminQuizzes.css` | 4 file |
| `.active` | `Sidebar.css` + `Admin.css` + `ImportSkillsModal.css` + `TheoryPage.css` + `SubjectDetailPage.css` | 5 file |
| `.empty-state` | `Admin.css:308,3741,4850,4858` | 4 định nghĩa |
| `.chatbox-messages`, `.chatbox-input-row` | `ChatBox.css` + `TheoryPage.css` | TheoryPage chép class của ChatBox |
| `.question-actions` | `Admin.css:912` + `QuizTakingPage.css` | Đụng |
| `.answer-item` | `Admin.css:948` + `ui.css:152` | Đụng |
| `.correct` | `Admin.css:959` + `ui.css:177,182` | Đụng |
| `.form-group`, `.form-row`, `.form-body`, `.form-header`, `.form-actions`, `.form-modal` | `modal.css` + `ui.css` + `Admin.css` | Đụng chéo 3 file |
| `.stat-card`, `.stats-grid`, `.quick-action`, `.subject-grid`, `.data-table*`, `.row-actions*`, `.modal-*`, `.status-badge*`, `.filter-select`, `.difficulty-pill`, `.skill-card`, `.chapter-card` | `Admin.css` + file page tương ứng | Mỗi class 2–5 định nghĩa |

### 3.2 Selector quá rộng / trần

| Selector | File:dòng | Đánh giá |
|---|---|---|
| `html, body` | `styles/global.css:6-11` | **Hợp lệ** — reset toàn cục có chủ đích |
| `button { font-family: inherit; transition: ... }` | `styles/global.css:50-54` | **Hợp lệ** — reset có chủ đích, không set màu |
| `:where(a, button, ...):focus-visible` | `styles/global.css:58-61` | **Xuất sắc** — dùng `:where()` để specificity = 0. Đây là mẫu đúng. |
| `:root { --ap-* }` | `features/admin/pages/AdminProfile.css:1-17` | ⚠️ **Khai báo biến toàn cục từ trong file page.** 11 biến `--ap-*` rò ra `:root`. Nên scope vào `.admin-profile-page`. |
| `.spin` | `features/admin/Admin.css:7239` | ⚠️ Class 1 từ, cực dễ đụng |
| `.role` | `Admin.css:105` | ⚠️ Class 1 từ |
| `.separator` | `Admin.css:785` | ⚠️ Class 1 từ |
| `.ok`, `.warn`, `.success`, `.error`, `.danger`, `.delete`, `.selected`, `.primary`, `.correct` | `Admin.css`, `ImportSkillsModal.css:508-518`, `AdminQuizzes.css` | ⚠️ Modifier dùng như class độc lập — rất dễ đụng |
| `.search-bar:focus`, `.search-input:focus` (trong rule gom) | `Admin.css:4198-4199` | ⚠️ Set `outline: none` cho class generic |
| `.table-actions button`, `.template-actions button`, `.question-bank-active-line button`, `.question-pagination button`, `.question-bank-table th button` | `Admin.css` | ⚠️ Selector mô tả `button` trần trong scope class — chấp nhận được nhưng nên là class riêng |
| `.question-bank-table td::before { content: attr(data-label) }` | `Admin.css:1761-1771` | ✅ Cách làm responsive table tốt |

**Kết luận mục 3:** `global.css` **đạt chuẩn** (`:where()` cho focus là quyết định kỹ thuật tốt). Vấn đề **100% nằm ở `features/`, đặc biệt `Admin.css`**.

---

## 4. Kiểm tra prop bắt buộc / children rỗng của từng component `ui/`

| Component | Prop không có default | Xử lý children rỗng | Đánh giá |
|---|---|---|---|
| `Button.jsx` | — (tất cả có default) | ✅ `children && <span>` (`:34`) | Tốt |
| `Card.jsx` | — | ✅ render thô | Tốt. `padding` không validate → mất padding im lặng |
| `Badge.jsx` | — | ❌ render `{children}` trực tiếp → badge rỗng vẫn chiếm chỗ với `padding` | Thiếu guard |
| `Input.jsx` | — | n/a | Tốt |
| `Field.jsx` | `label`, `htmlFor` không default | ✅ `{label && ...}` (`:14`) | Tốt, nhưng `htmlFor` undefined không cảnh báo |
| `Modal.jsx` | `open`, `onClose`, `title` | ✅ | Tốt. Không có `hideClose` |
| `EmptyState.jsx` | — | ✅ | Tốt |
| `ErrorState.jsx` | — | ✅ | Tốt |
| `Spinner.jsx` | — | n/a | Tốt (`role="status"` + `aria-label`) |
| `Skeleton.jsx` | — | n/a | Tốt (`aria-hidden`) |
| `ProgressRing.jsx` | — | ✅ clamp `0..100` | **Tốt nhất thư viện** — có clamp + aria-label |
| **`StatTile.jsx`** | **`value`, `label`** | n/a | ❌ **Thiếu default** |
| `Toast.jsx` | — | ✅ | ❌ Provider fallback im lặng; timer không clear |
| `ImageCropModal.jsx` | `open`, `imageSrc`, `onClose` | ✅ | ❌ Tự viết focus trap; `!important` |
| `SubjectImageField.jsx` | `onChange` | ✅ | Tốt. `label`/`hint` có default |

---

## 5. Danh sách gộp/xoá cụ thể — xếp theo số chỗ dùng lại được

| # | Hành động | Số chỗ dùng lại | File:dòng | Effort |
|---|---|---|---|---|
| 1 | **Xoá `features/admin/components/ui/Modal.jsx`, dùng `ui/Modal`** | **~20 modal** | `AddChapterModal.jsx`, `AddQuestionModal.jsx`, `AddSubjectModal.jsx`, `AddTheoryModal.jsx`, `AdminChangeEmailModal.jsx`, `AdminChangePasswordModal.jsx`, `AdminEditProfileModal.jsx`, `AuthorizationModal.jsx`, `ConfirmActionModal.jsx`, `ConfirmDeleteModal.jsx`, `CreateQuizModal.jsx`, `EditTheoryModal.jsx`, `ImportDifficultyArrayModal.jsx`, `ImportQuestionsModal.jsx`, `ImportSkillsModal.jsx`, `ResetPasswordModal.jsx`, `SkillFormModal.jsx`, `AdminQuestion.jsx:25` | **S** — đổi import; cần map class `modal-container` → `ui-modal`. **Đồng thời fix bug `aria-labelledby`.** |
| 2 | **Gộp `modal.css` + `ui.css` + block modal trong `Admin.css` thành 1 file** | ~20 modal, ~30 class | `modal.css:1-520`, `ui.css:1-235`, `Admin.css:4792-4848`, `Admin.css:5487-5553` | **M** — rủi ro regression cao, cần test từng modal |
| 3 | **Thay `.add-btn`/`.cancel-btn`/`.danger-btn`/`.submit-btn` bằng `ui/Button`** | `.add-btn` 13 định nghĩa / ~60 chỗ gọi; `.cancel-btn` ~50 chỗ | `Admin.css:256-290,4032-4192` + toàn bộ modal admin | **M** — cơ học nhưng chạm nhiều file |
| 4 | **Thay `.empty-state` thô bằng `ui/EmptyState`** | 5 chỗ JSX | `AdminChapter.jsx:468,470,472`; `AdminChapterEdit.jsx:451,453` | **S** |
| 5 | **Xoá `.status-badge*` (dead code + contrast sai)** | 0 chỗ dùng | `AdminUsers.css:92-115` | **XS** — xoá thuần |
| 6 | **Xoá `AdminPageState.jsx` wrapper, dùng thẳng `ErrorState`/`SkeletonCard`** | 8 trang admin | `AdminPageState.jsx:1-37`; `Admin.css:296-312` | **S** |
| 7 | **Thay `LoaderCircle + .spin` bằng `ui/Spinner`, xoá 2 `@keyframes spin`** | 4 chỗ | `AdminQuizCreate.jsx:57`; `AdminQuizEdit.jsx:61`; `CreateQuizModal.jsx:474,574`; `Admin.css:7239-7246`; `modal.css:510-518` | **XS** |
| 8 | **Đưa `features/home/components/ProgressBar.jsx` lên `ui/ProgressBar`** | 1–2 chỗ | `ProgressBar.jsx:1-23` | **XS** |
| 9 | **Fix contrast 4 chỗ badge sai** | `AdminUsers.jsx:287`, `AdminSubjects.jsx:303`, `AdminQuestionCreate.jsx:77`, `AdminQuizzes.jsx:266` | `Admin.css:5811,5813,5831,6549-6550` | **XS** — đổi 4 dòng CSS |
| 10 | **Đổi `.subject-card` admin → `.adm2-subject-card`** | 1 trang | `AdminSubjects.jsx:240` + `Admin.css:14 selector` | **S** — nhưng **ưu tiên cao nhất về rủi ro** |
| 11 | **Scope `:root` trong `AdminProfile.css`** | 1 file | `AdminProfile.css:1-17` | **XS** |
| 12 | **Xoá `.question-bank-row-skeleton` + `@keyframes question-bank-shimmer`, dùng `Skeleton`** | 1 chỗ | `Admin.css:1583-1598` | **XS** |
| 13 | **Chuẩn hoá `border-radius` 16 giá trị → 5 token** | ~160 chỗ | `Admin.css` | **L** |
| 14 | **Chuẩn hoá `font-size` 198 chỗ → `--fs-*`** | 198 chỗ | `Admin.css` | **L** |
| 15 | **Thay 745 lượt hex → token** | 745 chỗ | `Admin.css` (+`ImportSkillsModal.css` 112, `AdminProfile.css` 58, `modal.css` 57, `AdminQuizzes.css` 31, `AdminUsers.css` 28, `ui.css` 27, `AdminDashboard.css` 21) | **XL** — làm dần theo trang |

---

## 6. Top 5 nên làm trước (xếp theo impact / effort)

### 🥇 1. Sửa 4 dòng CSS contrast badge — `Admin.css:5811, 5813, 5831, 6549`
- **Impact:** Cao — sửa lỗi WCAG AA thật, ảnh hưởng mọi badge xanh dương/đỏ ở `/admin/users`, `/admin/subjects`, `/admin/quizzes`, `/admin/questions/new`.
- **Effort:** XS — đổi `var(--color-error)` → `var(--color-error-strong)`, `var(--color-info)` → `#1d4ed8`. **Copy nguyên từ `ui/Badge/Badge.css:37-44` đang làm đúng.**
- **Rủi ro:** Gần như 0 (chỉ đổi màu chữ đậm hơn).

### 🥈 2. Đổi `.subject-card` của admin sang `adm2-subject-card` — `Admin.css` (14 selector) + `AdminSubjects.jsx:240`
- **Impact:** Cao — đây là **BLOCKER duy nhất ảnh hưởng tới trang học sinh**. `min-height:178px` + `cursor:pointer` từ admin có thể đè card môn học thật.
- **Effort:** S — đổi tên class trong `AdminSubjects.jsx` và thay `subject-card` → `adm2-subject-card` trong `Admin.css`.
- **Rủi ro:** Thấp, nhưng **phải verify trên trình duyệt** cả `/app/subjects` và `/admin/subjects` (không làm được trong phiên này vì thiếu tài khoản test).

### 🥉 3. Fix bug `aria-labelledby` của modal admin — `features/admin/components/ui/Modal.jsx:28, 101, 115`
- **Impact:** Cao — **mọi modal admin mất accessible name**. Đây là bug thật, không phải vấn đề style.
- **Effort:** XS — một dòng: `<h2 id={labelId} ...>` (dùng `labelId` thay `generatedTitleId`).
- **Rủi ro:** 0.

### 4. Xoá 2 bản copy modal + gộp về `ui/Modal` (`ImageCropModal.jsx:10-102`, `features/admin/components/ui/Modal.jsx`)
- **Impact:** Cao — xoá ~200 dòng trùng lặp, hết 3 nguồn bug focus-trap, hết xung đột `!important`, hết 2 màu overlay khác nhau.
- **Effort:** M — `ImageCropModal` cần render trong `ui/Modal` (bỏ `createPortal` riêng); admin modal cần map class.
- **Rủi ro:** Trung bình — modal lồng nhau (`ImageCropModal` mở trên modal cha) là case khó, **cần test tay kỹ**.

### 5. Xoá dead code + đồng bộ loading: `.status-badge*`, `.empty-state` thô, `LoaderCircle + .spin`, `@keyframes spin` trùng, `question-bank-row-skeleton`
- **Impact:** Trung bình-cao — giảm ~250 dòng CSS chết, hết 2 định nghĩa `@keyframes spin` xung đột, hết 2 cách hiển thị empty state.
- **Effort:** S — thuần xoá + đổi vài JSX sang `ui/Spinner` / `ui/EmptyState`.
- **Rủi ro:** Thấp. Riêng `.empty-state` cần đối chiếu để không mất style `error`.

---

## 7. Điểm sáng — KHÔNG nên đụng

Để công bằng, đây là những thứ đang làm **đúng chuẩn** và nên là mẫu cho phần còn lại:

| Điểm sáng | File:dòng |
|---|---|
| `:where()` cho focus-visible toàn app, specificity = 0 | `styles/global.css:56-61` |
| `tokens.css` là single source of truth, có comment rõ ràng | `styles/tokens.css:1-120` |
| `ProgressRing` — clamp `0..100`, `role="img"`, `aria-label` fallback | `ui/ProgressRing/ProgressRing.jsx:14, 24` |
| `Toast` — dùng nhất quán, `role="region"` + `aria-live="polite"`, responsive | `ui/Toast/Toast.jsx:46`; `Toast.css:77-83` |
| `Modal` chuẩn — focus trap, khoá scroll, trả focus, `aria-modal` | `ui/Modal/Modal.jsx:34-104` |
| `StatTile` — `overflow-wrap: anywhere` cho số dài (có comment giải thích) | `ui/StatTile/StatTile.css:34-35` |
| `DataTable` — `aria-sort`, keyboard sort, skeleton khi loading, empty state, phân trang server/client | `features/admin/components/ui/DataTable.jsx:164-194, 200-243` |
| `RowActions` — portal + `position:fixed` để không bị `overflow` cắt, tự lật lên khi gần đáy | `features/admin/components/ui/RowActions.jsx:38-58, 79` |
| Toàn bộ `features/auth/**` + `authShared.css` — 0 hex hardcode, token thuần | `features/auth/styles/authShared.css:1-135` |
| Trang học sinh dùng `ui/Spinner` đúng ở mọi chỗ loading | `QuizTakingPage.jsx:659`, `TheoryPage.jsx:127`, `QuizResultPage.jsx:152`, `SubjectDetailPage.jsx:376`, `ProfilePage.jsx:383` |
| `SubjectCardSkeleton` — mô phỏng đúng thứ tự khối card thật để tránh layout shift (có comment) | `features/home/components/SubjectCardSkeleton.jsx:4-8` |
| Responsive table bằng `td::before { content: attr(data-label) }` | `Admin.css:1761-1771` |

---

## 8. Điều CHƯA kiểm tra được (cần làm thủ công)

Vì **không có tài khoản test**, các mục sau trong yêu cầu audit **chưa verify được**:

1. **Responsive 360 / 768 / 1280px** — chưa render lần nào. Có đọc media query tĩnh nhưng chưa xác nhận layout thực tế.
2. **Trạng thái 401/403/500 thực tế** — có đọc `ErrorState`/`ProtectedRoute` nhưng chưa gọi API thật.
3. **Thứ tự cascade thực tế** giữa `Admin.css` / `modal.css` / `ui.css` — suy luận từ import, chưa xác nhận bằng DevTools Computed Styles.
4. **`Admin.css` dòng 4964–5580** (`import-questions-modal-shell` 65 định nghĩa) — quá lớn để đọc hết trong phiên; đã đếm nhưng chưa phân tích từng rule.
5. **Class `g`** trong danh sách trùng (`RowActions.css`) — nghi là false-positive của regex, chưa xác nhận.
6. **`#243b53`** — nghi là màu lạ, chưa tìm được dòng cụ thể.
7. **Alt text của ảnh** — đã thấy `alt={subject.name}` (`SubjectCard.jsx:33`), `alt="Ảnh môn học"` (`SubjectImageField.jsx:213`), `alt=""` cho avatar trang trí (`MainLayout.jsx:154`, `Sidebar.jsx:147` — **đúng**, avatar đã có `aria-label` ở nút cha) nhưng chưa quét hết mọi `<img>`.
8. **Focus nhìn thấy được trên từng màn hình** — chưa tab thử.

**Để hoàn tất audit này, cần: tài khoản test (1 ADMINISTRATOR + 1 STUDENT) và chạy `npm run dev` tại cổng 5174.**
