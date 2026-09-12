import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Camera,
  ClipboardList,
  Edit2,
  Eye,
  HelpCircle,
  KeyRound,
  LogOut,
  Mail,
  Shield,
  Users,
} from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import Skeleton from "../../../components/ui/Skeleton/Skeleton";
import { useToast } from "../../../components/ui";
import { adminProfileService } from "../services/profileService.js";
import { getStoredUser } from "../../../services/apiClient";
import { enterUserPreview } from "../../../services/userPreviewMode";
import { logout } from "../../../services/authService";
import { resolveImageUrl } from "../../../services/mappers";
import { getInitials } from "../utils/adminUsersLogic";
import AdminEditProfileModal from "../components/modals/AdminEditProfileModal";
import AdminChangePasswordModal from "../components/modals/AdminChangePasswordModal";
import AdminChangeEmailModal from "../components/modals/AdminChangeEmailModal";
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

export default function AdminProfile() {
  const navigate = useNavigate();
  const toast = useToast();
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);

  const numberFormatter = useMemo(() => new Intl.NumberFormat("vi-VN"), []);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const summary = await adminProfileService.getAdminProfileSummary();
        if (!isMounted) return;
        if (summary?.admin) setAdmin(summary.admin);
        if (summary?.stats) setStats({ ...emptyStats, ...summary.stats });
        setLoading(false);
        return;
      } catch {
        // Resilient fallback to legacy parallel calls
      }

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
  const currentAdmin = admin || storedUser;

  const displayName =
    currentAdmin?.displayName ||
    currentAdmin?.display_name ||
    currentAdmin?.username ||
    "Quản trị viên";
  const username = currentAdmin?.username || "—";
  const email = currentAdmin?.email || "—";
  const avatarUrl = currentAdmin?.avatarUrl;

  // Tai that bai thi hien gach ngang, khong hien 0 de tranh bi doc thanh so lieu that.
  const formatStat = (value) => {
    if (loading) return <Skeleton height={22} width={56} />;
    if (error) return "—";
    return numberFormatter.format(value ?? 0);
  };

  const handlePreviewAsUser = () => {
    enterUserPreview("/admin/profile");
    navigate("/app");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleEditProfileSuccess = (updatedUser) => {
    setAdmin((prev) => ({ ...prev, ...updatedUser }));
    toast.success("Cập nhật thông tin quản trị viên thành công.");
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
        <div className="adm2-profile-hero__avatar-wrapper">
          <div
            className="adm2-profile-hero__avatar"
            style={{ cursor: "pointer" }}
            onClick={() => setEditProfileOpen(true)}
            title="Nhấn để đổi thông tin hoặc ảnh đại diện"
          >
            {avatarUrl ? (
              <img
                src={resolveImageUrl(avatarUrl)}
                alt=""
                className="adm2-profile-hero__avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              getInitials(displayName)
            )}
          </div>
          <button
            type="button"
            className="adm2-profile-hero__avatar-btn"
            onClick={() => setEditProfileOpen(true)}
            title="Đổi ảnh đại diện"
            aria-label="Đổi ảnh đại diện"
          >
            <Camera size={16} />
          </button>
        </div>

        <div className="adm2-profile-hero__body">
          <h2 className="adm2-profile-hero__name">{displayName}</h2>
          <p className="adm2-profile-hero__meta">
            {username} · {email}
          </p>
          <span className="adm2-badge adm2-badge--dark">ADMINISTRATOR</span>
        </div>

        <div className="adm2-profile-hero__actions">
          <button
            type="button"
            className="adm2-hero-btn adm2-hero-btn--primary"
            onClick={() => setEditProfileOpen(true)}
          >
            <Edit2 size={16} />
            <span>Chỉnh sửa thông tin</span>
          </button>
          <button
            type="button"
            className="cancel-btn adm2-hero-btn"
            onClick={() => setChangePasswordOpen(true)}
          >
            <KeyRound size={16} />
            <span>Đổi mật khẩu</span>
          </button>
          <button
            type="button"
            className="cancel-btn adm2-hero-btn"
            onClick={handlePreviewAsUser}
          >
            <Eye size={16} />
            <span>Xem như người dùng</span>
          </button>
        </div>
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
            <button
              type="button"
              className="adm2-card-header-btn"
              onClick={() => setEditProfileOpen(true)}
            >
              <Edit2 size={14} />
              <span>Chỉnh sửa</span>
            </button>
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

          <div className="adm2-security-box">
            <div className="adm2-security-box__header">
              <span className="adm2-security-box__title">Bảo mật & Quản lý tài khoản</span>
              <span className="adm2-security-box__sub">
                Cập nhật họ tên, ảnh đại diện, thay đổi mật khẩu đăng nhập hoặc email xác thực
              </span>
            </div>

            <div className="adm2-security-box__actions">
              <button
                type="button"
                className="submit-btn adm2-action-btn"
                onClick={() => setEditProfileOpen(true)}
              >
                <Edit2 size={15} />
                <span>Chỉnh sửa thông tin</span>
              </button>

              <button
                type="button"
                className="cancel-btn adm2-action-btn"
                onClick={() => setChangePasswordOpen(true)}
              >
                <KeyRound size={15} />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                type="button"
                className="cancel-btn adm2-action-btn"
                onClick={() => setChangeEmailOpen(true)}
              >
                <Mail size={15} />
                <span>Đổi email</span>
              </button>
            </div>
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

      <AdminEditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        admin={currentAdmin}
        onSuccess={handleEditProfileSuccess}
      />

      <AdminChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <AdminChangeEmailModal
        open={changeEmailOpen}
        onClose={() => setChangeEmailOpen(false)}
        currentEmail={email !== "—" ? email : ""}
      />
    </div>
  );
}
