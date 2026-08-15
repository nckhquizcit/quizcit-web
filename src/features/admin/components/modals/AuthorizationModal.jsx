import { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./modal.css";

export default function AuthorizationModal({ isOpen, onClose, user, onSave }) {
  const [role, setRole] = useState("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen || isSubmitting) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !user) return null;

  const rawDisplayName = user.displayName || user.fullName || "";
  const displayName =
    rawDisplayName && rawDisplayName !== user.username ? rawDisplayName : "Chưa có tên hiển thị";

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) handleClose();
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave(role);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h3>Cấp quyền</h3>
          <button className="close-btn" onClick={handleClose} type="button" aria-label="Đóng" disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p><strong>Mã người dùng:</strong> {user.userId || user.user_id}</p>
          <p><strong>Tên đăng nhập:</strong> {user.username}</p>
          <p><strong>Tên hiển thị:</strong> {displayName}</p>

          <div style={{ marginTop: "12px" }}>
            <label htmlFor="authorization-role-select" style={{ display: "block", marginBottom: "6px" }}>
              Vai trò
            </label>

            <select
              id="authorization-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="USER">Người dùng</option>
              <option value="ADMINISTRATOR">Quản trị viên</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn primary" onClick={handleSave} disabled={isSubmitting}>
            Lưu
          </button>
          <button className="modal-btn secondary" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
