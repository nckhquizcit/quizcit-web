import { useCallback, useEffect, useState } from "react";
import { Brain, FileSpreadsheet, Pencil, Plus, Trash2 } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable from "../components/ui/DataTable";
import RowActions from "../components/ui/RowActions";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import SkillFormModal from "../components/modals/SkillFormModal";
import ImportSkillsModal from "../components/modals/ImportSkillsModal";
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
  const [isImportOpen, setIsImportOpen] = useState(false);
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

  const handleDeleteSkill = async (hard) => {
    if (!deletingSkill) return;

    const skillId = getSkillId(deletingSkill);
    await deleteSkill(skillId, hard);
    setSkills((currentRows) => currentRows.filter((skill) => getSkillId(skill) !== skillId));
    setDeletingSkill(null);
    toast.success("Xóa kỹ năng thành công.");
  };

  const columns = [
    {
      key: "name",
      label: "Tên kỹ năng",
      sortable: true,
      render: (skill, index) => (
        <div className="bank-question-cell">
          <span className="bank-question-index">{String(index + 1).padStart(2, "0")}</span>
          <strong>{skill.name}</strong>
        </div>
      ),
    },
    {
      key: "description",
      label: "Mô tả",
      render: (skill) => skill.description?.trim() || "Chưa có mô tả",
    },
    {
      key: "actions",
      label: "",
      width: 150,
      align: "right",
      render: (skill) => (
        <RowActions
          labelled
          items={[
            {
              label: "Sửa",
              icon: <Pencil size={14} />,
              onClick: () => setEditingSkill(skill),
            },
            {
              label: "Xóa",
              icon: <Trash2 size={14} />,
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
        subtitle="Kỹ năng dùng để gắn câu hỏi và cập nhật theta."
        action={
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="add-btn"
              style={{
                background: "#ffffff",
                color: "#059669",
                border: "1px solid #a7f3d0",
              }}
              onClick={() => setIsImportOpen(true)}
            >
              <FileSpreadsheet size={18} />
              Nhập từ CSV
            </button>
            <button className="add-btn" onClick={() => setIsCreateOpen(true)}>
              <Plus size={18} />
              Thêm kỹ năng
            </button>
          </div>
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
          searchPlaceholder="Tìm tên hoặc mô tả kỹ năng..."
          searchKeys={["name", "description"]}
          toolbarSummary={<span className="adm2-count-pill">{skills.length} kỹ năng</span>}
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

      <ImportSkillsModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        existingSkills={skills}
        onImportSuccess={loadSkills}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingSkill)}
        onClose={() => setDeletingSkill(null)}
        title="Xóa kỹ năng"
        message="Bạn có chắc chắn muốn xóa kỹ năng này không? Kỹ năng đã xóa sẽ bị ẩn khỏi danh sách và không thể chọn trong các câu hỏi hay chương mới."
        itemName={deletingSkill?.name}
        confirmText="Xác nhận xóa"
        onConfirm={handleDeleteSkill}
      />
    </>
  );
}
