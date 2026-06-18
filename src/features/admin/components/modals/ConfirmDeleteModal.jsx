import Modal from "../ui/Modal";

export default function ConfirmDeleteModal({
  open,
  onClose,
  title,
  message,
  itemName,
  onConfirm,
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="question-modal delete-question-modal">
        <h2>{title || "Xác nhận xóa"}</h2>
        <p>{message || `Bạn có muốn xóa "${itemName}" không?`}</p>
        {itemName && (
          <div className="delete-question-preview">
            <strong>{itemName}</strong>
          </div>
        )}
        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={onClose}>Không</button>
          <button className="danger-btn" onClick={onConfirm}>Có</button>
        </div>
      </div>
    </Modal>
  );
}