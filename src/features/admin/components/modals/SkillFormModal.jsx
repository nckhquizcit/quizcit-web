import { useEffect, useState } from "react";

import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";

const INITIAL_FORM = {
  name: "",
  description: "",
};

export default function SkillFormModal({
  open,
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_FORM);
      setError("");
      return;
    }

    setFormData({
      name: initialData?.name || "",
      description: initialData?.description || "",
    });
    setError("");
  }, [initialData, open]);

  const handleChange = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Tên kỹ năng không được để trống.");
      return;
    }

    setError("");
    await onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
    });
  };

  const isEdit = mode === "edit";

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormModalLayout
          title={isEdit ? "Cập nhật kỹ năng" : "Thêm kỹ năng"}
          subtitle={
            isEdit
              ? "Chỉnh sửa tên và mô tả kỹ năng để đồng bộ với hệ thống tiến độ."
              : "Tạo kỹ năng mới để gán vào chương học và câu hỏi."
          }
          infoBox={
            error ? <span style={{ color: "#dc2626" }}>{error}</span> : null
          }
          actions={(
            <>
              <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </button>
              <button type="submit" className="add-btn" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo kỹ năng"}
              </button>
            </>
          )}
        >
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
        </FormModalLayout>
      </form>
    </Modal>
  );
}