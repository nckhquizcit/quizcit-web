import { CheckCircle, Edit2, Lock, Mail, Trophy, Zap } from "lucide-react";
import "./ProfileHeader.css";

export default function ProfileHeader({
  user,
  readOnly = false,
  onOpenChangeName,
  onOpenChangeEmail,
  onOpenChangePassword,
}) {
  const disabledTitle = "Bạn không thể cập nhật thông tin cá nhân trong chế độ hiện tại.";

  return (
    <div className="profile-header-card">
      <div className="profile-info-section">
        <div className="profile-avatar">
          <div className="avatar-placeholder">{user.name.charAt(0)}</div>
        </div>

        <div className="profile-details">
          <h2 className="user-fullname">{user.name}</h2>
          <p className="user-handle">@{user.username}</p>

          <div className="action-buttons">
            <button
              className="btn-outline"
              type="button"
              disabled={readOnly}
              title={readOnly ? disabledTitle : "Đổi tên"}
              onClick={onOpenChangeName}
            >
              <Edit2 size={14} />
              <span>Đổi tên</span>
            </button>
            <button
              className="btn-outline"
              type="button"
              disabled={readOnly}
              title={readOnly ? disabledTitle : "Đổi email"}
              onClick={onOpenChangeEmail}
            >
              <Mail size={14} />
              <span>Đổi email</span>
            </button>
            <button
              className="btn-outline btn-warning"
              type="button"
              disabled={readOnly}
              title={readOnly ? disabledTitle : "Đổi mật khẩu"}
              onClick={onOpenChangePassword}
            >
              <Lock size={14} />
              <span>Đổi mật khẩu</span>
            </button>
          </div>
        </div>
      </div>

      <div className="profile-stats-section">
        <div className="stat-item">
          <div className="stat-label-group">
            <Zap size={16} className="icon-xp" />
            <span className="stat-label">Điểm XP</span>
          </div>
          <span className="stat-value text-green">{user.xp}</span>
        </div>
        <div className="stat-item">
          <div className="stat-label-group">
            <CheckCircle size={16} className="icon-completed" />
            <span className="stat-label">Bài đã làm</span>
          </div>
          <span className="stat-value text-green">{user.completedQuizzes}</span>
        </div>
        <div className="stat-item">
          <div className="stat-label-group">
            <Trophy size={16} className="icon-achievement" />
            <span className="stat-label">Thành tích</span>
          </div>
          <span className="stat-value text-green">{user.achievementsCount}</span>
        </div>
      </div>
    </div>
  );
}
