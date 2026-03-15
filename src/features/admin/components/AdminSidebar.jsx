import "../Admin.css";

export default function AdminSidebar() {
  return (
    <div className="admin-sidebar">
      <h2 className="logo">QuizCIT Admin</h2>

      <ul className="sidebar-menu">
        <li className="active">📊 Tổng quan</li>
        <li>📚 Quản lý môn học</li>
        <li>📑 Quản lý chương</li>
        <li>❓ Quản lý câu hỏi</li>
        <li>📝 Quản lý đề thi</li>
        <li>👤 Quản lý người dùng</li>
      </ul>
    </div>
  );
}
