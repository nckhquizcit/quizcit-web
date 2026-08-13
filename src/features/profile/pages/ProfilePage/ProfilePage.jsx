import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Eye, EyeOff, KeyRound, LogOut, Mail, X } from "lucide-react";
import { getErrorMessage, getStoredUser, setStoredUser } from "../../../../services/apiClient";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  updateCurrentUserProfile,
} from "../../../../services/userService";
import {
  confirmEmailChange,
  requestEmailChange,
  verifyOldEmail,
} from "../../../../services/emailChangeService";
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

const PASSWORD_MIN_LENGTH = 6;
const DISPLAY_NAME_MAX_LENGTH = 100;
const OTP_LENGTH = 6;
const OTP_PATTERN = /^\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mergeAndStoreUser(nextUser) {
  const storedUser = getStoredUser() || {};
  const mergedUser = { ...storedUser, ...nextUser };

  setStoredUser(mergedUser);
  return mergedUser;
}

function getInitial(name) {
  const trimmed = (name || "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function ProfileModal({ title, children, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

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
  const [editForm, setEditForm] = useState({ displayName: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // "loading" | "ready" | "expired" (challenge chet, phai bat dau lai) | "failed" (khong mo duoc luong)
  const [emailStatus, setEmailStatus] = useState("loading");
  const [emailStep, setEmailStep] = useState(1);
  const [emailChallenge, setEmailChallenge] = useState(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");

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
    });
    setActiveModal("edit");
  }

  function openPasswordModal() {
    setFormError("");
    setConfirmPasswordError("");
    setPasswordForm({ currentPassword: "", password: "", confirmPassword: "" });
    setShowCurrentPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setActiveModal("password");
  }

  async function startEmailChange() {
    setFormError("");
    setEmailStep(1);
    setEmailChallenge(null);
    setEmailOtp("");
    setNewEmail("");
    setEmailStatus("loading");

    try {
      const challenge = await requestEmailChange();
      setEmailChallenge({
        challengeId: challenge?.challengeId,
        email: challenge?.email || profileUser?.email || "",
      });
      setEmailStatus("ready");
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể gửi mã xác thực. Vui lòng thử lại sau."));
      setEmailStatus("failed");
    }
  }

  function openEmailModal() {
    setActiveModal("email");
    startEmailChange();
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

    if (!displayNameValue) {
      setFormError("Vui lòng nhập tên hiển thị.");
      return;
    }
    if (displayNameValue.length > DISPLAY_NAME_MAX_LENGTH) {
      setFormError(`Tên hiển thị không được vượt quá ${DISPLAY_NAME_MAX_LENGTH} ký tự.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await updateCurrentUserProfile({
        displayName: displayNameValue,
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
    setConfirmPasswordError("");

    // Khong trim mat khau: khoang trang dau/cuoi la ky tu hop le.
    const currentPassword = passwordForm.currentPassword;
    const password = passwordForm.password;
    const confirmPassword = passwordForm.confirmPassword;

    if (!currentPassword) {
      setFormError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setFormError(`Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`);
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changeCurrentUserPassword(currentPassword, password);
      // BE thu hoi moi phien sau khi doi mat khau -> phai dang nhap lai.
      toast.success("Đã cập nhật mật khẩu. Vui lòng đăng nhập lại.");
      logout();
      navigate("/login");
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể cập nhật mật khẩu."));
      setIsSubmitting(false);
    }
  }

  function showEmailFlowError(error, fallback, isDeadOnConflict = false) {
    const status = error?.status;
    setFormError(getErrorMessage(error, fallback));
    if (status === 400 || status === 429 || (isDeadOnConflict && status === 409)) {
      setEmailStatus("expired");
    }
  }

  async function submitEmailVerifyOld(event) {
    event.preventDefault();
    setFormError("");

    const newEmailValue = newEmail.trim();

    if (!OTP_PATTERN.test(emailOtp)) {
      setFormError(`Mã xác thực gồm ${OTP_LENGTH} chữ số.`);
      return;
    }
    if (!EMAIL_PATTERN.test(newEmailValue)) {
      setFormError("Email mới không hợp lệ.");
      return;
    }
    if (newEmailValue.toLowerCase() === (profileUser?.email || "").trim().toLowerCase()) {
      setFormError("Email mới phải khác email hiện tại.");
      return;
    }

    setIsSubmitting(true);
    try {
      const challenge = await verifyOldEmail({
        challengeId: emailChallenge?.challengeId,
        otp: emailOtp,
        newEmail: newEmailValue,
      });
      setEmailChallenge({
        challengeId: challenge?.challengeId,
        email: challenge?.email || newEmailValue,
      });
      setEmailOtp("");
      setEmailStep(2);
    } catch (error) {
      showEmailFlowError(error, "Không thể xác thực mã. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitEmailConfirm(event) {
    event.preventDefault();
    setFormError("");

    if (!OTP_PATTERN.test(emailOtp)) {
      setFormError(`Mã xác thực gồm ${OTP_LENGTH} chữ số.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmEmailChange({ challengeId: emailChallenge?.challengeId, otp: emailOtp });
      // BE thu hoi moi phien sau khi doi email -> phai dang nhap lai.
      toast.success("Đã đổi email. Vui lòng đăng nhập lại.");
      logout();
      navigate("/login");
    } catch (error) {
      showEmailFlowError(error, "Không thể xác nhận đổi email.", true);
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
            @{profileUser?.username || "unknown"} · {roleLabel}
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
          <div className="profile-security-actions">
            <Button
              variant="secondary"
              fullWidth
              iconLeft={<KeyRound size={16} />}
              onClick={openPasswordModal}
            >
              Đổi mật khẩu
            </Button>
            <Button
              variant="secondary"
              fullWidth
              iconLeft={<Mail size={16} />}
              onClick={openEmailModal}
            >
              Đổi email
            </Button>
          </div>
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
              <div className="profile-email-row">
                <Input id="profile-email" type="email" value={profileUser?.email || ""} disabled />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={openEmailModal}
                  disabled={isSubmitting}
                >
                  Đổi email
                </Button>
              </div>
            </Field>
            <p className="profile-info-box">
              Email không đổi trực tiếp tại đây. Nhấn “Đổi email” để xác thực OTP ở email hiện tại
              và email mới.
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
            <Field label="Mật khẩu hiện tại" htmlFor="profile-current-password">
              <div className="profile-pwd">
                <Input
                  id="profile-current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  autoComplete="current-password"
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  autoFocus
                />
                <button
                  type="button"
                  className="profile-pwd-toggle"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  aria-label={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            <Field label="Mật khẩu mới" htmlFor="profile-password">
              <div className="profile-pwd">
                <Input
                  id="profile-password"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.password}
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
                <button
                  type="button"
                  className="profile-pwd-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            <Field
              label="Nhập lại mật khẩu"
              htmlFor="profile-confirm-password"
              error={confirmPasswordError}
            >
              <div className="profile-pwd">
                <Input
                  id="profile-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  minLength={PASSWORD_MIN_LENGTH}
                  autoComplete="new-password"
                  invalid={Boolean(confirmPasswordError)}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                />
                <button
                  type="button"
                  className="profile-pwd-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword ? "Ẩn mật khẩu nhập lại" : "Hiện mật khẩu nhập lại"
                  }
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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

      {activeModal === "email" && (
        <ProfileModal title="Đổi email" onClose={closeModal}>
          {emailStatus === "loading" && (
            <div className="profile-modal-content profile-email-loading">
              <Spinner size={18} />
              <span>Đang gửi mã xác thực...</span>
            </div>
          )}

          {emailStatus === "failed" && (
            <div className="profile-modal-content">
              <p className="profile-form-error">{formError}</p>
              <div className="profile-modal-actions">
                <Button variant="secondary" type="button" onClick={closeModal}>
                  Đóng
                </Button>
              </div>
            </div>
          )}

          {emailStatus === "expired" && (
            <div className="profile-modal-content">
              <p className="profile-form-error">{formError}</p>
              <p className="profile-info-box">
                Phiên xác thực đã kết thúc. Hãy bắt đầu lại để nhận mã mới.
              </p>
              <div className="profile-modal-actions">
                <Button variant="ghost" type="button" onClick={closeModal}>
                  Hủy
                </Button>
                <Button variant="primary" type="button" onClick={startEmailChange}>
                  Bắt đầu lại
                </Button>
              </div>
            </div>
          )}

          {emailStatus === "ready" && emailStep === 1 && (
            <form className="profile-modal-content" onSubmit={submitEmailVerifyOld}>
              <p className="profile-modal-sub">
                Mã xác thực đã gửi tới <strong>{emailChallenge?.email || "email hiện tại"}</strong>.
                Mã có hiệu lực trong 5 phút.
              </p>
              {formError && <p className="profile-form-error">{formError}</p>}
              <Field label="Mã xác thực" htmlFor="profile-email-otp">
                <Input
                  id="profile-email-otp"
                  className="profile-otp-input"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={emailOtp}
                  onChange={(event) =>
                    setEmailOtp(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
                  }
                  autoFocus
                />
              </Field>
              <Field label="Email mới" htmlFor="profile-new-email">
                <Input
                  id="profile-new-email"
                  type="email"
                  autoComplete="email"
                  placeholder="email-moi@example.com"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                />
              </Field>
              <p className="profile-info-box">
                Sau bước này, một mã xác thực khác sẽ được gửi tới email mới để xác nhận.
              </p>
              <div className="profile-modal-actions">
                <Button variant="ghost" type="button" onClick={closeModal} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button variant="primary" type="submit" loading={isSubmitting}>
                  Tiếp tục
                </Button>
              </div>
            </form>
          )}

          {emailStatus === "ready" && emailStep === 2 && (
            <form className="profile-modal-content" onSubmit={submitEmailConfirm}>
              <p className="profile-modal-sub">
                Mã xác thực đã gửi tới <strong>{emailChallenge?.email || "email mới"}</strong>. Mã có
                hiệu lực trong 5 phút.
              </p>
              {formError && <p className="profile-form-error">{formError}</p>}
              <Field label="Mã xác thực" htmlFor="profile-email-otp-new">
                <Input
                  id="profile-email-otp-new"
                  className="profile-otp-input"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={emailOtp}
                  onChange={(event) =>
                    setEmailOtp(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
                  }
                  autoFocus
                />
              </Field>
              <p className="profile-info-box">
                Sau khi đổi email thành công, mọi phiên đăng nhập sẽ bị thu hồi và bạn cần đăng nhập
                lại.
              </p>
              <div className="profile-modal-actions">
                <Button variant="ghost" type="button" onClick={closeModal} disabled={isSubmitting}>
                  Hủy
                </Button>
                <Button variant="primary" type="submit" loading={isSubmitting}>
                  Xác nhận đổi email
                </Button>
              </div>
            </form>
          )}
        </ProfileModal>
      )}
    </div>
  );
}
