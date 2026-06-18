import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import "./modal.css";

export default function ConfirmDeleteModal({ open, onClose, title, message, itemName, onConfirm }) {
  if (!open) return null;

  return createPortal(
    <div className="modal-overlay danger" onClick={onClose}>
      <div className="modal-content danger-card" onClick={(e) => e.stopPropagation()}>
        <div className="danger-icon">
          <Trash2 size={48} color="#dc2626" />
        </div>

        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
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
          <button className="cancel-btn" onClick={onClose}>
            Không, giữ lại
          </button>
          <button
            className="danger-btn"
            onClick={async () => {
              try {
                await onConfirm();
                onClose();
              } catch (error) {
                console.error("Failed to delete:", error);
                alert("Không thể xóa. Vui lòng thử lại.");
              }
            }}
          >
            Có, xóa hẳn
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}