import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getErrorMessage } from "../../../../services/apiClient";
import "./modal.css";

const PASSWORD_MIN_LENGTH = 6;

export default function ResetPasswordModal({ isOpen, onClose, user, onSave }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setFormError("");
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen || isSubmitting) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !user) return null;

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) handleClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError("");
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setFormError(`Mật khẩu mới cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(newPassword);
      onClose();
    } catch (error) {
      // Giu modal mo de admin khong mat mat khau vua go.
      setFormError(getErrorMessage(error, "Không thể đặt lại mật khẩu. Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h3>Đặt lại mật khẩu</h3>
          <button className="close-btn" onClick={handleClose} type="button" aria-label="Đóng" disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>
              Đặt mật khẩu mới cho "<strong>{user.username}</strong>". Mọi phiên đăng nhập của
              người này sẽ bị thu hồi ngay sau khi đổi.
            </p>

            {formError && <p className="modal-inline-error">{formError}</p>}

            <div className="form-group">
              <label htmlFor="admin-reset-new-password">Mật khẩu mới</label>
              <input
                id="admin-reset-new-password"
                type="password"
                value={newPassword}
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                onChange={(event) => setNewPassword(event.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-reset-confirm-password">Nhập lại mật khẩu</label>
              <input
                id="admin-reset-confirm-password"
                type="password"
                value={confirmPassword}
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="modal-btn primary" type="submit" disabled={isSubmitting}>
              Đặt lại mật khẩu
            </button>
            <button className="modal-btn secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
