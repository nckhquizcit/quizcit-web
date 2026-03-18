import AdminLayout from "../AdminLayout";
import "../Admin.css";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function AdminSubject() {
  return (
    <AdminLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="dashboard-title">Quản lý môn học</h1>
          <p className="dashboard-sub">
            Quản lý danh sách các môn học trong hệ thống
          </p>
        </div>

        <button className="add-btn">
          <Plus size={18} />
          <span>Thêm môn học</span>
        </button>
      </div>

      {/* Table */}
      <div className="table-card">
        <h3>Danh sách môn học</h3>

        <table className="subject-table">
          <thead>
            <tr>
              <th>Mã môn học</th>
              <th>Tên môn học</th>
              <th>Mô tả</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>CS101</td>
              <td>Cấu trúc dữ liệu và Giải thuật</td>
              <td>Học về các cấu trúc dữ liệu cơ bản và giải thuật</td>
              <td>
                <button className="edit-btn">
                  <Pencil size={16} />
                  Chỉnh sửa
                </button>

                <button className="delete-btn">
                  <Trash2 size={16} />
                  Xóa
                </button>
              </td>
            </tr>

            <tr>
              <td>CS201</td>
              <td>Lập trình hướng đối tượng</td>
              <td>Các khái niệm OOP và ứng dụng thực tế</td>
              <td>
                <button className="edit-btn">
                  <Pencil size={16} />
                  Chỉnh sửa
                </button>

                <button className="delete-btn">
                  <Trash2 size={16} />
                  Xóa
                </button>
              </td>
            </tr>

            <tr>
              <td>MATH101</td>
              <td>Toán rời rạc</td>
              <td>Các khái niệm toán học cho khoa học máy tính</td>
              <td>
                <button className="edit-btn">
                  <Pencil size={16} />
                  Chỉnh sửa
                </button>

                <button className="delete-btn">
                  <Trash2 size={16} />
                  Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
