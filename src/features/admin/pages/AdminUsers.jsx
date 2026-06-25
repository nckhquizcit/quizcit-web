import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { changeUserRole, deleteUser, getUsers, updateUserStatus } from "../../../services/userService";
import { getErrorMessage } from "../../../services/apiClient";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import AuthorizationModal from "../components/modals/AuthorizationModal";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
import "../Admin.css";
import "../components/modals/modal.css";
import "./AdminUsers.css";

const ROLE_LABELS = {
  ADMINISTRATOR: "Quản trị viên",
  USER: "Người dùng",
};

const STATUS_LABELS = {
  VERIFIED: "Đã xác thực",
  UNVERIFIED: "Chưa xác thực",
  BANNED: "Đã khóa",
};

const formatRole = (role) => ROLE_LABELS[role] || role || "—";
const formatStatus = (status) => STATUS_LABELS[status] || status || "—";

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      setUsers((await getUsers()) || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách người dùng."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
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

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedUser(null);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setSelectedUser(null);
  };

  const handleLockUser = async () => {
    if (!selectedUser?.userId) return;
    try {
      const updatedUser = await updateUserStatus(selectedUser.userId, "BANNED");
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.userId === selectedUser.userId ? { ...user, ...(updatedUser || {}), status: "BANNED" } : user,
        ),
      );
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Không thể cập nhật trạng thái người dùng."));
    } finally {
      closeConfirmModal();
    }
  };

  const handleAuthSave = async (newRole) => {
    if (!selectedUser?.userId) return;
    try {
      const updatedUser = await changeUserRole(selectedUser.userId, newRole);
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.userId === selectedUser.userId ? { ...user, ...(updatedUser || {}), role: newRole } : user,
        ),
      );
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Không thể cập nhật vai trò người dùng."));
    } finally {
      closeAuthModal();
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(`Xóa người dùng ${user.username}? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;
    try {
      await deleteUser(user.userId);
      setUsers((currentUsers) => currentUsers.filter((item) => item.userId !== user.userId));
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Không thể xóa người dùng."));
    }
  };

  return (
    <div className="admin-users-page">
      <AdminPageHeader
        title="Quản lý người dùng"
        subtitle="Quản lý tài khoản, trạng thái và phân quyền người dùng"
      />

      <div className="admin-users-toolbar">
        <SearchBar placeholder="Tìm kiếm người dùng..." onChange={setSearchTerm} />
        <select className="filter-select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
          <option value="ALL">Tất cả</option>
          <option value="VERIFIED">Đã xác thực</option>
          <option value="UNVERIFIED">Chưa xác thực</option>
          <option value="BANNED">Đã khóa</option>
        </select>
      </div>

      {error && <p className="admin-error-text">{error}</p>}
      {loading && <p className="admin-empty-state">Đang tải người dùng...</p>}
      {!loading && filteredUsers.length === 0 && <p className="admin-empty-state">Không có người dùng phù hợp.</p>}

      {!loading && filteredUsers.length > 0 && (
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Tên đăng nhập</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Mã người dùng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.userId}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{formatRole(user.role)}</td>
                <td>{formatStatus(user.status)}</td>
                <td>{user.userId}</td>
                <td className="admin-users-actions">
                  <button
                    type="button"
                    className="admin-table-btn"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsAuthModalOpen(true);
                    }}
                  >
                    Vai trò
                  </button>
                  <button
                    type="button"
                    className="admin-table-btn danger"
                    disabled={user.status === "BANNED"}
                    onClick={() => {
                      setSelectedUser(user);
                      setIsConfirmModalOpen(true);
                    }}
                  >
                    Khóa
                  </button>
                  <button type="button" className="admin-table-icon danger" onClick={() => handleDeleteUser(user)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmActionModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={handleLockUser}
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
