import { useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
import AuthorizationModal from "../components/modals/AuthorizationModal";
import { adminUserService } from "../services/userService";

import "../Admin.css";
import "./AdminUsers.css";
import "../components/modals/modal.css";

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [users, setUsers] = useState(() => adminUserService.getUsers());

  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ===== FILTER =====
  const filteredUsers = adminUserService.filterUsers(users, {
    searchTerm,
    status: filterStatus,
  });

  // ===== ACTIONS =====
  const openConfirmModal = (user) => {
    setSelectedUser(user);
    setIsConfirmModalOpen(true);
  };

  const openAuthModal = (user) => {
    setSelectedUser(user);
    setIsAuthModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedUser(null);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setSelectedUser(null);
  };

  const handleConfirm = () => {
    setUsers((currentUsers) =>
      adminUserService.lockUser(currentUsers, selectedUser?.user_id),
    );
    closeConfirmModal();
  };

  const handleAuthSave = (newRole) => {
    setUsers((currentUsers) =>
      adminUserService.updateUserRole(currentUsers, selectedUser?.user_id, newRole),
    );
    closeAuthModal();
  };

  return (
    <div className="admin-users-page">
      {/* ===== HEADER ===== */}
      <AdminPageHeader
        title="Quản lý người dùng"
        subtitle="Quản lý tài khoản và phân quyền người dùng"
      />

      {/* ===== SEARCH + FILTER ===== */}
      <div className="admin-users-toolbar">
        <SearchBar
          placeholder="Tìm kiếm người dùng..."
          onChange={(value) => setSearchTerm(value)}
        />

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tất cả</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="UNVERIFIED">UNVERIFIED</option>
          <option value="BANNED">BANNED</option>
        </select>
      </div>

      {/* ===== TABLE ===== */}
      <table className="admin-users-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>User ID</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.user_id}>
              <td>{user.username}</td>
              <td>{user.email}</td>

              <td>
                <span
                  className={`badge ${
                    user.role === "ADMINISTRATOR"
                      ? "badge-purple"
                      : "badge-gray"
                  }`}
                >
                  {user.role}
                </span>
              </td>

              <td>
                <span
                  className={`badge ${
                    user.status === "VERIFIED"
                      ? "badge-green"
                      : user.status === "UNVERIFIED"
                      ? "badge-yellow"
                      : "badge-red"
                  }`}
                >
                  {user.status}
                </span>
              </td>

              <td>{user.user_id}</td>

              <td>
                <button
                  className="action-btn danger-btn"
                  onClick={() => openConfirmModal(user)}
                >
                  Khóa
                </button>

                <button
                  className="action-btn primary-btn"
                  onClick={() => openAuthModal(user)}
                >
                  Phân quyền
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== MODALS ===== */}
      <ConfirmActionModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={handleConfirm}
        user={selectedUser}
      />

      <AuthorizationModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onSave={handleAuthSave}
        user={selectedUser}
      />
    </div>
  );
}
