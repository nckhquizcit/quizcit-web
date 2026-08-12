import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, KeyRound, LogOut, X } from "lucide-react";
import { getErrorMessage, getStoredUser, setStoredUser } from "../../../../services/apiClient";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  updateCurrentUserProfile,
} from "../../../../services/userService";
import { logout } from "../../../../services/authService";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Spinner,
  ErrorState,
  useToast,
} from "../../../../components/ui";
import "./ProfilePage.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
const DISPLAY_NAME_MAX_LENGTH = 100;

function mergeAndStoreUser(nextUser) {
  const storedUser = getStoredUser() || {};
  const mergedUser = {
    ...storedUser,
    ...nextUser,
    accessToken: storedUser.accessToken,
    tokenType: storedUser.tokenType,
    expiresAt: storedUser.expiresAt,
  };

  setStoredUser(mergedUser);
  return mergedUser;
}

function getInitial(name) {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function ProfileModal({ title, children, onClose }) {
  return (
    <div className="profile-modal-backdrop" onMouseDown={onClose}>
      <div
        className="profile-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="profile-modal-header">
          <h3 id="profile-modal-title">{title}</h3>
          <button className="profile-modal-close" type="button" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [profileUser, setProfileUser] = useState(() => getStoredUser());
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [editForm, setEditForm] = useState({ displayName: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoadingProfile(true);
      setProfileError("");
      try {
        const user = await getCurrentUser();
        if (!isMounted) return;
        setProfileUser(mergeAndStoreUser(user));
      } catch (error) {
        if (!isMounted) return;
        setProfileError(getErrorMessage(error, "Không thể tải hồ sơ người dùng."));
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = profileUser?.displayName || profileUser?.username || "Người dùng";
  const isVerified = profileUser?.status === "VERIFIED";
  const roleLabel = profileUser?.role === "ADMINISTRATOR" ? "Quản trị viên" : "Học viên";

  function openEditModal() {
    setFormError("");
    setEditForm({
      displayName: profileUser?.displayName || profileUser?.username || "",
      email: profileUser?.email || "",
    });
    setActiveModal("edit");
  }

  function openPasswordModal() {
    setFormError("");
    setPasswordForm({ password: "", confirmPassword: "" });
    setActiveModal("password");
  }

  function closeModal() {
    if (isSubmitting) return;
    setActiveModal(null);
    setFormError("");
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function submitEdit(event) {
    event.preventDefault();
    setFormError("");

    const displayNameValue = editForm.displayName.trim();
    const emailValue = editForm.email.trim();

    if (!displayNameValue) {
      setFormError("Vui lòng nhập tên hiển thị.");
      return;
    }
    if (displayNameValue.length > DISPLAY_NAME_MAX_LENGTH) {
      setFormError(`Tên hiển thị không được vượt quá ${DISPLAY_NAME_MAX_LENGTH} ký tự.`);
      return;
    }
    if (!emailValue) {
      setFormError("Vui lòng nhập email.");
      return;
    }
    if (!EMAIL_PATTERN.test(emailValue)) {
      setFormError("Email không hợp lệ.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await updateCurrentUserProfile({
        displayName: displayNameValue,
        email: emailValue,
      });
      setProfileUser(mergeAndStoreUser(updatedUser));
      toast.success("Đã lưu thay đổi hồ sơ.");
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể cập nhật hồ sơ."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPasswordUpdate(event) {
    event.preventDefault();
    setFormError("");

    const password = passwordForm.password.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (password.length < PASSWORD_MIN_LENGTH) {
      setFormError(`Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changeCurrentUserPassword(password);
      toast.success("Đã cập nhật mật khẩu.");
      setActiveModal(null);
      setPasswordForm({ password: "", confirmPassword: "" });
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể cập nhật mật khẩu."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (profileError && !profileUser) {
    return (
      <div className="profile-page-wrapper">
        <ErrorState description={profileError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper">
      {isLoadingProfile && (
        <div className="profile-inline-loading">
          <Spinner size={18} />
          <span>Đang tải hồ sơ...</span>
        </div>
      )}

      {profileError && <p className="profile-inline-error">{profileError}</p>}

      <Card as="section" padding="lg" className="profile-header-card">
        <div className="profile-header-card__avatar">{getInitial(displayName)}</div>
        <div className="profile-header-card__body">
          <div className="profile-header-card__top">
            <h2>{displayName}</h2>
            <Badge variant={isVerified ? "success" : "warning"}>
              {isVerified ? "Đã xác minh" : "Chưa xác minh"}
            </Badge>
          </div>
          <p className="profile-header-card__handle">
            @{profileUser?.username || "unknown"} · Học viên
          </p>
          <p className="profile-header-card__email">{profileUser?.email || "—"}</p>
        </div>
        <Button
          variant="secondary"
          className="profile-header-card__edit"
          iconLeft={<Edit2 size={16} />}
          onClick={openEditModal}
        >
          Chỉnh sửa hồ sơ
        </Button>
      </Card>

      <div className="profile-cards-row">
        <Card as="section" padding="lg" className="profile-info-card">
          <h3>Thông tin tài khoản</h3>
          <div className="profile-info-list">
            <div className="profile-info-row">
              <span className="profile-info-row__label">Tên hiển thị</span>
              <span className="profile-info-row__value">{displayName}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-row__label">Tên đăng nhập</span>
              <span className="profile-info-row__value">{profileUser?.username || "—"}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-row__label">Email</span>
              <span className="profile-info-row__value">{profileUser?.email || "—"}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-row__label">Vai trò</span>
              <span className="profile-info-row__value">{roleLabel}</span>
            </div>
          </div>
        </Card>

        <Card as="section" padding="lg" className="profile-security-card">
          <h3>Bảo mật</h3>
          <div className="profile-security-row">
            <span className="profile-security-row__label">Mật khẩu</span>
            <span className="profile-security-row__value">••••••••</span>
          </div>
          <Button variant="secondary" fullWidth iconLeft={<KeyRound size={16} />} onClick={openPasswordModal}>
            Đổi mật khẩu
          </Button>
          <div className="profile-security-divider" />
          <button type="button" className="profile-logout-link" onClick={handleLogout}>
            <LogOut size={14} />
            Đăng xuất khỏi tài khoản
          </button>
        </Card>
      </div>

      {activeModal === "edit" && (
        <ProfileModal title="Chỉnh sửa hồ sơ" onClose={closeModal}>
          <form className="profile-modal-content" onSubmit={submitEdit}>
            {formError && <p className="profile-form-error">{formError}</p>}
            <Field label="Tên hiển thị" htmlFor="profile-display-name">
              <Input
                id="profile-display-name"
                value={editForm.displayName}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, displayName: event.target.value }))
                }
                autoFocus
              />
            </Field>
            <Field label="Email" htmlFor="profile-email">
              <Input
                id="profile-email"
                type="email"
                value={editForm.email}
                maxLength={100}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </Field>
            <p className="profile-info-box">
              Email mới cần đúng định dạng. Thông tin đăng nhập được cập nhật sau khi lưu
              thành công.
            </p>
            <div className="profile-modal-actions">
              <Button variant="ghost" type="button" onClick={closeModal} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </ProfileModal>
      )}

      {activeModal === "password" && (
        <ProfileModal title="Đổi mật khẩu" onClose={closeModal}>
          <form className="profile-modal-content" onSubmit={submitPasswordUpdate}>
            <p className="profile-modal-sub">Mật khẩu mới tối thiểu 6 ký tự.</p>
            {formError && <p className="profile-form-error">{formError}</p>}
            <Field label="Mật khẩu mới" htmlFor="profile-password">
              <Input
                id="profile-password"
                type="password"
                value={passwordForm.password}
                minLength={PASSWORD_MIN_LENGTH}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, password: event.target.value }))
                }
                autoFocus
              />
            </Field>
            <Field label="Nhập lại mật khẩu" htmlFor="profile-confirm-password">
              <Input
                id="profile-confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                minLength={PASSWORD_MIN_LENGTH}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
            </Field>
            <p className="profile-info-box">
              Không dùng lại mật khẩu cũ. Sau khi đổi, hãy đăng nhập lại trên thiết bị khác.
            </p>
            <div className="profile-modal-actions">
              <Button variant="ghost" type="button" onClick={closeModal} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>
        </ProfileModal>
      )}
    </div>
  );
}
