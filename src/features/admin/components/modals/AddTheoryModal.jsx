import { useState } from "react";
import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";

export default function AddTheoryModal({ open, onClose, chapter, onSubmit }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    if (submitting || !content.trim()) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({ content: content.trim() });
      setContent("");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu lý thuyết. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!chapter) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <FormModalLayout
        title="Thêm lý thuyết"
        subtitle={`Chương: ${chapter.name}`}
        actions={
          <>
            <button className="cancel-btn" onClick={onClose}>Hủy</button>
            <button
              className="add-btn"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
            >
              {submitting ? "Đang lưu..." : "Thêm"}
            </button>
          </>
        }
      >
        {submitError && <div className="modal-inline-error">{submitError}</div>}
        <textarea
          placeholder="Nội dung lý thuyết"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />
      </FormModalLayout>
    </Modal>
  );
}
