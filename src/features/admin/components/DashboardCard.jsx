import AdminLayout from "../AdminLayout";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <h1>Tổng quan</h1>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <div className="card">Tổng số người dùng: 1234</div>
        <div className="card">Tổng số môn học: 45</div>
        <div className="card">Tổng số câu hỏi: 8567</div>
        <div className="card">Tổng số đề thi: 342</div>
      </div>
    </AdminLayout>
  );
}
