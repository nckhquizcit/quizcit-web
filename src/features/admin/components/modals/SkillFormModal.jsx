import { useId, useState } from "react";
import FormModalLayout from "../ui/FormModalLayout";
import Modal from "../ui/Modal";

const INITIAL_FORM = {
  name: "",
  description: "",
};

function SkillFormContent({ mode, initialData, onClose, onSubmit, isSubmitting, titleId, existingSkills = [] }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || INITIAL_FORM.name,
    description: initialData?.description || INITIAL_FORM.description,
  });
  const [error, setError] = useState("");
  const isEdit = mode === "edit";

  const handleChange = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError("Tên kỹ năng không được để trống.");
      return;
    }

    const currentSkillId = initialData?.skillId || initialData?.id;
    const isDuplicate = existingSkills.some((skill) => {
      const skillId = skill?.skillId || skill?.id;
      if (isEdit && skillId && currentSkillId && String(skillId) === String(currentSkillId)) {
        return false;
      }
      return (skill?.name || skill?.skillName || "").trim().toLowerCase() === trimmedName.toLowerCase();
    });

    if (isDuplicate) {
      setError("Tên kỹ năng đã tồn tại (không phân biệt chữ hoa/thường).");
      return;
    }

    setError("");
    await onSubmit({
      name: trimmedName,
      description: formData.description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormModalLayout
        titleId={titleId}
        title={isEdit ? "Chỉnh sửa kỹ năng" : "Thêm kỹ năng"}
        subtitle="Dữ liệu dùng cho adaptive và báo cáo theta."
        actions={
          <>
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button type="submit" className="add-btn" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu kỹ năng"}
            </button>
          </>
        }
      >
        {error && <div className="modal-inline-error">{error}</div>}

        <label className="quiz-field">
          <span>Tên kỹ năng</span>
          <input
            value={formData.name}
            onChange={handleChange("name")}
            maxLength={200}
            placeholder="Ví dụ: Giải phương trình bậc hai"
          />
        </label>

        <label className="quiz-field">
          <span>Mô tả</span>
          <textarea
            value={formData.description}
            onChange={handleChange("description")}
            maxLength={2000}
            rows={5}
            placeholder="Mô tả ngắn về phạm vi và mục tiêu của kỹ năng"
          />
        </label>

        <p className="adm2-note adm2-note--muted">Tên tối đa 200 · Mô tả tối đa 2000 ký tự</p>

        {isEdit && <div className="adm2-note">Đổi tên ảnh hưởng nhãn báo cáo, không mất theta.</div>}
      </FormModalLayout>
    </form>
  );
}

export default function SkillFormModal({
  open,
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  isSubmitting = false,
  existingSkills = [],
}) {
  const formKey = `${mode}-${initialData?.skillId || initialData?.id || "new"}-${open ? "open" : "closed"}`;
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledById={titleId}>
      <SkillFormContent
        key={formKey}
        mode={mode}
        initialData={initialData}
        onClose={onClose}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        titleId={titleId}
        existingSkills={existingSkills}
      />
    </Modal>
  );
}
