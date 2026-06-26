import { useCallback, useEffect, useMemo, useState } from "react";
import { Lock, Shield, Trash2, Users } from "lucide-react";
import { changeUserRole, deleteUser, getUsers, updateUserStatus } from "../../../services/userService";
import { getErrorMessage } from "../../../services/apiClient";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable from "../components/ui/DataTable";
import RowActions from "../components/ui/RowActions";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import { useToast } from "../../../components/ui/Toast/Toast";
import AuthorizationModal from "../components/modals/AuthorizationModal";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
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

const STATUS_TONE = {
  VERIFIED: "success",
  UNVERIFIED: "warning",
  BANNED: "error",
};

const formatRole = (role) => ROLE_LABELS[role] || role || "—";
const formatStatus = (status) => STATUS_LABELS[status] || status || "—";

export default function AdminUsers() {
  const toast = useToast();
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setUsers((await getUsers()) || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách người dùng."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const visibleUsers = useMemo(
    () =>
      filterStatus === "ALL" ? users : users.filter((user) => user.status === filterStatus),
    [users, filterStatus],
  );

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
      toast.success("Đã khóa người dùng.");
    } catch (actionError) {
      toast.error(getErrorMessage(actionError, "Không thể cập nhật trạng thái người dùng."));
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
      toast.success("Đã cập nhật vai trò người dùng.");
    } catch (actionError) {
      toast.error(getErrorMessage(actionError, "Không thể cập nhật vai trò người dùng."));
    } finally {
      closeAuthModal();
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser?.userId) return;
    await deleteUser(deletingUser.userId);
    setUsers((currentUsers) => currentUsers.filter((item) => item.userId !== deletingUser.userId));
    setDeletingUser(null);
    toast.success("Đã xóa người dùng.");
  };

  const columns = [
    {
      key: "username",
      label: "Tên đăng nhập",
      sortable: true,
      render: (user) => <strong>{user.username}</strong>,
    },
    { key: "email", label: "Email", sortable: true },
    {
      key: "role",
      label: "Vai trò",
      sortable: true,
      sortValue: (user) => formatRole(user.role),
      render: (user) => formatRole(user.role),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      sortValue: (user) => formatStatus(user.status),
      render: (user) => (
        <span className={`status-badge status-badge--${STATUS_TONE[user.status] || "muted"}`}>
          {formatStatus(user.status)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: 60,
      align: "right",
      render: (user) => (
        <RowActions
          items={[
            {
              label: "Đổi vai trò",
              icon: <Shield size={16} />,
              onClick: () => {
                setSelectedUser(user);
                setIsAuthModalOpen(true);
              },
            },
            ...(user.status === "BANNED"
              ? []
              : [
                  {
                    label: "Khóa tài khoản",
                    icon: <Lock size={16} />,
                    onClick: () => {
                      setSelectedUser(user);
                      setIsConfirmModalOpen(true);
                    },
                  },
                ]),
            {
              label: "Xóa",
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => setDeletingUser(user),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="admin-users-page">
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Người dùng"]}
        title="Quản lý người dùng"
        subtitle="Quản lý tài khoản, trạng thái và phân quyền người dùng"
        icon={<Users size={22} />}
      />

      {error ? (
        <ErrorState description={error} onRetry={loadUsers} />
      ) : (
        <DataTable
          columns={columns}
          rows={visibleUsers}
          getRowKey={(user) => user.userId}
          loading={loading}
          searchPlaceholder="Tìm kiếm theo tên hoặc email..."
          searchKeys={["username", "email"]}
          emptyState={
            <EmptyState
              icon={<Users size={28} />}
              title="Không có người dùng"
              description="Không tìm thấy người dùng phù hợp với bộ lọc hiện tại."
            />
          }
          toolbarExtra={
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="VERIFIED">Đã xác thực</option>
              <option value="UNVERIFIED">Chưa xác thực</option>
              <option value="BANNED">Đã khóa</option>
            </select>
          }
        />
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

      <ConfirmDeleteModal
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Xóa người dùng"
        message="Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác."
        itemName={deletingUser?.username || ""}
      />
    </div>
  );
}
