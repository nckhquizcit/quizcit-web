import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";

import { useEffect, useState } from "react";

export default function AddSubjectModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) return;

    setName("");
    setCourseCode("");
    setDescription("");
    setDisplayOrder("");
    setSubmitError("");
    setSubmitting(false);
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({ name, courseCode, description, displayOrder: displayOrder ? Number(displayOrder) : null });
      setName("");
      setCourseCode("");
      setDescription("");
      setDisplayOrder("");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu môn học. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <FormModalLayout
        title="Thêm môn học mới"
        subtitle="Nhập thông tin môn học để thêm vào hệ thống"
        actions={
          <>
            <button className="cancel-btn" onClick={handleClose}>
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
        <input type="number" min="1" placeholder="Thứ tự (để trống để xếp cuối)" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
      </FormModalLayout>
    </Modal>
  );
}
