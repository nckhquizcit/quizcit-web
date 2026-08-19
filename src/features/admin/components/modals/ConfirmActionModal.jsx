import { useId, useState } from "react";
import Modal from "../ui/Modal";
import "./modal.css";

export default function ConfirmActionModal({ isOpen, onClose, onConfirm, user, message }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleId = useId();

  if (!user) {
    return <Modal open={false} onClose={onClose} labelledById={titleId} />;
  }

  const username = user.username || user.displayName || user.fullName || "";

  const handleClose = () => {
    if (!isSubmitting) onClose();
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
    <Modal open={isOpen} onClose={handleClose} labelledById={titleId}>
      <div className="modal-header">
        <h3 id={titleId}>Xác nhận hành động</h3>
      </div>
      <div className="modal-body">
        <p>
          {message || (
            <>
              Bạn có muốn khóa người dùng "<strong>{username}</strong>" không?
            </>
          )}
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
    </Modal>
  );
}
