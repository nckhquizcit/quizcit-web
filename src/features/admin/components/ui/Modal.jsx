import { X } from "lucide-react";
import "./ui.css";

export default function Modal({ open, onClose, children, containerClassName = "" }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-container ${containerClassName}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} type="button" aria-label="Đóng">
          <X size={18} />
        </button>

        {children}
      </div>
    </div>
  );
}
