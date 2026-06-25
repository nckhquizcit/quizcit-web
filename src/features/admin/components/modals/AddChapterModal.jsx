import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";

import { useState } from "react";

export default function AddChapterModal({ open, onClose, subject, onSubmit }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    if (submitting || !name.trim()) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({ name: name.trim() });
      setName("");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu chương. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!subject) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <FormModalLayout
        title="Thêm chương mới"
        subtitle={`Thêm chương vào "${subject.name}"`}
        infoBox={
          <>
            <div>
              <b>Môn:</b> {subject.name}
            </div>
            <div>
              <b>Mã:</b> {subject.code}
            </div>
          </>
        }
        actions={
          <>
            <button className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button className="add-btn" onClick={handleSubmit} disabled={submitting || !name.trim()}>
              {submitting ? "Đang lưu..." : "Thêm chương"}
            </button>
          </>
        }
      >
        {submitError && <div className="modal-inline-error">{submitError}</div>}
        <input placeholder="Tên chương" value={name} onChange={(e) => setName(e.target.value)} />
      </FormModalLayout>
    </Modal>
  );
}
