import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ClipboardList, Eye, HelpCircle, LogOut, Shield, Users } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import Skeleton from "../../../components/ui/Skeleton/Skeleton";
import { adminProfileService } from "../services/profileService.js";
import { getStoredUser } from "../../../services/apiClient";
import { enterUserPreview } from "../../../services/userPreviewMode";
import { logout } from "../../../services/authService";
import "./AdminProfile.css";

const emptyStats = {
  totalUsers: 0,
  totalSubjects: 0,
  totalQuestions: 0,
  totalAttempts: 0,
};

const PERMISSION_ITEMS = ["Quản lý nội dung", "Quản lý đánh giá", "Quản lý người dùng"];

function IconShield({ className }) {
  return <Shield className={className} aria-hidden="true" strokeWidth={1.8} />;
}

function IconUsers({ className }) {
  return <Users className={className} aria-hidden="true" strokeWidth={1.8} />;
}

function IconBook({ className }) {
  return <BookOpen className={className} aria-hidden="true" strokeWidth={1.8} />;
}

function IconQuestion({ className }) {
  return <HelpCircle className={className} aria-hidden="true" strokeWidth={1.8} />;
}

function IconAttempt({ className }) {
  return <ClipboardList className={className} aria-hidden="true" strokeWidth={1.8} />;
}

function getInitials(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function AdminProfile() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const numberFormatter = useMemo(() => new Intl.NumberFormat("vi-VN"), []);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      const [adminResult, statsResult] = await Promise.allSettled([
        adminProfileService.getCurrentAdmin(),
        adminProfileService.getAdminProfileStats(),
      ]);

      if (!isMounted) return;

      if (adminResult.status === "fulfilled") {
        setAdmin(adminResult.value);
      }

      if (statsResult.status === "fulfilled") {
        setStats({ ...emptyStats, ...statsResult.value });
      }

      if (adminResult.status === "rejected" || statsResult.status === "rejected") {
        console.error("Failed to load admin profile:", {
          adminError: adminResult.status === "rejected" ? adminResult.reason : null,
          statsError: statsResult.status === "rejected" ? statsResult.reason : null,
        });
        setError("Không thể tải thông tin quản trị viên");
      }

      setLoading(false);
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const storedUser = useMemo(() => getStoredUser(), []);
  const displayName =
    admin?.displayName ||
    admin?.display_name ||
    admin?.username ||
    storedUser?.displayName ||
    storedUser?.username ||
    "Quản trị viên";
  const username = admin?.username || storedUser?.username || "—";
  const email = admin?.email || storedUser?.email || "—";
  const formatStat = (value) =>
    loading ? <Skeleton height={22} width={56} /> : numberFormatter.format(value ?? 0);

  const handlePreviewAsUser = () => {
    enterUserPreview("/admin/profile");
    navigate("/app");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-profile-page">
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Hồ sơ"]}
        title="Hồ sơ quản trị"
        subtitle="Thông tin tài khoản, quyền hạn và thống kê quản trị"
      />
      {error && <p className="admin-profile-error">{error}</p>}

      <section className="admin-card adm2-profile-hero">
        <div className="adm2-profile-hero__avatar">{getInitials(displayName)}</div>
        <div className="adm2-profile-hero__body">
          <h2 className="adm2-profile-hero__name">{displayName}</h2>
          <p className="adm2-profile-hero__meta">
            {username} · {email}
          </p>
          <span className="adm2-badge adm2-badge--dark">ADMINISTRATOR</span>
        </div>
        <button type="button" className="cancel-btn" onClick={handlePreviewAsUser}>
          <Eye size={16} />
          Xem như người dùng
        </button>
      </section>

      <section className="admin-stats">
        <div className="admin-stats__row">
          <div className="admin-stat">
            <div className="admin-stat__icon admin-stat__icon--green">
              <IconUsers className="admin-icon admin-icon--md" />
            </div>
            <div className="admin-stat__meta">
              <div className="admin-stat__value">{formatStat(stats.totalUsers)}</div>
              <div className="admin-stat__label">Người dùng</div>
            </div>
          </div>

          <div className="admin-stat">
            <div className="admin-stat__icon admin-stat__icon--blue">
              <IconBook className="admin-icon admin-icon--md" />
            </div>
            <div className="admin-stat__meta">
              <div className="admin-stat__value">{formatStat(stats.totalSubjects)}</div>
              <div className="admin-stat__label">Môn học</div>
            </div>
          </div>

          <div className="admin-stat">
            <div className="admin-stat__icon admin-stat__icon--orange">
              <IconQuestion className="admin-icon admin-icon--md" />
            </div>
            <div className="admin-stat__meta">
              <div className="admin-stat__value">{formatStat(stats.totalQuestions)}</div>
              <div className="admin-stat__label">Câu hỏi</div>
            </div>
          </div>

          <div className="admin-stat">
            <div className="admin-stat__icon admin-stat__icon--accent">
              <IconAttempt className="admin-icon admin-icon--md" />
            </div>
            <div className="admin-stat__meta">
              <div className="admin-stat__value">{formatStat(stats.totalAttempts)}</div>
              <div className="admin-stat__label">Lượt làm bài</div>
            </div>
          </div>
        </div>
      </section>

      <div className="admin-profile-top">
        <section className="admin-card admin-card--primary">
          <header className="admin-card__header">
            <div className="admin-card__headerLeft">
              <span className="admin-card__headerDot" aria-hidden="true" />
              <span className="admin-card__headerTitle">Thông tin quản trị viên</span>
            </div>
          </header>

          <div className="admin-fields adm2-profile-fields">
            <div className="admin-field">
              <div className="admin-field__label">Tên hiển thị</div>
              <div className="admin-field__value">{displayName}</div>
            </div>
            <div className="admin-field">
              <div className="admin-field__label">Username</div>
              <div className="admin-field__value">{username}</div>
            </div>
            <div className="admin-field">
              <div className="admin-field__label">Email</div>
              <div className="admin-field__value">{email}</div>
            </div>
            <div className="admin-field">
              <div className="admin-field__label">Vai trò</div>
              <div className="admin-field__value">Quản trị viên hệ thống</div>
            </div>
          </div>

          <div className="admin-divider" />

          <div className="adm2-unsupported-row">
            <span>Chỉnh sửa hồ sơ và đổi mật khẩu</span>
            <span className="adm2-badge adm2-badge--gray">Chưa hỗ trợ</span>
          </div>
        </section>

        <section className="admin-card admin-card--permission">
          <span className="adm2-chip adm2-chip--emerald">Quyền mặc định của vai trò Quản trị</span>

          <div className="admin-permissionBody">
            <div className="admin-permissionBadge" aria-hidden="true">
              <IconShield className="admin-icon admin-icon--shieldWhite" />
            </div>
            <div className="admin-permissionTitle">Quyền mặc định của vai trò Quản trị</div>
            <div className="admin-permissionSub">
              Đây là quyền đi kèm vai trò, không phải trình chỉnh sửa RBAC.
            </div>

            <div className="adm2-divider" />

            <ul className="adm2-check-list">
              {PERMISSION_ITEMS.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>

            <button type="button" className="adm2-text-btn adm2-profile-logout" onClick={handleLogout}>
              <LogOut size={15} />
              Đăng xuất
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
