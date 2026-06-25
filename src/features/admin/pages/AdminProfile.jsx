import React, { useEffect, useMemo, useState } from 'react';
import { adminProfileService } from '../services/profileService.js';
import './AdminProfile.css';

const emptyStats = {
  totalUsers: 0,
  totalSubjects: 0,
  totalQuestions: 0,
  totalAttempts: 0,
};

function IconShield({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5l7 3.1v7.1c0 5.3-3 8.9-7 9.9-4-1-7-4.6-7-9.9V5.6l7-3.1z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 6.5v12.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.25"
      />
    </svg>
  );
}

function IconPencil({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-.7-.7a2 2 0 0 0-2.8 0L4 16v4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconMail({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7.5h15v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 8.5l6.5 5 6.5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 11V8.8A5 5 0 0 1 12 4a5 5 0 0 1 5 4.8V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 11.5h9A2 2 0 0 1 18.5 13.5v5A2 2 0 0 1 16.5 20.5h-9A2 2 0 0 1 5.5 18.5v-5A2 2 0 0 1 7.5 11.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 21v-1.5c0-2-1.6-3.5-3.5-3.5h-3C7.6 16 6 17.5 6 19.5V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M11 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 11 12z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M18 21v-1.2c0-1.4-.8-2.6-2-3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M15.5 5.9a2.8 2.8 0 0 1 0 5.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function IconBook({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 4.5H18a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H8a3.5 3.5 0 0 0-3.5-3.5V6.5a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 17.5H8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconQuestion({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M10.3 9.2a2 2 0 0 1 3.4 1.3c0 1.5-1.7 1.8-1.7 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 16.8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconAttempt({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4.5h8l2 2V19.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 11h6M9 14.5h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15 4.5v2h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      <h1 className="admin-profile-title">Thông tin quản trị viên</h1>
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
            <span className="admin-card__headerTitle admin-card__headerTitle--purple">Quyền hạn</span>
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
            <div className="admin-stat__icon admin-stat__icon--purple">
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
