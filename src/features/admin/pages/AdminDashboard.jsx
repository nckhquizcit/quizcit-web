import AdminLayout from "../AdminLayout";
import "../Admin.css";
export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1 className="dashboard-title">Tổng quan</h1>
      <p className="dashboard-sub">Thống kê tổng quan hệ thống QuizCIT</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Tổng số người dùng</div>
          <div className="stat-value">1,234</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Tổng số môn học</div>
          <div className="stat-value">45</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Tổng số câu hỏi</div>
          <div className="stat-value">8,567</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Tổng số đề thi</div>
          <div className="stat-value">342</div>
        </div>
      </div>

      <div className="activity-card">
        <h3>Hoạt động gần đây</h3>

        <div className="activity-item">
          <div>
            <strong>Người dùng mới đăng ký</strong>
            <p>nguyenvanb@example.com</p>
          </div>
          <span>5 phút trước</span>
        </div>

        <div className="activity-item">
          <div>
            <strong>Đề thi mới được tạo</strong>
            <p>Admin</p>
          </div>
          <span>15 phút trước</span>
        </div>

        <div className="activity-item">
          <div>
            <strong>Câu hỏi được chỉnh sửa</strong>
            <p>Admin</p>
          </div>
          <span>1 giờ trước</span>
        </div>
      </div>
    </AdminLayout>
  );
}
