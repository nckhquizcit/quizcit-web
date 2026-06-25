import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";

import { useState } from "react";

export default function AddSubjectModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({ name, courseCode, description });
      setName("");
      setCourseCode("");
      setDescription("");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu môn học. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <FormModalLayout
        title="Thêm môn học mới"
        subtitle="Nhập thông tin môn học để thêm vào hệ thống"
        actions={
          <>
            <button className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button
              className="add-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Đang lưu..." : "Thêm môn học"}
            </button>
          </>
        }
      >
        {submitError && <div className="modal-inline-error">{submitError}</div>}
        <input placeholder="Tên môn học" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Mã môn học"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
        />
        <textarea
          placeholder="Mô tả môn học"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormModalLayout>
    </Modal>
  );
}
