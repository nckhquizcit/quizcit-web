import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Lock,
  Shield,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import { changePassword, changeUserRole, deleteUser, getUsers, updateUserStatus } from "../../../services/userService";
import { getErrorMessage, getStoredUser } from "../../../services/apiClient";
import { resolveImageUrl } from "../../../services/mappers";
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

import {
  formatRole,
  formatStatus,
  getInitials,
  getBackendSortParam,
  matchesSearch,
  isBackendUnfiltered,
  sortUsersList,
  STATUS_BADGE_TONE,
} from "../utils/adminUsersLogic";

const SELF_LOCKOUT_MESSAGE = "Bạn không thể khóa/xóa/thay đổi vai trò tài khoản đang đăng nhập.";
const PAGE_SIZE = 20;
const EMPTY_PAGE_INFO = { totalElements: 0, totalPages: 0, first: true, last: true };

export default function AdminUsers() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("DEFAULT");

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

  // Debounce search query 300ms de tranh spam API khi dang go
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUsers = useCallback(async (targetPage = 0) => {
    try {
      setLoading(true);
      setError("");

      const backendSort = getBackendSortParam(sortBy);
      const result = await getUsers({
        page: targetPage,
        size: PAGE_SIZE,
        sort: backendSort,
        search: debouncedQuery,
        role: filterRole,
        status: filterStatus,
      });

      const fetchedItems = result?.items || [];
      const needsClientFallback = isBackendUnfiltered(fetchedItems, debouncedQuery, filterRole, filterStatus);

      if (needsClientFallback) {
        // Resilient Fallback: Backend cu chua restart, tu dong lay danh sach day du de filter/sort
        const allResult = await getUsers({ page: 0, size: 100, sort: backendSort });
        const allItems = allResult?.items || [];
        const filteredAll = allItems.filter((u) => {
          if (!matchesSearch(u, debouncedQuery)) return false;
          if (filterRole !== "ALL" && u.role !== filterRole) return false;
          if (filterStatus !== "ALL" && u.status !== filterStatus) return false;
          return true;
        });

        const sortedAll = sortUsersList(filteredAll, sortBy, currentUserId);
        const startIndex = targetPage * PAGE_SIZE;
        const pagedSlice = sortedAll.slice(startIndex, startIndex + PAGE_SIZE);

        setItems(pagedSlice);
        setPageInfo({
          totalElements: sortedAll.length,
          totalPages: Math.max(1, Math.ceil(sortedAll.length / PAGE_SIZE)),
          first: targetPage === 0,
          last: (targetPage + 1) * PAGE_SIZE >= sortedAll.length,
        });
        setPage(targetPage);
      } else {
        // Backend moi da loc server-side, luon uu tien dua nguoi dang xem len dau o trang 1
        let processedItems = fetchedItems;
        if (targetPage === 0 && currentUserId) {
          const selfIdx = processedItems.findIndex((u) => String(u.userId) === currentUserId);
          if (selfIdx > 0) {
            const copy = [...processedItems];
            const selfUser = copy.splice(selfIdx, 1)[0];
            copy.unshift(selfUser);
            processedItems = copy;
          }
        }
        setItems(processedItems);
        setPageInfo({
          totalElements: result?.totalElements ?? 0,
          totalPages: result?.totalPages ?? 0,
          first: result?.first ?? true,
          last: result?.last ?? true,
        });
        setPage(result?.page ?? targetPage);
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách người dùng."));
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filterRole, filterStatus, sortBy, currentUserId]);

  useEffect(() => {
    loadUsers(0);
  }, [loadUsers]);

  const pageStats = useMemo(
    () => ({
      verified: items.filter((user) => user.status === "VERIFIED").length,
      unverified: items.filter((user) => user.status === "UNVERIFIED").length,
      banned: items.filter((user) => user.status === "BANNED").length,
    }),
    [items],
  );

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
      sortValue: (user) => (user.displayName || user.username || "").toLowerCase(),
      render: (user) => {
        const isSelf = String(user.userId) === currentUserId;
        return (
          <div className="adm2-user-cell">
            <span className="adm2-user-avatar">
              {user.avatarUrl ? (
                <img src={resolveImageUrl(user.avatarUrl)} alt="" />
              ) : (
                getInitials(user.displayName || user.username)
              )}
            </span>
            <div className="adm2-user-cell__body">
              <div className="adm2-user-name-wrapper">
                <strong>{user.displayName || user.username}</strong>
                {isSelf && <span className="adm2-badge--you">Bạn</span>}
              </div>
              <span className="adm2-user-cell__sub">{user.username}</span>
            </div>
          </div>
        );
      },
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
        const resetPasswordAction = {
          label: "Đặt lại mật khẩu",
          icon: <KeyRound size={16} />,
          onClick: () => setResetUser(user),
        };

        // BE chi chan tu khoa/xoa/doi vai tro chinh minh, van cho tu dat lai mat khau.
        if (isSelf) {
          return <RowActions variant="menu" items={[resetPasswordAction]} />;
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
              resetPasswordAction,
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
        <div className="adm2-stat-tile">
          <span className="adm2-stat-tile__icon adm2-stat-tile__icon--gray">
            <Users size={18} />
          </span>
          <div className="adm2-stat-tile__body">
            <span className="adm2-stat-tile__value">{pageInfo.totalElements}</span>
            <span className="adm2-stat-tile__label">Tổng tài khoản</span>
          </div>
        </div>
      </div>
      {!loading && !error && (
        <p className="adm2-user-scope-note">
          Trong trang này: {pageStats.verified} đã xác thực, {pageStats.unverified} chưa xác thực, {pageStats.banned} đã khóa.
        </p>
      )}

      {error ? (
        <ErrorState description={error} onRetry={() => loadUsers(page)} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={items}
            getRowKey={(user) => user.userId}
            loading={loading}
            pageSize={PAGE_SIZE}
            paginationMode="server"
            page={page}
            totalElements={pageInfo.totalElements}
            onPageChange={(nextPage) => loadUsers(nextPage)}
            searchable
            searchValue={searchQuery}
            onSearchChange={(newQuery) => {
              setSearchQuery(newQuery);
              setPage(0);
            }}
            serverSearch
            searchPlaceholder="Tìm theo tên, username, email..."
            searchAriaLabel="Tìm kiếm người dùng theo tên, username hoặc email"
            emptyState={
              <EmptyState
                icon={<Users size={28} />}
                title="Không có người dùng"
                description="Không tìm thấy người dùng phù hợp với bộ lọc hiện tại."
              />
            }
            toolbarExtra={
              <div className="admin-users-filters">
                <select
                  className="filter-select"
                  value={filterRole}
                  onChange={(event) => {
                    setFilterRole(event.target.value);
                    setPage(0);
                  }}
                  aria-label="Lọc theo vai trò"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="ADMINISTRATOR">Quản trị viên</option>
                  <option value="USER">Người dùng</option>
                </select>

                <select
                  className="filter-select"
                  value={filterStatus}
                  onChange={(event) => {
                    setFilterStatus(event.target.value);
                    setPage(0);
                  }}
                  aria-label="Lọc theo trạng thái"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="VERIFIED">Đã xác thực</option>
                  <option value="UNVERIFIED">Chưa xác thực</option>
                  <option value="BANNED">Đã khóa</option>
                </select>

                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setPage(0);
                  }}
                  aria-label="Sắp xếp danh sách"
                >
                  <option value="DEFAULT">Sắp xếp mặc định</option>
                  <option value="ROLE_ADMIN_FIRST">Vai trò: Quản trị viên trước</option>
                  <option value="ROLE_USER_FIRST">Vai trò: Người dùng trước</option>
                  <option value="NAME_ASC">Tên hiển thị: A → Z</option>
                  <option value="NAME_DESC">Tên hiển thị: Z → A</option>
                  <option value="NEWEST">Mới nhất</option>
                  <option value="OLDEST">Cũ nhất</option>
                </select>
              </div>
            }
          />

          <p className="adm2-user-scope-note">
            Tìm kiếm và bộ lọc áp dụng trên toàn bộ danh sách ({pageInfo.totalElements} tài khoản).
          </p>
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
              Mở khóa người dùng "<strong>{selectedUser?.displayName || selectedUser?.username}</strong>"? Tài khoản sẽ chuyển
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
        itemName={deletingUser?.displayName || deletingUser?.username || ""}
      />
    </div>
  );
}
