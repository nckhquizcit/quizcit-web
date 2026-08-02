import { useCallback, useEffect, useState } from "react";
import { Brain, Pencil, Plus, Trash2 } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable from "../components/ui/DataTable";
import RowActions from "../components/ui/RowActions";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import SkillFormModal from "../components/modals/SkillFormModal";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import { useToast } from "../../../components/ui/Toast/Toast";
import { getErrorMessage } from "../../../services/apiClient";
import { createSkill, deleteSkill, getSkills, updateSkill } from "../services/skillService";

const getSkillId = (skill) => skill?.skillId ?? skill?.id ?? "";

export default function AdminSkills() {
  const toast = useToast();
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [deletingSkill, setDeletingSkill] = useState(null);

  const loadSkills = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setSkills((await getSkills()) || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách kỹ năng."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleCreateSkill = async (payload) => {
    setIsSubmitting(true);

    try {
      const createdSkill = await createSkill(payload);
      setSkills((currentRows) => [createdSkill, ...currentRows]);
      setIsCreateOpen(false);
      toast.success("Thêm kỹ năng thành công.");
    } catch (createError) {
      toast.error(getErrorMessage(createError, "Không thể tạo kỹ năng."));
      throw createError;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSkill = async (payload) => {
    if (!editingSkill) return;

    setIsSubmitting(true);

    try {
      const updatedSkill = await updateSkill(getSkillId(editingSkill), payload);
      setSkills((currentRows) =>
        currentRows.map((skill) =>
          getSkillId(skill) === getSkillId(updatedSkill) ? updatedSkill : skill,
        ),
      );
      setEditingSkill(null);
      toast.success("Cập nhật kỹ năng thành công.");
    } catch (updateError) {
      toast.error(getErrorMessage(updateError, "Không thể cập nhật kỹ năng."));
      throw updateError;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!deletingSkill) return;

    const skillId = getSkillId(deletingSkill);
    await deleteSkill(skillId);
    setSkills((currentRows) => currentRows.filter((skill) => getSkillId(skill) !== skillId));
    setDeletingSkill(null);
    toast.success("Xóa kỹ năng thành công.");
  };

  const columns = [
    {
      key: "name",
      label: "Tên kỹ năng",
      sortable: true,
      render: (skill) => <strong>{skill.name}</strong>,
    },
    {
      key: "description",
      label: "Mô tả",
      render: (skill) => skill.description?.trim() || "Chưa có mô tả",
    },
    {
      key: "actions",
      label: "",
      width: 60,
      align: "right",
      render: (skill) => (
        <RowActions
          items={[
            {
              label: "Sửa",
              icon: <Pencil size={16} />,
              onClick: () => setEditingSkill(skill),
            },
            {
              label: "Xóa",
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => setDeletingSkill(skill),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Quản lý kỹ năng"
        subtitle="Thêm, chỉnh sửa và xóa các skill dùng trong hệ thống tiến độ học tập"
        icon={<Brain size={22} />}
        action={
          <button className="add-btn" onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} />
            Thêm kỹ năng
          </button>
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={loadSkills} />
      ) : (
        <DataTable
          columns={columns}
          rows={skills}
          getRowKey={getSkillId}
          loading={isLoading}
          searchPlaceholder="Tìm theo tên hoặc mô tả kỹ năng..."
          searchKeys={["name", "description"]}
          emptyState={
            <EmptyState
              icon={<Brain size={28} />}
              title="Chưa có kỹ năng"
              description="Chưa tìm thấy kỹ năng phù hợp. Thêm kỹ năng mới để bắt đầu."
            />
          }
        />
      )}

      <SkillFormModal
        open={isCreateOpen}
        mode="create"
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSkill}
        isSubmitting={isSubmitting}
      />

      <SkillFormModal
        open={Boolean(editingSkill)}
        mode="edit"
        initialData={editingSkill}
        onClose={() => setEditingSkill(null)}
        onSubmit={handleUpdateSkill}
        isSubmitting={isSubmitting}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingSkill)}
        onClose={() => setDeletingSkill(null)}
        title="Xóa kỹ năng"
        message={`Bạn có muốn xóa kỹ năng "${deletingSkill?.name}" không?`}
        itemName={deletingSkill?.name}
        onConfirm={handleDeleteSkill}
      />
    </>
  );
}
