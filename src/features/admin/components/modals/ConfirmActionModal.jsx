import { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./modal.css";

export default function ConfirmActionModal({ isOpen, onClose, onConfirm, user }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || isSubmitting) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !user) return null;

  const username = user.username || user.displayName || user.fullName || "";

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) handleClose();
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h3>Xác nhận hành động</h3>
          <button className="close-btn" onClick={handleClose} type="button" aria-label="Đóng" disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p>
            Bạn có muốn khóa người dùng "<strong>{username}</strong>" không?
          </p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn primary" onClick={handleConfirm} disabled={isSubmitting}>
            Có
          </button>
          <button className="modal-btn secondary" onClick={handleClose} disabled={isSubmitting}>
            Không
          </button>
        </div>
      </div>
    </div>
  );
}
