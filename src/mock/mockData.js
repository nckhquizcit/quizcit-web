// src/mock/mockData.js

// ================= SUBJECT =================
// ================= SUBJECT =================
export const subjects = [
  {
    id: "s1",
    code: "CS101",
    name: "Cấu trúc dữ liệu và Giải thuật",
    description: "Học về các cấu trúc dữ liệu cơ bản và giải thuật",
    totalChapters: 5,
  },
  {
    id: "s2",
    code: "CS201",
    name: "Lập trình hướng đối tượng",
    description: "Các khái niệm OOP và ứng dụng thực tế",
    totalChapters: 4,
  },
  {
    id: "s3",
    code: "MATH101",
    name: "Toán rời rạc",
    description: "Các khái niệm toán học cho khoa học máy tính",
    totalChapters: 3,
  },
];

// ================= CHAPTER =================
export const chapters = [
  // ===== CS101 =====
  { id: "c1", subjectId: "s1", name: "Chương 1: Giới thiệu", order: 1 },
  { id: "c2", subjectId: "s1", name: "Chương 2: Mảng", order: 2 },
  { id: "c3", subjectId: "s1", name: "Chương 3: Linked List", order: 3 },
  { id: "c4", subjectId: "s1", name: "Chương 4: Stack & Queue", order: 4 },
  { id: "c5", subjectId: "s1", name: "Chương 5: Tree & Graph", order: 5 },

  // ===== CS201 =====
  { id: "c6", subjectId: "s2", name: "Chương 1: OOP Basics", order: 1 },
  { id: "c7", subjectId: "s2", name: "Chương 2: Inheritance", order: 2 },
  { id: "c8", subjectId: "s2", name: "Chương 3: Polymorphism", order: 3 },
  { id: "c9", subjectId: "s2", name: "Chương 4: Design Patterns", order: 4 },

  // ===== MATH101 =====
  { id: "c10", subjectId: "s3", name: "Chương 1: Logic", order: 1 },
  { id: "c11", subjectId: "s3", name: "Chương 2: Set", order: 2 },
  { id: "c12", subjectId: "s3", name: "Chương 3: Graph", order: 3 },
];

// ================= QUESTION =================
export const questions = [
  // ===== CHAPTER 2 (ARRAY) =====
  {
    id: "q1",
    chapterId: "c2",
    content: "Độ phức tạp truy cập mảng là gì?",
    difficulty: "easy",
    options: [
      { id: "o1", content: "O(1)", isCorrect: true },
      { id: "o2", content: "O(n)", isCorrect: false },
      { id: "o3", content: "O(log n)", isCorrect: false },
      { id: "o4", content: "O(n^2)", isCorrect: false },
    ],
  },
  {
    id: "q2",
    chapterId: "c2",
    content: "Mảng lưu trữ dữ liệu như thế nào?",
    difficulty: "easy",
    options: [
      { id: "o5", content: "Ngẫu nhiên", isCorrect: false },
      { id: "o6", content: "Liên tiếp trong bộ nhớ", isCorrect: true },
    ],
  },

  // ===== LINKED LIST =====
  {
    id: "q3",
    chapterId: "c3",
    content: "Linked List có ưu điểm gì?",
    difficulty: "medium",
    options: [
      { id: "o7", content: "Truy cập nhanh", isCorrect: false },
      { id: "o8", content: "Chèn/xóa linh hoạt", isCorrect: true },
    ],
  },
  {
    id: "q4",
    chapterId: "c3",
    content: "Node trong linked list chứa gì?",
    difficulty: "easy",
    options: [
      { id: "o9", content: "Data + pointer", isCorrect: true },
      { id: "o10", content: "Chỉ data", isCorrect: false },
    ],
  },

  // ===== STACK =====
  {
    id: "q5",
    chapterId: "c4",
    content: "Stack hoạt động theo nguyên tắc nào?",
    difficulty: "easy",
    options: [
      { id: "o11", content: "FIFO", isCorrect: false },
      { id: "o12", content: "LIFO", isCorrect: true },
    ],
  },

  // ===== TREE =====
  {
    id: "q6",
    chapterId: "c5",
    content: "Binary Tree có tối đa bao nhiêu con?",
    difficulty: "easy",
    options: [
      { id: "o13", content: "2", isCorrect: true },
      { id: "o14", content: "3", isCorrect: false },
    ],
  },

  // ===== OOP =====
  {
    id: "q7",
    chapterId: "c6",
    content: "Encapsulation là gì?",
    difficulty: "medium",
    options: [
      { id: "o15", content: "Đóng gói dữ liệu", isCorrect: true },
      { id: "o16", content: "Kế thừa", isCorrect: false },
    ],
  },

  {
    id: "q8",
    chapterId: "c7",
    content: "Inheritance giúp gì?",
    difficulty: "medium",
    options: [
      { id: "o17", content: "Tái sử dụng code", isCorrect: true },
      { id: "o18", content: "Giảm bảo mật", isCorrect: false },
    ],
  },

  // ===== MATH =====
  {
    id: "q9",
    chapterId: "c10",
    content: "Logic mệnh đề là gì?",
    difficulty: "easy",
    options: [
      { id: "o19", content: "Đúng/Sai", isCorrect: true },
      { id: "o20", content: "Số học", isCorrect: false },
    ],
  },

  {
    id: "q10",
    chapterId: "c12",
    content: "Đồ thị gồm gì?",
    difficulty: "easy",
    options: [
      { id: "o21", content: "Đỉnh và cạnh", isCorrect: true },
      { id: "o22", content: "Chỉ đỉnh", isCorrect: false },
    ],
  },
];
