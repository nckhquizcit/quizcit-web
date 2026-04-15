import React from 'react';
import modalCss from '../modal.css';

export default function ConfirmActionModal({ isOpen, onClose, onConfirm, user }) {
  if (!isOpen || !user) return null;

  const handleConfirm = () => {
    console.log(`Locked user ${user.user_id}`);
    onConfirm();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Xác nhận hành động</h3>
        </div>
        <div className="modal-body">
          <p>Bạn có muốn cấm người dùng {user.user_id} không?</p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn primary" onClick={handleConfirm}>
            Yes
          </button>
          <button className="modal-btn secondary" onClick={onClose}>
            No
          </button>
        </div>
      </div>
    </div>
  );
}