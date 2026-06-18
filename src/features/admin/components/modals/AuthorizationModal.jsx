import React from "react";
import "./modal.css";

export default function AuthorizationModal({ isOpen, onClose, user, onSave }) {
  const [role, setRole] = React.useState("USER"); // default an toàn

  // 🧠 sync lại khi user thay đổi
  React.useEffect(() => {
    if (user) {
      setRole(user.role);
    }
  }, [user]);

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

          <div style={{ marginTop: "12px" }}>
            <label style={{ display: "block", marginBottom: "6px" }}>
              Role
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
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