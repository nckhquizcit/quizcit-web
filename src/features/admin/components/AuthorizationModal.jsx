import React, { useState, useEffect } from 'react';
import { X } from "lucide-react";
import "../modals/modal.css";

export default function AuthorizationModal({ isOpen, onClose, user, onSave }) {
  const [role, setRole] = useState('USER');
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) setRole(user.role);
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen || !user) return null;

  const rawDisplayName = user.displayName || user.fullName || "";
  const displayName =
    rawDisplayName && rawDisplayName !== user.username ? rawDisplayName : "Chưa có tên hiển thị";

  const handleSave = () => {
    onSave(role);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Cấp quyền</h3>
          <button className="close-btn" onClick={onClose} type="button" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p><strong>Mã người dùng:</strong> {user.userId || user.user_id}</p>
          <p><strong>Tên đăng nhập:</strong> {user.username}</p>
          <p><strong>Tên hiển thị:</strong> {displayName}</p>
          <div style={{marginTop: '12px'}}>
            <label>Vai trò</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
              }}
            >
              <option value="USER">Người dùng</option>
              <option value="ADMINISTRATOR">Quản trị viên</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn primary" onClick={handleSave}>
            Lưu
          </button>
          <button className="modal-btn secondary" onClick={onClose}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
