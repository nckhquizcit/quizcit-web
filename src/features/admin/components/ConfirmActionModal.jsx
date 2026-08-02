import React from 'react';
import "../modals/modal.css";

export default function ConfirmActionModal({ isOpen, onClose, onConfirm, user }) {
  if (!isOpen || !user) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Xác nhận hành động</h3>
        </div>
        <div className="modal-body">
          <p>Bạn có muốn xóa người dùng {user.userId || user.user_id} không?</p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn primary" onClick={handleConfirm}>
            Có
          </button>
          <button className="modal-btn secondary" onClick={onClose}>
            Không
          </button>
        </div>
      </div>
    </div>
  );
}
