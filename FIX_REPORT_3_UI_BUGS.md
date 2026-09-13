# Báo cáo sửa 3 lỗi UI — quizcit-web

**Nhánh:** `fix/ui-audit`
**Phạm vi đã sửa:** đúng 3 file — `src/routes/index.jsx`, `src/features/admin/Admin.css`, `src/styles/tokens.css`
**Không đụng:** backend, `src/services/`, JSX nào khác, dependency nào.

Kiểm chứng bằng `git status --porcelain`:
```
 M src/features/admin/Admin.css
 M src/routes/index.jsx
 M src/styles/tokens.css
```
(Hai file `??` là tài liệu có từ trước, không phải thay đổi của phiên này.)

---

## 1. Bảng tổng kết

| Fix | File đã sửa | Số dòng thay đổi | Tóm tắt một câu |
|---|---|---|---|
| FIX 1 | `src/routes/index.jsx` | +6 / −2 (net +4) | Chuyển `AdminLayout` từ import tĩnh sang `lazy()` + bọc bằng `withSuspense` sẵn có, giữ nguyên `ProtectedRoute` làm lớp ngoài, nhờ đó `Admin.css` không còn nằm trong gói khởi động. |
| FIX 2 | `src/features/admin/Admin.css` | 20 selector (net −? xem diff; chỉ đổi selector) | Thêm tiền tố `.admin-layout` vào mọi selector chứa `.subject-card` / `.subject-card-actions`, không đổi một giá trị thuộc tính nào. |
| FIX 3 | `src/features/admin/Admin.css` + `src/styles/tokens.css` | 2 dòng màu + 1 biến mới + 1 comment | Đổi chữ của `.adm2-badge--red` sang `--color-error-strong`; thêm token `--color-info-strong: #1d4ed8` vào `tokens.css` và cho `.adm2-badge--info` trỏ tới nó. |

**Tổng diff:** `3 files changed, 30 insertions(+), 23 deletions(-)`

---

## 2. Output thật của test / lint / build

### 2.1 `npm run test` — ❌ KHÔNG chạy được trong môi trường này (lỗi sandbox, KHÔNG phải do code)

```
> quizcit-web@0.0.0 test
> node --test "src/**/*.test.js"

✖ src\components\richtext\richTextBlocks.test.js (15.5938ms)
✖ src\components\richtext\richTextSchema.test.js (14.2497ms)
... (toàn bộ 33 file test đều ✖)
ℹ tests 33
ℹ suites 0
ℹ pass 0
ℹ fail 33
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 64.4454

✖ failing tests:
test at src\components\richtext\richTextBlocks.test.js:1:1
✖ src\components\richtext\richTextBlocks.test.js (15.5938ms)
  Error: spawn EPERM
      at ChildProcess.spawn (node:internal/child_process:441:11)
      errno: -4048,
      code: 'EPERM',
      syscall: 'spawn'
```

**Đã chứng minh đây là lỗi môi trường, không phải do thay đổi của tôi.** Tôi stash đúng 3 file của mình rồi chạy lại trên cây nguyên bản:

```
=== stash my changes and re-run test to prove EPERM is pre-existing ===
--- running test on PRISTINE tree ---
      at spawn (node:internal/child_process:796:9)
    errno: -4048,
    code: 'EPERM',
    syscall: 'spawn'
=== restore my changes ===
```

→ **Cây nguyên bản cho ra đúng 33 lỗi `spawn EPERM` y hệt.** `node --test` spawn tiến trình con với stdio dạng pipe, và sandbox của phiên này chặn thao tác đó (EPERM, `errno: -4048`). Không một dòng code nào của bài test được thực thi — cả 33 file chết ở bước spawn trước khi vào logic. Đây là **giới hạn môi trường, cần chạy lại ngoài sandbox để xác nhận**, không im lặng bỏ qua.

### 2.2 `npm run lint` — ✅ SẠCH

```
> quizcit-web@0.0.0 lint
> eslint .

(exit code 0, không có output)
```

### 2.3 `npm run build` — ✅ THÀNH CÔNG

```
> quizcit-web@0.0.0 build
> vite build

vite v7.3.6 building client environment for production...
transforming...
✓ 3268 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                         0.78 kB │ gzip:   0.42 kB
...
dist/assets/index-KlGXqWbZ.css                         45.51 kB │ gzip:   8.44 kB
dist/assets/Admin-cxj1oyMW.css                        112.71 kB │ gzip:  18.19 kB
...
dist/assets/AdminLayout-DL__RjRb.js                     2.52 kB │ gzip:   1.09 kB
...
✓ built in 16.27s
[stderr]

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: ...
```

Cảnh báo chunk > 500 kB là **có từ trước**, không liên quan thay đổi này (do `richTextSchema`, `cpp`, `native` của BlockNote/shiki).

> **Ghi chú minh bạch:** `npm run build` và `npm run test` ban đầu bị sandbox chặn bằng đúng `spawn EPERM` (Vite phải spawn esbuild để biên dịch `vite.config.js`). Build đã được chạy lại thành công với quyền rộng hơn để lấy số thật. Test thì **không** chạy được kể cả với quyền rộng hơn trong phiên này — cần bạn chạy lại.

---

## 3. FIX 1 — Nói rõ Admin.css rơi vào gói nào, gói khởi động nhỏ đi bao nhiêu

### Admin.css rơi vào gói nào

`dist/assets/Admin-cxj1oyMW.css` — **112.71 kB (gzip 18.19 kB)**, một chunk **riêng, chỉ tải khi lazy**.

Bằng chứng từ `dist/index.html`:
```
index.html CSS links:
  assets/index-KlGXqWbZ.css
```
Chỉ **một** stylesheet được nạp lúc khởi động. Kiểm tra thêm:
```
=== Confirm Admin chunks are NOT preloaded (lazy only) ===
AdminLayout chunk preloaded? False
Admin css preloaded?        False
```
→ Không có `rel="modulepreload"` / `rel="preload"` nào trỏ tới chunk admin. `AdminLayout-DL__RjRb.js` (2.52 kB) cũng tách riêng.

### Gói khởi động nhỏ đi bao nhiêu

Tôi dựng lại **baseline** bằng cách chỉ stash `src/routes/index.jsx` rồi build lại, để so sánh cùng điều kiện:

| | Gói CSS khởi động | Gzip |
|---|---|---|
| **Trước (baseline)** | `index-BVBdaVUW.css` = **158.21 kB** | 25.94 kB |
| **Sau (đã sửa)** | `index-KlGXqWbZ.css` = **45.51 kB** | 8.44 kB |
| **Giảm** | **−112.70 kB (−71.2%)** | **−17.50 kB (−67.5%)** |

Con số khớp chính xác: 158.21 − 45.51 = **112.70 kB**, đúng bằng kích thước chunk `Admin-*.css` (112.71 kB). Nghĩa là **toàn bộ Admin.css đã được đẩy ra khỏi đường khởi động**, không còn phần nào sót lại.

### Kết quả bước quét an toàn (bắt buộc)

**Đã quét:** so khớp 394 class **chỉ** được định kiểu trong `Admin.css` với mọi giá trị `className` thật trong mọi file `.jsx` **ngoài** `src/features/admin/`.

Phương pháp: trích literal trong `className="..."` và `className={\`...\`}`, tách theo khoảng trắng, chỉ nhận token hợp lệ `^[a-zA-Z][\w-]*$`. (Lần quét đầu dùng regex bắt `.foo` thô đã cho 6 kết quả giả — `x.current`, `role=` là truy cập thuộc tính JS chứ không phải class CSS; đã loại bỏ.)

**Tìm thấy 1 trường hợp thật:**
```
.theory-editor-shell  ->  features\content\components\TheoryEditor.jsx
```
Định nghĩa **chỉ** ở `Admin.css:4516, 4520, 4528, 4536, 4537, 4579, 4583` (7 selector), **không** file CSS nào khác.

**Đã điều tra và kết luận AN TOÀN**, không cần chép CSS đi đâu:
- `TheoryEditor.jsx` chỉ được render từ **3 nơi, tất cả đều thuộc admin**: `AdminChapterEdit.jsx:457`, `EditTheoryModal.jsx:50`, `AddTheoryModal.jsx:69`.
- Trang học sinh duy nhất dùng nội dung bài giảng là `features/content/pages/TheoryPage/TheoryPage.jsx`, và nó import `TheoryContent` (chỉ đọc), **không** import `TheoryEditor`:
  ```
  === Does TheoryPage render any editor? ===
  (không có kết quả)
  ```
- Route `/app/subjects/:subjectId/theories/:theoryId` → `TheoryPage` → `TheoryContent`. Editor không bao giờ render ngoài admin.

→ Khi người học vào trang, chunk `Admin-*.css` không tải, và cũng **không có** class nào ngoài admin cần tới nó. **Không cần chép CSS sang file khác.**

Hai chỗ bạn đã kiểm trước cũng đúng như bạn nói: `.page-loader` nằm ở `src/styles/global.css:64`, và class thanh bên nằm ở `src/components/Sidebar/Sidebar.css`.

---

## 4. Kịch bản kiểm tra tay

### FIX 1 — Admin.css không còn tải cho học sinh
1. `npm run build` rồi `npm run preview` (hoặc `npm run dev`).
2. Mở DevTools → tab **Network**, lọc `CSS`, giữ nguyên, rồi đăng nhập bằng tài khoản **STUDENT**.
3. Vào `/app` và `/app/subjects`.
4. **Phải thấy:** chỉ tải `index-*.css` (≈45 kB). **KHÔNG** có request nào tới `Admin-*.css`.
5. Mở DevTools → **Elements**, tìm `<link rel="stylesheet">` trong `<head>` → chỉ có 1 thẻ, trỏ `index-*.css`.
6. Vào `/app/subjects` → card môn học **không** có `cursor: pointer`, **không** bị `min-height: 178px` (xem thêm kịch bản FIX 2).

### FIX 2 — vào admin trước, rồi sang trang môn học trong cùng phiên (KHÔNG tải lại)
1. Đăng nhập **ADMINISTRATOR**. Vào `/admin/subjects` → để Admin.css tải hẳn (Network thấy `Admin-*.css`).
2. Dùng nút **"Xem thử giao diện người dùng"** trên navbar admin (`preview-user-btn`, `Admin.css:83`) — **không** gõ lại URL, **không** F5. Điều này giữ nguyên cả hai file CSS trong trang, đúng tình huống va chạm quay lại.
3. Sang `/app/subjects`.
4. Chọn một card môn học → DevTools **Computed**:
   - `cursor` **phải là** `auto` (KHÔNG phải `pointer`).
   - `min-height` **phải là** `auto` / `0px` (KHÔNG phải `178px`).
   - `padding` **phải theo** `SubjectCard.css` (`--space-5` từ `ui-card--pad-lg`), **KHÔNG** phải `16px` hay `20px` của admin.
   - `border-radius` **phải là** `var(--radius-lg)` = 16px (`ui-card`), **KHÔNG** phải `18px`.
   - `border` **phải là** `1px solid var(--color-border)`, **KHÔNG** phải `#e5e7eb`.
5. Đối chiếu ngược: quay lại `/admin/subjects` → card admin **vẫn phải** có `cursor:pointer`, `min-height:178px`, `border-radius:18px`. Nếu admin mất kiểu → FIX 2 làm hỏng admin.
6. Kiểm tra các hành vi phụ thuộc `.subject-card-actions`: hover card admin ở `/admin/subjects` → nhóm nút hành động (sửa/xóa/kéo thả) **vẫn phải** hiện ra; ở màn hẹp ≤760px các nút phải chuyển sang `position: static`.

### FIX 3 — hai huy hiệu đạt tương phản AA
1. Vào `/admin/quizzes` (trang quản trị đề thi, nơi huy hiệu loại đề thích ứng mới dùng).
2. Tìm huy hiệu loại đề `ADAPTIVE` (xanh dương, `AdminQuizzes.jsx:266`) và huy hiệu đỏ.
3. DevTools → chọn huy hiệu → Computed `color` **phải là** `rgb(29, 78, 216)` = `#1d4ed8` (xanh dương) và `rgb(185, 28, 28)` = `#b91c1c` (đỏ).
4. `background-color` **phải giữ nguyên** `#eff6ff` và `#fef2f2`.
5. Vào `/admin/users`, kiểm huy hiệu vai trò/vô hiệu hóa tương tự.
6. Đối chiếu bằng mắt với `ui/Badge` ở trang học sinh — hai bên giờ phải cùng độ đậm chữ.

---

## 5. Mục không làm được và vì sao

| Mục | Trạng thái | Lý do |
|---|---|---|
| `npm run test` sạch | ❌ **Không xác nhận được** | 33/33 test chết ở `spawn EPERM` (errno −4048) **trước khi vào logic**. Đã chứng minh tái hiện y hệt trên cây nguyên bản (stash 3 file rồi chạy lại) → lỗi sandbox, không phải lỗi code. **Cần bạn chạy `npm run test` ngoài sandbox để xác nhận.** |
| `npm run build` chạy trong sandbox | ⚠️ Phải nâng quyền | Vite spawn esbuild để biên dịch `vite.config.js` → `spawn EPERM`. Đã chạy lại thành công với quyền rộng hơn; số liệu ở mục 3.2 lấy từ lần chạy thật đó. |
| Kiểm tra trên trình duyệt | ❌ **Chưa làm** | Phiên này không có tài khoản test và không có công cụ browser automation (bạn đã yêu cầu không cài thêm). Mọi kết luận CSS là từ đọc code + phân tích tĩnh + số liệu build. Kịch bản tay ở mục 4 để bạn thực hiện. |

**Không đụng tới** (theo đúng 5 điều cấm): Modal admin, các component trùng lặp, nút tự viết, chuẩn hoá font-size/radius/hex, và validate prop của `Card`/`Badge`/`Button`/`Input`.

**Không gặp trường hợp nào buộc phải sửa file thứ tư.** Chỗ duy nhất có nguy cơ (`theory-editor-shell`) đã điều tra và kết luận an toàn, không cần chép CSS đi đâu.
