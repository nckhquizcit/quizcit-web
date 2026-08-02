import { useEffect, useMemo, useState } from "react";
import { BookOpen, ClipboardList, HelpCircle, Lock, Mail, Pencil, Shield, Users } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import { adminProfileService } from "../services/profileService.js";
import "./AdminProfile.css";

const emptyStats = {
  totalUsers: 0,
  totalSubjects: 0,
  totalQuestions: 0,
  totalAttempts: 0,
};

function IconShield({ className }) {
  return <Shield className={className} aria-hidden="true" strokeWidth={1.8} />;
}

function IconPencil({ className }) {
  return <Pencil className={className} aria-hidden="true" strokeWidth={1.8} />;
}

function IconMail({ className }) {
  return <Mail className={className} aria-hidden="true" strokeWidth={1.8} />;
}

function IconLock({ className }) {
  return <Lock className={className} aria-hidden="true" strokeWidth={1.8} />;
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

  const displayName = admin?.displayName || admin?.display_name || admin?.username || 'Admin';
  const username = admin?.username || 'admin';
  const email = admin?.email || 'admin@quizcit.vn';
  const roleCode = admin?.role || 'ADMINISTRATOR';
  const roleLabel = roleCode === 'ADMINISTRATOR' ? 'Quản trị viên' : 'Người dùng';
  const formatStat = (value) => (loading ? "..." : numberFormatter.format(value ?? 0));

  return (
    <div className="admin-profile-page">
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Hồ sơ"]}
        title="Hồ sơ quản trị"
        subtitle="Thông tin tài khoản, quyền hạn và thống kê quản trị"
        icon={<Shield size={22} />}
      />
      {error && <p className="admin-profile-error">{error}</p>}

      <div className="admin-profile-top">
        <section className="admin-card admin-card--primary">
          <header className="admin-card__header">
            <div className="admin-card__headerLeft">
              <span className="admin-card__headerDot" aria-hidden="true" />
              <span className="admin-card__headerTitle">Thông tin cá nhân</span>
            </div>
            <button type="button" className="admin-card__editBtn" disabled title="Chức năng này đang phát triển.">
              <IconPencil className="admin-icon admin-icon--sm" />
              <span>Chỉnh sửa</span>
            </button>
          </header>

          <div className="admin-profile-main">
            <div className="admin-avatar">
              <IconShield className="admin-icon admin-icon--shield" />
            </div>

            <div className="admin-fields">
              <div className="admin-field">
                <div className="admin-field__label">Tên hiển thị</div>
                <div className="admin-field__value">{displayName}</div>
              </div>
              <div className="admin-field">
                <div className="admin-field__label">Tên đăng nhập</div>
                <div className="admin-field__value">{username}</div>
              </div>
              <div className="admin-field">
                <div className="admin-field__label">Email</div>
                <div className="admin-field__value">{email}</div>
              </div>
              <div className="admin-field">
                <div className="admin-field__label">Vai trò</div>
                <div className="admin-field__value">
                  <span className="admin-rolePill">{roleLabel}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-divider" />

          <div className="admin-actions">
            <button type="button" className="admin-actionBtn admin-actionBtn--outline admin-actionBtn--blue" disabled>
              <IconMail className="admin-icon admin-icon--sm" />
              <span>Đổi email</span>
            </button>
            <button type="button" className="admin-actionBtn admin-actionBtn--outline admin-actionBtn--orange" disabled>
              <IconLock className="admin-icon admin-icon--sm" />
              <span>Đổi mật khẩu</span>
            </button>
          </div>
          <p className="admin-profile-note">Chức năng này đang phát triển.</p>
        </section>

        <section className="admin-card admin-card--permission">
          <header className="admin-card__header admin-card__header--noBorder">
            <span className="admin-card__headerTitle admin-card__headerTitle--accent">Quyền hạn</span>
          </header>

          <div className="admin-permissionBody">
            <div className="admin-permissionBadge" aria-hidden="true">
              <IconShield className="admin-icon admin-icon--shieldWhite" />
            </div>
            <div className="admin-permissionTitle">Quản trị viên hệ thống</div>
            <div className="admin-permissionSub">Toàn quyền quản lý hệ thống QuizCIT</div>
          </div>
        </section>
      </div>

      <section className="admin-stats">
        <header className="admin-stats__header">
          <span className="admin-stats__title">Thống kê hệ thống</span>
        </header>

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
              <div className="admin-stat__label">Lượt thi</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
