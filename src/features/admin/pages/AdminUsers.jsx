import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Lock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import { changePassword, changeUserRole, deleteUser, getUsers, updateUserStatus } from "../../../services/userService";
import { getErrorMessage, getStoredUser } from "../../../services/apiClient";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable from "../components/ui/DataTable";
import RowActions from "../components/ui/RowActions";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import { useToast } from "../../../components/ui/Toast/Toast";
import AuthorizationModal from "../components/modals/AuthorizationModal";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import ResetPasswordModal from "../components/modals/ResetPasswordModal";
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

const STATUS_BADGE_TONE = {
  VERIFIED: "emerald",
  UNVERIFIED: "amber",
  BANNED: "red",
};

const formatRole = (role) => ROLE_LABELS[role] || role || "Chưa có";
const formatStatus = (status) => STATUS_LABELS[status] || status || "Chưa có";
const getInitials = (username) => (username || "?").trim().slice(0, 2).toUpperCase();
const SELF_LOCKOUT_MESSAGE = "Bạn không thể khóa/xóa/thay đổi vai trò tài khoản đang đăng nhập.";
const PAGE_SIZE = 20;
const EMPTY_PAGE_INFO = { totalElements: 0, totalPages: 0, first: true, last: true };

export default function AdminUsers() {
  const toast = useToast();
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState(EMPTY_PAGE_INFO);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const currentUser = useMemo(() => getStoredUser(), []);
  const currentUserId = String(currentUser?.userId || currentUser?.user_id || currentUser?.id || "");

  const loadUsers = useCallback(async (targetPage = 0) => {
    try {
      setLoading(true);
      setError("");
      const result = await getUsers({ page: targetPage, size: PAGE_SIZE });
      setItems(result?.items || []);
      setPageInfo({
        totalElements: result?.totalElements ?? 0,
        totalPages: result?.totalPages ?? 0,
        first: result?.first ?? true,
        last: result?.last ?? true,
      });
      setPage(result?.page ?? targetPage);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách người dùng."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(0);
  }, [loadUsers]);

  const visibleUsers = useMemo(
    () =>
      filterStatus === "ALL" ? items : items.filter((user) => user.status === filterStatus),
    [items, filterStatus],
  );

  const pageStats = useMemo(
    () => ({
      verified: items.filter((user) => user.status === "VERIFIED").length,
      unverified: items.filter((user) => user.status === "UNVERIFIED").length,
      banned: items.filter((user) => user.status === "BANNED").length,
    }),
    [items],
  );

  const statTiles = [
    { key: "total", label: "Tổng tài khoản", icon: <Users size={18} />, tone: "gray", value: pageInfo.totalElements },
    { key: "verified", label: `${STATUS_LABELS.VERIFIED} (trang hiện tại)`, icon: <ShieldCheck size={18} />, tone: "emerald", value: pageStats.verified },
    { key: "unverified", label: `${STATUS_LABELS.UNVERIFIED} (trang hiện tại)`, icon: <ShieldAlert size={18} />, tone: "amber", value: pageStats.unverified },
    { key: "banned", label: "Đã khóa (trang hiện tại)", icon: <Lock size={18} />, tone: "red", value: pageStats.banned },
  ];

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedUser(null);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setSelectedUser(null);
  };

  // Khoa <-> mo khoa tuy trang thai hien tai; mo khoa dua ve VERIFIED.
  const handleToggleUserLock = async () => {
    if (!selectedUser?.userId) return;
    if (String(selectedUser.userId) === currentUserId) {
      toast.error(SELF_LOCKOUT_MESSAGE);
      closeConfirmModal();
      return;
    }
    const isBanned = selectedUser.status === "BANNED";
    try {
      await updateUserStatus(selectedUser.userId, isBanned ? "VERIFIED" : "BANNED");
      toast.success(isBanned ? "Đã mở khóa người dùng." : "Đã khóa người dùng.");
      loadUsers(page);
    } catch (actionError) {
      toast.error(getErrorMessage(actionError, "Không thể cập nhật trạng thái người dùng."));
    } finally {
      closeConfirmModal();
    }
  };

  // Nem loi ra ngoai de ResetPasswordModal giu modal mo va hien loi inline.
  const handleResetPassword = async (newPassword) => {
    if (!resetUser?.userId) return;
    await changePassword(resetUser.userId, newPassword);
    toast.success("Đã đặt lại mật khẩu người dùng.");
  };

  const handleAuthSave = async (newRole) => {
    if (!selectedUser?.userId) return;
    if (String(selectedUser.userId) === currentUserId) {
      toast.error(SELF_LOCKOUT_MESSAGE);
      closeAuthModal();
      return;
    }
    try {
      await changeUserRole(selectedUser.userId, newRole);
      toast.success("Đã cập nhật vai trò người dùng.");
      loadUsers(page);
    } catch (actionError) {
      toast.error(getErrorMessage(actionError, "Không thể cập nhật vai trò người dùng."));
    } finally {
      closeAuthModal();
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser?.userId) return;
    if (String(deletingUser.userId) === currentUserId) {
      toast.error(SELF_LOCKOUT_MESSAGE);
      setDeletingUser(null);
      return;
    }
    await deleteUser(deletingUser.userId);
    setDeletingUser(null);
    toast.success("Đã xóa người dùng.");
    loadUsers(items.length <= 1 && page > 0 ? page - 1 : page);
  };

  const columns = [
    {
      key: "username",
      label: "Người dùng",
      sortable: true,
      render: (user) => (
        <div className="adm2-user-cell">
          <span className="adm2-user-avatar">{getInitials(user.username)}</span>
          <div className="adm2-user-cell__body">
            <strong>{user.username}</strong>
            <span className="adm2-user-cell__sub">User #{user.userId}</span>
          </div>
        </div>
      ),
    },
    { key: "email", label: "Email", sortable: true },
    {
      key: "role",
      label: "Vai trò",
      sortable: true,
      sortValue: (user) => formatRole(user.role),
      render: (user) => (
        <span className={`adm2-badge ${user.role === "ADMINISTRATOR" ? "adm2-badge--dark" : "adm2-badge--gray"}`}>
          {formatRole(user.role)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      sortValue: (user) => formatStatus(user.status),
      render: (user) => (
        <span className={`adm2-badge adm2-badge--${STATUS_BADGE_TONE[user.status] || "gray"}`}>
          {formatStatus(user.status)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: 130,
      align: "right",
      render: (user) => {
        const isSelf = String(user.userId) === currentUserId;

        if (isSelf) {
          return <span className="adm2-note--muted">Tài khoản hiện tại</span>;
        }

        return (
          <RowActions
            variant="menu"
            items={[
              {
                label: "Đổi vai trò",
                icon: <Shield size={16} />,
                onClick: () => {
                  setSelectedUser(user);
                  setIsAuthModalOpen(true);
                },
              },
              {
                label: "Đặt lại mật khẩu",
                icon: <KeyRound size={16} />,
                onClick: () => setResetUser(user),
              },
              {
                label: user.status === "BANNED" ? "Mở khóa tài khoản" : "Khóa tài khoản",
                icon: user.status === "BANNED" ? <Unlock size={16} /> : <Lock size={16} />,
                onClick: () => {
                  setSelectedUser(user);
                  setIsConfirmModalOpen(true);
                },
              },
              {
                label: "Xóa",
                icon: <Trash2 size={16} />,
                danger: true,
                onClick: () => setDeletingUser(user),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className="admin-users-page">
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Người dùng"]}
        title="Quản lý người dùng"
        subtitle="Tìm kiếm, đổi vai trò và quản lý trạng thái tài khoản."
      />

      <div className="adm2-stat-row">
        {statTiles.map((tile) => (
          <div className="adm2-stat-tile" key={tile.key}>
            <span className={`adm2-stat-tile__icon adm2-stat-tile__icon--${tile.tone}`}>{tile.icon}</span>
            <div className="adm2-stat-tile__body">
              <span className="adm2-stat-tile__value">{tile.value}</span>
              <span className="adm2-stat-tile__label">{tile.label}</span>
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <ErrorState description={error} onRetry={() => loadUsers(page)} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={visibleUsers}
            getRowKey={(user) => user.userId}
            loading={loading}
            pageSize={PAGE_SIZE}
            searchPlaceholder="Tìm username/email trong trang này..."
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

          <p className="adm2-user-scope-note">
            Tìm kiếm và bộ lọc trạng thái áp dụng trong trang hiện tại ({PAGE_SIZE} người dùng/trang).
          </p>

          <div className="adm2-user-pager">
            <button
              type="button"
              className="adm2-user-pager__btn"
              disabled={loading || pageInfo.first}
              onClick={() => loadUsers(page - 1)}
            >
              <ChevronLeft size={16} />
              Trước
            </button>
            <span className="adm2-user-pager__page">
              Trang {page + 1}/{pageInfo.totalPages || 1}
            </span>
            <button
              type="button"
              className="adm2-user-pager__btn"
              disabled={loading || pageInfo.last}
              onClick={() => loadUsers(page + 1)}
            >
              Sau
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}

      <ConfirmActionModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        onConfirm={handleToggleUserLock}
        user={selectedUser}
        message={
          selectedUser?.status === "BANNED" ? (
            <>
              Mở khóa người dùng "<strong>{selectedUser?.username}</strong>"? Tài khoản sẽ chuyển
              về trạng thái Đã xác thực.
            </>
          ) : undefined
        }
      />

      <ResetPasswordModal
        isOpen={Boolean(resetUser)}
        onClose={() => setResetUser(null)}
        onSave={handleResetPassword}
        user={resetUser}
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
