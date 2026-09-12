import { useEffect, useId, useState } from "react";
import Modal from "../ui/Modal";
import { ROLE_LABELS } from "../../utils/adminUsersLogic";
import "./modal.css";

export default function AuthorizationModal({ isOpen, onClose, user, onSave }) {
  const [role, setRole] = useState("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

  if (!user) {
    return <Modal open={false} onClose={onClose} labelledById={titleId} />;
  }

  const rawDisplayName = user.displayName || user.fullName || "";
  const displayName =
    rawDisplayName && rawDisplayName !== user.username ? rawDisplayName : "Chưa có tên hiển thị";

  const handleClose = () => {
    if (!isSubmitting) onClose();
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
    <Modal open={isOpen} onClose={handleClose} labelledById={titleId}>
      <div className="modal-header">
        <h3 id={titleId}>Cấp quyền</h3>
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

          <p className="admin-field-hint">
            {role === user.role
              ? "Chưa có thay đổi vai trò."
              : `Sẽ đổi từ ${ROLE_LABELS[user.role] || user.role} sang ${
                  ROLE_LABELS[role] || role
                } sau khi lưu.`}
          </p>
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
    </Modal>
  );
}
