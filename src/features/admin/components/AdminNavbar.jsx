import "../Admin.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, Menu, User } from "lucide-react";
import { enterUserPreview } from "../../../services/userPreviewMode";

const SECTION_MATCHERS = [
  { test: (path) => path.includes("/admin/questions"), label: "Câu hỏi" },
  { test: (path) => path.includes("/admin/quizzes"), label: "Đề thi" },
  { test: (path) => path.includes("/admin/skills"), label: "Kỹ năng" },
  { test: (path) => path.includes("/admin/users"), label: "Người dùng" },
  { test: (path) => path.includes("/admin/profile"), label: "Hồ sơ" },
  { test: (path) => path.includes("/admin/subjects"), label: "Môn học" },
];

function getSectionLabel(pathname) {
  const match = SECTION_MATCHERS.find((entry) => entry.test(pathname));
  return match ? match.label : "Tổng quan";
}

export default function AdminNavbar({ onOpenMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const sectionLabel = getSectionLabel(location.pathname);

  const handleEnterUserPreview = () => {
    enterUserPreview(`${location.pathname}${location.search}${location.hash}`);
    navigate("/app");
  };

  return (
    <div className="admin-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-menu-btn"
          onClick={onOpenMenu}
          aria-label="Mở menu"
        >
          <Menu size={22} />
        </button>
        <div className="adm2-navbar-titleblock">
          <span className="adm2-navbar-eyebrow">Quản trị / {sectionLabel}</span>
          <h3 className="adm2-navbar-title">{sectionLabel}</h3>
        </div>
      </div>

      <div className="admin-user">
        <button type="button" className="preview-user-btn" onClick={handleEnterUserPreview}>
          <Eye size={16} strokeWidth={2} />
          <span>Xem như user</span>
        </button>
        <Link to="/admin/profile" className="profile-btn">
          <User size={16} strokeWidth={2} />
          <span>Hồ sơ</span>
        </Link>
      </div>
    </div>
  );
}
