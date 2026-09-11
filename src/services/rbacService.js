import { request } from "./apiClient";
import { RBAC_ENDPOINTS, getDeleteParams } from "./apiContracts";

const mapAccessItem = (item = {}, idKey) => ({
  ...item,
  id: item[idKey] ?? item.id,
  name: item.name || "Chưa đặt tên",
  deletedAt: item.deletedAt ?? item.deleted_at ?? null,
});

export async function getAccessMatrix() {
  const data = await request({ method: "GET", url: "/api/v1/admin/access/matrix" });
  return {
    roles: (data?.roles || []).map((role) => mapAccessItem(role, "roleId")),
    permissions: (data?.permissions || []).map((permission) => mapAccessItem(permission, "permissionId")),
  };
}

export async function getRoles() {
  const roles = await request({ method: "GET", url: RBAC_ENDPOINTS.roles });
  return (roles || []).map((role) => mapAccessItem(role, "roleId"));
}

export function deleteRole(roleId) {
  return request({
    method: "DELETE",
    url: `${RBAC_ENDPOINTS.roles}/${roleId}`,
    params: getDeleteParams(),
  });
}

export async function getPermissions() {
  const permissions = await request({ method: "GET", url: RBAC_ENDPOINTS.permissions });
  return (permissions || []).map((permission) => mapAccessItem(permission, "permissionId"));
}

export function deletePermission(permissionId) {
  return request({
    method: "DELETE",
    url: `${RBAC_ENDPOINTS.permissions}/${permissionId}`,
    params: getDeleteParams(),
  });
}
