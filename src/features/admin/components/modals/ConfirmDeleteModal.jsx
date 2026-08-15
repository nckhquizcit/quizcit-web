import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { getErrorMessage } from "../../../../services/apiClient";
import "./modal.css";

export default function ConfirmDeleteModal({ open, onClose, title, message, itemName, onConfirm }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) {
      setSubmitting(false);
      setSubmitError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, submitting]);

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

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay danger" onClick={handleClose} role="presentation">
      <div
        className="modal-content danger-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="danger-icon">
          <Trash2 size={48} color="#dc2626" />
        </div>

        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={handleClose} disabled={submitting} aria-label="Đóng">
            <X size={18} />
          </button>
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
          <button
            className="danger-btn"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Đang xóa..." : "Có, xóa hẳn"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
