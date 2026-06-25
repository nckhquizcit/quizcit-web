import { useState } from "react";
import FormModalLayout from "../ui/FormModalLayout";
import Modal from "../ui/Modal";
import { getErrorMessage } from "../../../../services/apiClient";

function EditChapterForm({ chapter, onClose, onSubmit }) {
  const [name, setName] = useState(chapter?.name || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    if (submitting || !name.trim()) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({ name: name.trim() });
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu chương. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModalLayout
      title="Sửa chương"
      subtitle={`Đang sửa: ${chapter.name}`}
      actions={
        <>
          <button className="cancel-btn" type="button" onClick={onClose}>
            Hủy
          </button>
          <button
            className="add-btn"
            type="button"
            disabled={submitting || !name.trim()}
            onClick={handleSubmit}
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      {submitError && <div className="modal-inline-error">{submitError}</div>}
      <input placeholder="Tên chương" value={name} onChange={(event) => setName(event.target.value)} />
    </FormModalLayout>
  );
}

export default function EditChapterModal({ open, onClose, chapter, onSubmit }) {
  if (!chapter) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <EditChapterForm key={chapter.chapterId || chapter.id} chapter={chapter} onClose={onClose} onSubmit={onSubmit} />
    </Modal>
  );
}
