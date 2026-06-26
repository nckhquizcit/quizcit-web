import "./ui.css";

export default function Modal({ open, onClose, children, containerClassName = "" }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-container ${containerClassName}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} type="button">
          ×
        </button>

        {children}
      </div>
    </div>
  );
}
