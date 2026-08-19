import { useEffect, useId, useState } from "react";
import { Trash2 } from "lucide-react";
import { getErrorMessage } from "../../../../services/apiClient";
import Modal from "../ui/Modal";
import "./modal.css";

export default function ConfirmDeleteModal({
  open,
  onClose,
  title,
  message,
  itemName,
  confirmText = "Có, xóa hẳn",
  onConfirm,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const titleId = useId();

  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setSubmitError("");
    }
  }, [open]);

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const handleConfirm = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onConfirm?.();
      onClose();
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể xóa. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      overlayClassName="danger"
      containerClassName="modal-content danger-card"
      labelledById={titleId}
    >
      <div className="danger-icon">
        <Trash2 size={48} color="#dc2626" />
      </div>

      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>
      </div>

      <div className="modal-body">
        <p>{message}</p>
        {itemName && (
          <div className="delete-item-highlight">
            <strong>"{itemName}"</strong>
          </div>
        )}
      </div>

      <div className="modal-footer danger-footer">
        {submitError && <div className="modal-inline-error">{submitError}</div>}
        <button className="cancel-btn" onClick={handleClose} disabled={submitting}>
          Không, giữ lại
        </button>
        <button className="danger-btn" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Đang xóa..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
