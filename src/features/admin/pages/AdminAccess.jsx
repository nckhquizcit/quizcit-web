import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable from "../components/ui/DataTable";
import RowActions from "../components/ui/RowActions";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { useToast } from "../../../components/ui/Toast/Toast";
import { getErrorMessage } from "../../../services/apiClient";
import {
  deletePermission,
  deleteRole,
  getPermissions,
  getRoles,
} from "../../../services/rbacService";
import "../Admin.css";
import "./AdminAccess.css";

const ACCESS_TYPES = {
  roles: {
    label: "Vai trò",
    singular: "vai trò",
    icon: <ShieldCheck size={18} />,
  },
  permissions: {
    label: "Quyền hạn",
    singular: "quyền hạn",
    icon: <KeyRound size={18} />,
  },
};

export default function AdminAccess() {
  const toast = useToast();
  const [activeType, setActiveType] = useState("roles");
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingItem, setDeletingItem] = useState(null);

  const loadAccess = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextRoles, nextPermissions] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(nextRoles);
      setPermissions(nextPermissions);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải dữ liệu phân quyền."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  const items = activeType === "roles" ? roles : permissions;
  const currentType = ACCESS_TYPES[activeType];

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Tên",
        sortable: true,
        render: (item) => (
          <div className="access-name-cell">
            <span className="access-name-cell__icon">{ACCESS_TYPES[activeType].icon}</span>
            <strong>{item.name}</strong>
          </div>
        ),
      },
      {
        key: "id",
        label: "Mã định danh",
        sortable: true,
        render: (item) => <code className="access-id">{item.id}</code>,
      },
      {
        key: "actions",
        label: "",
        width: 90,
        align: "right",
        render: (item) => (
          <RowActions
            items={[
              {
                label: "Xóa",
                icon: <Trash2 size={15} />,
                danger: true,
                onClick: () => setDeletingItem({ ...item, type: activeType }),
              },
            ]}
          />
        ),
      },
    ],
    [activeType],
  );

  const handleDelete = async (hard) => {
    if (!deletingItem?.id) return;
    if (deletingItem.type === "roles") {
      await deleteRole(deletingItem.id, hard);
      setRoles((current) => current.filter((item) => item.id !== deletingItem.id));
    } else {
      await deletePermission(deletingItem.id, hard);
      setPermissions((current) => current.filter((item) => item.id !== deletingItem.id));
    }
    toast.success(`Đã xóa ${ACCESS_TYPES[deletingItem.type].singular}.`);
    setDeletingItem(null);
  };

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Phân quyền"]}
        title="Vai trò và quyền hạn"
        subtitle="Kiểm tra và xóa các cấu hình phân quyền đang có trong hệ thống."
      />

      <div className="admin-access-tabs" role="tablist" aria-label="Loại phân quyền">
        {Object.entries(ACCESS_TYPES).map(([key, type]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeType === key}
            className={activeType === key ? "is-active" : ""}
            onClick={() => setActiveType(key)}
          >
            {type.icon}
            {type.label}
            <span>{key === "roles" ? roles.length : permissions.length}</span>
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState description={error} onRetry={loadAccess} />
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          getRowKey={(item) => item.id}
          loading={loading}
          searchPlaceholder={`Tìm ${currentType.singular}...`}
          searchKeys={["name", "id"]}
          toolbarSummary={
            !loading ? <span className="adm2-count-pill">{items.length} {currentType.label.toLowerCase()}</span> : null
          }
          emptyState={
            <EmptyState
              icon={currentType.icon}
              title={`Chưa có ${currentType.label.toLowerCase()}`}
              description={`Backend chưa trả về ${currentType.label.toLowerCase()} nào.`}
            />
          }
        />
      )}

      <ConfirmDeleteModal
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDelete}
        title={`Xóa ${deletingItem ? ACCESS_TYPES[deletingItem.type].singular : "phân quyền"}`}
        message="Thao tác có thể ảnh hưởng quyền truy cập của người dùng đang được gán cấu hình này."
        itemName={deletingItem?.name || ""}
      />
    </>
  );
}
