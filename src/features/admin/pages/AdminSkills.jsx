import { useEffect, useMemo, useState } from "react";
import { Brain, LoaderCircle, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import SkillFormModal from "../components/modals/SkillFormModal";
import { createSkill, deleteSkill, getSkills, updateSkill } from "../services/skillService";

const getSkillId = (skill) => skill?.skillId ?? skill?.id ?? "";

export default function AdminSkills() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [deletingSkill, setDeletingSkill] = useState(null);

  const loadSkills = async ({ preserveMessage = false } = {}) => {
    setIsLoading(true);
    setError("");

    if (!preserveMessage) {
      setSuccessMessage("");
    }

    try {
      const rows = (await getSkills()) || [];
      setSkills(rows);
    } catch (loadError) {
      setError(loadError?.message || "Không thể tải danh sách kỹ năng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const filteredSkills = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return skills;

    return skills.filter((skill) => {
      const name = String(skill.name || "").toLowerCase();
      const description = String(skill.description || "").toLowerCase();
      return name.includes(keyword) || description.includes(keyword);
    });
  }, [search, skills]);

  const handleCreateSkill = async (payload) => {
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const createdSkill = await createSkill(payload);
      setSkills((currentRows) => [createdSkill, ...currentRows]);
      setIsCreateOpen(false);
      setSuccessMessage("Thêm kỹ năng thành công.");
    } catch (createError) {
      setError(createError?.message || "Không thể tạo kỹ năng.");
      throw createError;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSkill = async (payload) => {
    if (!editingSkill) return;

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const updatedSkill = await updateSkill(getSkillId(editingSkill), payload);
      setSkills((currentRows) =>
        currentRows.map((skill) =>
          getSkillId(skill) === getSkillId(updatedSkill) ? updatedSkill : skill,
        ),
      );
      setEditingSkill(null);
      setSuccessMessage("Cập nhật kỹ năng thành công.");
    } catch (updateError) {
      setError(updateError?.message || "Không thể cập nhật kỹ năng.");
      throw updateError;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSkill = async () => {
    if (!deletingSkill) return;

    try {
      const skillId = getSkillId(deletingSkill);
      await deleteSkill(skillId);
      setSkills((currentRows) => currentRows.filter((skill) => getSkillId(skill) !== skillId));
      setDeletingSkill(null);
      setSuccessMessage("Xóa kỹ năng thành công.");
    } catch (deleteError) {
      setError(deleteError?.message || "Không thể xóa kỹ năng.");
      throw deleteError;
    }
  };

  if (isLoading) {
    return (
      <div className="admin-loading-state">
        <LoaderCircle size={20} className="spin" /> Đang tải dữ liệu kỹ năng...
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Kỹ năng"]}
        title="Quản lý kỹ năng"
        subtitle="Thêm, chỉnh sửa và xóa các skill dùng trong hệ thống tiến độ học tập"
        action={
          <button className="add-btn" onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} />
            Thêm kỹ năng
          </button>
        }
      />

      <div className="admin-section-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: "1 1 320px" }}>
            <SearchBar placeholder="Tìm theo tên hoặc mô tả kỹ năng..." onChange={setSearch} />
          </div>
          <button className="cancel-btn" onClick={() => loadSkills({ preserveMessage: true })}>
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>

        {(error || successMessage) && (
          <div style={{ marginTop: 16, color: error ? "#dc2626" : "#16a34a" }}>
            {error || successMessage}
          </div>
        )}

        <div style={{ marginTop: 16, color: "#64748b" }}>
          Tổng số kỹ năng: {skills.length} • Hiển thị: {filteredSkills.length}
        </div>
      </div>

      <div className="skill-grid">
        {filteredSkills.map((skill) => (
          <div key={getSkillId(skill)} className="skill-card">
            <div className="skill-card-actions">
              <button className="icon-btn" onClick={() => setEditingSkill(skill)}>
                <Pencil size={16} />
              </button>
              <button className="icon-btn danger" onClick={() => setDeletingSkill(skill)}>
                <Trash2 size={16} />
              </button>
            </div>

            <div className="skill-card-icon">
              <Brain size={22} />
            </div>

            <div className="skill-card-title">{skill.name}</div>
            <div className="skill-card-meta">ID: {getSkillId(skill) || "Chưa có mã"}</div>

            <div className="skill-card-description">
              {skill.description?.trim() || "Chưa có mô tả cho kỹ năng này."}
            </div>

          </div>
        ))}
      </div>

      {!filteredSkills.length && (
        <div className="admin-section-card" style={{ color: "#64748b", textAlign: "center" }}>
          Chưa tìm thấy kỹ năng phù hợp.
        </div>
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