import React, { useState, useEffect } from 'react';
import "../modals/modal.css";

export default function AuthorizationModal({ isOpen, onClose, user, onSave }) {
  const [role, setRole] = useState('USER');
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (user) setRole(user.role);
  }, [user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen || !user) return null;

  const handleSave = () => {
    console.log(`Updated role of ${user.userId || user.user_id} to ${role}`);
    onSave(role);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Cấp quyền</h3>
        </div>
        <div className="modal-body">
          <p><strong>User ID:</strong> {user.userId || user.user_id}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Display Name:</strong> {user.username}</p>
          <div style={{marginTop: '12px'}}>
            <label>Role</label>
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
              <option value="USER">USER</option>
              <option value="ADMINISTRATOR">ADMINISTRATOR</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn primary" onClick={handleSave}>
            Save
          </button>
          <button className="modal-btn secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}