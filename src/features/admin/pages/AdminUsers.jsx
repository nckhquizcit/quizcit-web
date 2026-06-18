import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
import AuthorizationModal from "../components/modals/AuthorizationModal";
import { deleteUser, getUsers } from "../../../services/userService";

import "../Admin.css";
import "./AdminUsers.css";
import "../components/modals/modal.css";

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ===== FILTER =====
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data || []);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchSearch =
        !normalizedSearch ||
        user.username?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch);
      const matchStatus = filterStatus === "ALL" || user.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [users, searchTerm, filterStatus]);

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

  const handleConfirm = async () => {
    if (!selectedUser?.userId) return;
    await deleteUser(selectedUser.userId);
    setUsers((currentUsers) =>
      currentUsers.filter((user) => user.userId !== selectedUser.userId),
    );
    closeConfirmModal();
  };

  const handleAuthSave = (newRole) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.userId === selectedUser?.userId ? { ...user, role: newRole } : user,
      ),
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
          {loading && (
            <tr>
              <td colSpan={6}>Đang tải dữ liệu người dùng...</td>
            </tr>
          )}
          {!loading &&
            filteredUsers.map((user) => (
            <tr key={user.userId}>
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

              <td>{user.userId}</td>

              <td>
                <button
                  className="action-btn danger-btn"
                  onClick={() => openConfirmModal(user)}
                >
                  Xóa
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
