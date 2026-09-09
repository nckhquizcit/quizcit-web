import { useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import Modal from "../ui/Modal";
import { getErrorMessage } from "../../../../services/apiClient";
import { logout } from "../../../../services/authService";
import { useToast } from "../../../../components/ui";
import { adminProfileService } from "../../services/profileService";
import { validateChangePassword, PASSWORD_MIN_LENGTH } from "../../utils/adminProfileLogic";
import "./modal.css";

export default function AdminChangePasswordModal({ open, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPasswordInputRef = useRef(null);
  const titleId = useId();

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setFormError("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validationError = validateChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await adminProfileService.changeAdminPassword(currentPassword, newPassword);
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.");
      logout();
      navigate("/login");
    } catch (error) {
      if (error?.status === 401) {
        setFormError("Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.");
      } else {
        setFormError(getErrorMessage(error, "Không thể đổi mật khẩu. Vui lòng thử lại."));
      }
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} labelledById={titleId} initialFocusRef={currentPasswordInputRef}>
      <div className="modal-header">
        <h3 id={titleId}>Đổi mật khẩu quản trị</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="admin-modal-notice">
            <ShieldAlert size={18} className="admin-modal-notice-icon" />
            <p>
              Sau khi đổi mật khẩu thành công, mọi phiên đăng nhập hiện tại sẽ bị thu hồi tự động vì lý do bảo mật.
              Bạn sẽ cần đăng nhập lại bằng mật khẩu mới.
            </p>
          </div>

          {formError && <p className="modal-inline-error">{formError}</p>}

          {/* Current password */}
          <div className="form-group">
            <label htmlFor="admin-current-password">
              Mật khẩu hiện tại <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <div className="admin-password-wrapper">
              <input
                ref={currentPasswordInputRef}
                id="admin-current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu hiện tại"
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                aria-label={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="form-group">
            <label htmlFor="admin-new-password">
              Mật khẩu mới <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <div className="admin-password-wrapper">
              <input
                id="admin-new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="admin-field-hint">Mật khẩu phải có độ dài từ 6 đến 255 ký tự.</span>
          </div>

          {/* Confirm new password */}
          <div className="form-group">
            <label htmlFor="admin-confirm-password">
              Nhập lại mật khẩu mới <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <div className="admin-password-wrapper">
              <input
                id="admin-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới vừa đặt"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="modal-btn primary submit-btn"
            type="submit"
            disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
          >
            <KeyRound size={16} />
            <span>{isSubmitting ? "Đang cập nhật..." : "Đổi mật khẩu"}</span>
          </button>
          <button
            className="modal-btn secondary cancel-btn"
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Hủy
          </button>
        </div>
      </form>
    </Modal>
  );
}
