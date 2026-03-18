export const currentUser = {
  username: 'nguyenhahuan',
  display_name: 'Nguyễn Hà Huân',
  role: 'USER',
  theta_overall: 725,
  status: 'VERIFIED',
  email: 'nguyenhahuan@example.com',
};

export const subjects = [
  {
    subject_id: 's1',
    course_code: 'CS101',
    name: 'Cấu trúc dữ liệu và Giải thuật',
    description: 'Học về các cấu trúc dữ liệu cơ bản và giải thuật.',
    progress: 75,
  },
  {
    subject_id: 's2',
    course_code: 'CS201',
    name: 'Lập trình hướng đối tượng',
    description: 'Các khái niệm OOP và cách áp dụng vào bài toán thực tế.',
    progress: 60,
  },
  {
    subject_id: 's3',
    course_code: 'MATH101',
    name: 'Toán rời rạc',
    description: 'Nền tảng logic, tổ hợp và đồ thị cho khoa học máy tính.',
    progress: 45,
  },
  {
    subject_id: 's4',
    course_code: 'CS301',
    name: 'Cơ sở dữ liệu',
    description: 'Thiết kế và thao tác với hệ quản trị cơ sở dữ liệu.',
    progress: 30,
  },
];

export const chapters = [
  { chapter_id: 'c1', subject_id: 's1', name: 'Chương 1: Giới thiệu' },
  { chapter_id: 'c2', subject_id: 's1', name: 'Chương 2: Mảng và Danh sách liên kết' },
  { chapter_id: 'c3', subject_id: 's1', name: 'Chương 3: Stack và Queue' },
  { chapter_id: 'c4', subject_id: 's1', name: 'Chương 4: Cây và Đồ thị' },
  { chapter_id: 'c5', subject_id: 's1', name: 'Chương 5: Thuật toán sắp xếp' },
  { chapter_id: 'c6', subject_id: 's2', name: 'Chương 1: Giới thiệu OOP' },
  { chapter_id: 'c7', subject_id: 's2', name: 'Chương 2: Lớp và Đối tượng' },
  { chapter_id: 'c8', subject_id: 's2', name: 'Chương 3: Kế thừa và Đa hình' },
  { chapter_id: 'c9', subject_id: 's2', name: 'Chương 4: Trừu tượng và Interface' },
  { chapter_id: 'c10', subject_id: 's3', name: 'Chương 1: Logic và Tập hợp' },
  { chapter_id: 'c11', subject_id: 's3', name: 'Chương 2: Quan hệ và Hàm' },
  { chapter_id: 'c12', subject_id: 's3', name: 'Chương 3: Đồ thị cơ bản' },
  { chapter_id: 'c13', subject_id: 's3', name: 'Chương 4: Tổ hợp và Xác suất' },
  { chapter_id: 'c14', subject_id: 's4', name: 'Chương 1: Giới thiệu CSDL' },
  { chapter_id: 'c15', subject_id: 's4', name: 'Chương 2: Mô hình quan hệ' },
  { chapter_id: 'c16', subject_id: 's4', name: 'Chương 3: SQL cơ bản' },
  { chapter_id: 'c17', subject_id: 's4', name: 'Chương 4: Thiết kế CSDL' },
];
