import React from 'react';
import "./modal.css";
export default function ConfirmActionModal({ isOpen, onClose, onConfirm, user }) {
    if (!isOpen || !user) return null;
  const userId = user.userId || user.user_id;

  const handleConfirm = () => {
    console.log(`Ban user ${userId}`);
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Xác nhận hành động</h3>
        </div>
        <div className="modal-body">
          <p>Bạn có muốn ban người dùng {userId} không?</p>
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
