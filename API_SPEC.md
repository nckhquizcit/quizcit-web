Dưới đây là **API Spec** toàn bộ backend QuizCit, tổng hợp từ tất cả các Controller trong dự án.

---

# 📘 QuizCit Backend — API Specification

## Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| **Base URL** | `http://<host>/api` |
| **Content-Type** | `application/json` |
| **Response chuẩn** | Luôn trả về `ApiResponse<T>` với cấu trúc: `{ status, message, data }` |

### Cấu trúc Response chuẩn (`ApiResponse`)

```json
// Thành công (có data)
{
  "status": 200,
  "message": "Success",
  "data": { ... }
}

// Thành công (không data)
{
  "status": 200,
  "message": "Thành công",
  "data": null
}

// Lỗi
{
  "status": 400,
  "message": "Mô tả lỗi",
  "data": null
}
```

### Enum tham chiếu

| Enum | Giá trị |
|---|---|
| `UserRole` | `USER`, `ADMINISTRATOR` |
| `UserStatus` | `UNVERIFIED`, `VERIFIED`, `BANNED` |
| `QuizType` | `CHAPTER`, `FINAL` |

---

## 1. 🔐 Auth Module (`AuthController` — `/api/auth`)

### 1.1 Đăng ký tài khoản

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "string (required, max 50)",
  "password": "string (required, min 6, max 255)",
  "email": "string (required, email, max 100)",
  "displayName": "string (optional, max 100)"
}
```

**Response — `201 Created`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "accessToken": "string",
    "tokenType": "string",
    "expiresAt": "ZonedDateTime",
    "userId": "string",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "role": "UserRole",
    "status": "UserStatus",
    "createdAt": "ZonedDateTime"
  }
}
```

---

### 1.2 Đăng nhập

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "identifier": "string (required, max 100 — username hoặc email)",
  "password": "string (required, min 6, max 255)"
}
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "accessToken": "string",
    "tokenType": "string",
    "expiresAt": "ZonedDateTime",
    "userId": "string",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "role": "UserRole",
    "status": "UserStatus",
    "createdAt": "ZonedDateTime"
  }
}
```

---

## 2. 👤 User Module (`UserController` — `/api/users`)

### 2.1 Lấy danh sách tất cả users

```
GET /api/users
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "userId": "string",
      "username": "string",
      "email": "string",
      "displayName": "string",
      "role": "UserRole",
      "status": "UserStatus",
      "createdAt": "ZonedDateTime"
    }
  ]
}
```

---

### 2.2 Lấy chi tiết 1 user

```
GET /api/users/{userId}
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "role": "UserRole",
    "status": "UserStatus",
    "createdAt": "ZonedDateTime"
  }
}
```

---

### 2.3 Cập nhật tên hiển thị

```
PUT /api/users/{userId}
```

**Request Body:**
```json
{
  "displayName": "string (required, max 100)"
}
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Cap nhat nguoi dung thanh cong",
  "data": null
}
```

---

### 2.4 Đổi mật khẩu

```
PATCH /api/users/{userId}/password
```

**Request Body:**
```json
{
  "password": "string (required, min 6, max 255)"
}
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Cap nhat mat khau nguoi dung thanh cong",
  "data": null
}
```

---

### 2.5 Xóa user

```
DELETE /api/users/{userId}
```

**Response — `204 No Content`:**
```json
{
  "status": 200,
  "message": "Da xoa nguoi dung thanh cong",
  "data": null
}
```

---

## 3. 📚 Content Module (`ContentController` — `/api`)

### 3.1 Subject (Học phần)

#### 3.1.1 Lấy danh sách tất cả subjects

```
GET /api/subjects
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "subjectId": "string",
      "courseCode": "string",
      "name": "string",
      "description": "string",
      "createdAt": "ZonedDateTime"
    }
  ]
}
```

#### 3.1.2 Lấy chi tiết 1 subject

```
GET /api/subjects/{subjectId}
```

**Response — `200 OK`:** (data là 1 `SubjectResponse`)

#### 3.1.3 Tạo subject mới

```
POST /api/subjects
```

**Request Body:**
```json
{
  "courseCode": "string (required, max 20)",
  "name": "string (required, max 200)",
  "description": "string (optional)"
}
```

**Response — `201 Created`:** (data là 1 `SubjectResponse`)

#### 3.1.4 Cập nhật subject

```
PUT /api/subjects/{subjectId}
```

**Request Body:**
```json
{
  "courseCode": "string (required, max 20)",
  "name": "string (required, max 200)",
  "description": "string (optional)"
}
```

**Response — `200 OK`:**
```json
{ "status": 200, "message": "Cập nhật học phần thành công", "data": null }
```

#### 3.1.5 Xóa subject

```
DELETE /api/subjects/{subjectId}
```

**Response — `204 No Content`**

---

### 3.2 Chapter (Chương)

#### 3.2.1 Lấy danh sách chapters của 1 subject

```
GET /api/subjects/{subjectId}/chapters
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "chapterId": "string",
      "subjectId": "string",
      "name": "string",
      "createdAt": "ZonedDateTime"
    }
  ]
}
```

#### 3.2.2 Thêm chapter vào subject

```
POST /api/subjects/{subjectId}/chapters
```

**Request Body:**
```json
{
  "name": "string (required, max 200)"
}
```

**Response — `201 Created`:** (data là 1 `ChapterResponse`)

#### 3.2.3 Lấy chi tiết 1 chapter

```
GET /api/chapters/{chapterId}
```

**Response — `200 OK`:** (data là 1 `ChapterResponse`)

#### 3.2.4 Cập nhật chapter

```
PUT /api/chapters/{chapterId}
```

**Request Body:**
```json
{
  "name": "string (required, max 200)"
}
```

**Response — `200 OK`:**
```json
{ "status": 200, "message": "Cập nhật chương thành công", "data": null }
```

#### 3.2.5 Xóa chapter

```
DELETE /api/chapters/{chapterId}
```

**Response — `204 No Content`**

---

### 3.3 Theory (Lý thuyết)

#### 3.3.1 Lấy danh sách theories của 1 chapter

```
GET /api/chapters/{chapterId}/theories
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "theoryId": "string",
      "chapterId": "string",
      "content": "string",
      "createdAt": "ZonedDateTime"
    }
  ]
}
```

#### 3.3.2 Thêm theory vào chapter

```
POST /api/chapters/{chapterId}/theories
```

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response — `201 Created`:** (data là 1 `TheoryResponse`)

#### 3.3.3 Lấy chi tiết 1 theory

```
GET /api/theories/{theoryId}
```

**Response — `200 OK`:** (data là 1 `TheoryResponse`)

#### 3.3.4 Cập nhật theory

```
PUT /api/theories/{theoryId}
```

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Response — `200 OK`:**
```json
{ "status": 200, "message": "Cập nhật nội dung lý thuyết thành công", "data": null }
```

#### 3.3.5 Xóa theory

```
DELETE /api/theories/{theoryId}
```

**Response — `204 No Content`**

---

## 4. 📝 Quiz Module (`QuizController` — `/api`)

### 4.1 Lấy danh sách quizzes của 1 chapter

```
GET /api/chapters/{chapterId}/quizzes
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "quizId": "string",
      "subjectId": "string",
      "chapterId": "string",
      "name": "string",
      "type": "QuizType",
      "totalQuestion": "int",
      "duration": "int (phút)"
    }
  ]
}
```

### 4.2 Tạo quiz mới

```
POST /api/quizzes
```

**Request Body:**
```json
{
  "subjectId": "string",
  "chapterId": "string",
  "name": "string",
  "totalQuestion": "int",
  "duration": "int",
  "type": "QuizType"
}
```

**Response — `201 Created`:** (data là 1 `QuizResponse`)

### 4.3 Lấy chi tiết 1 quiz

```
GET /api/quizzes/{quizId}
```

**Response — `200 OK`:** (data là 1 `QuizResponse`)

### 4.4 Cập nhật quiz

```
PUT /api/quizzes/{quizId}
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "duration": "int (optional)",
  "chapterId": "string (optional)"
}
```

**Response — `200 OK`:**
```json
{ "status": 200, "message": "Cập nhật đề thi thành công", "data": null }
```

### 4.5 Xóa quiz

```
DELETE /api/quizzes/{quizId}
```

**Response — `204 No Content`**

---

## 5. ❓ Question Module (`QuestionController` — `/api`)

### 5.1 Lấy danh sách câu hỏi của 1 chapter

```
GET /api/chapters/{chapterId}/questions
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "questionId": "string",
      "subjectId": "string",
      "chapterId": "string",
      "content": "string",
      "explaination": "string",
      "difficultyB": "double",
      "active": "boolean"
    }
  ]
}
```

### 5.2 Tạo câu hỏi mới

```
POST /api/questions
```

**Request Body:**
```json
{
  "subjectId": "string",
  "chapterId": "string",
  "content": "string",
  "explaination": "string",
  "difficultyB": "double",
  "options": [
    {
      "content": "string",
      "corrected": "boolean"
    }
  ]
}
```

**Response — `201 Created`:** (data là 1 `QuestionResponse`)

### 5.3 Lấy chi tiết 1 câu hỏi

```
GET /api/questions/{questionId}
```

**Response — `200 OK`:** (data là 1 `QuestionResponse`)

### 5.4 Cập nhật câu hỏi

```
PUT /api/questions/{questionId}
```

**Request Body:**
```json
{
  "content": "string",
  "explaination": "string",
  "difficultyB": "double"
}
```

**Response — `200 OK`:**
```json
{ "status": 200, "message": "Cập nhật câu hỏi thành công", "data": null }
```

### 5.5 Xóa câu hỏi

```
DELETE /api/questions/{questionId}
```

**Response — `204 No Content`**

---

## 6. 🎯 Attempt Module (`AttemptController` — `/api`)

### 6.1 Bắt đầu làm quiz

```
POST /api/quizzes/{quizId}/start?userId={userId}
```

**Query Params:**
| Param | Type | Mô tả |
|---|---|---|
| `userId` | string | ID của user bắt đầu làm quiz |

**Response — `201 Created`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "attemptId": "string",
    "quizId": "string",
    "totalQuestion": "int"
  }
}
```

### 6.2 Nộp bài quiz

```
POST /api/attempts/submit
```

**Request Body:**
```json
{
  "attemptId": "string",
  "answers": [
    {
      "questionId": "string",
      "optionId": "string"
    }
  ]
}
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "attemptId": "string",
    "quizId": "string",
    "rawScore": "double",
    "totalQuestion": "int",
    "overallTheta": "double",
    "skillResults": [
      {
        "skillId": "string",
        "theta": "double"
      }
    ]
  }
}
```

### 6.3 Xem kết quả 1 lần làm bài

```
GET /api/attempts/{attemptId}/result
```

**Response — `200 OK`:** (data là 1 `QuizResultResponse` như trên)

### 6.4 Xem lịch sử làm bài của user

```
GET /api/users/{userId}/attempts
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
  "data": [ /* List<QuizResultResponse> */ ]
}
```

---

## 7. 📊 Progress Module (`ProgressController` — `/api`)

### 7.1 Lấy tất cả kỹ năng của user

```
GET /api/users/{userId}/skills
```

**Response — `200 OK`:**
```json
{
  "status": 200,
  "message": "Success",
