import { useState } from "react";
import FormModalLayout from "../ui/FormModalLayout";
import Modal from "../ui/Modal";
import { getErrorMessage } from "../../../../services/apiClient";

function EditTheoryForm({ theory, onClose, onSubmit }) {
  const [content, setContent] = useState(theory?.content || "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    if (submitting || !content.trim()) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({ content: content.trim() });
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu lý thuyết. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModalLayout
      title="Sửa lý thuyết"
      subtitle="Chỉnh sửa nội dung lý thuyết"
      actions={
        <>
          <button className="cancel-btn" type="button" onClick={onClose}>
            Hủy
          </button>
          <button
            className="add-btn"
            type="button"
            disabled={submitting || !content.trim()}
            onClick={handleSubmit}
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
    >
      {submitError && <div className="modal-inline-error">{submitError}</div>}
      <textarea
        placeholder="Nội dung lý thuyết"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={6}
        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #cbd5e1" }}
      />
    </FormModalLayout>
  );
}

export default function EditTheoryModal({ open, onClose, theory, onSubmit }) {
  if (!theory) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <EditTheoryForm key={theory.theoryId || theory.id} theory={theory} onClose={onClose} onSubmit={onSubmit} />
    </Modal>
  );
}
