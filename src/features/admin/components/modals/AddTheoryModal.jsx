import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";
import TheoryEditor from "../../../content/components/TheoryEditor";
import {
  isTheoryContentEmpty,
  THEORY_FORMAT_BLOCKNOTE,
} from "../../../content/components/theoryContentUtils";

export default function AddTheoryModal({ open, onClose, chapter, onSubmit }) {
  const [content, setContent] = useState("");
  const [contentFormat, setContentFormat] = useState(THEORY_FORMAT_BLOCKNOTE);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) return;

    setContent("");
    setContentFormat(THEORY_FORMAT_BLOCKNOTE);
    setSubmitError("");
    setSubmitting(false);
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (submitting || isTheoryContentEmpty(content, contentFormat)) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({ content, contentFormat });
      setContent("");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu lý thuyết. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!chapter) return null;

  return (
    <Modal open={open} onClose={handleClose} containerClassName="theory-editor-modal">
      <FormModalLayout
        title="Thêm lý thuyết"
        subtitle={`Chương: ${chapter.name}`}
        actions={
          <>
            <button className="cancel-btn" onClick={handleClose} disabled={submitting}>Hủy</button>
            <button
              className="add-btn"
              onClick={handleSubmit}
              disabled={submitting || isTheoryContentEmpty(content, contentFormat)}
            >
              {submitting ? "Đang lưu..." : "Thêm"}
            </button>
          </>
        }
      >
        {submitError && <div className="modal-inline-error">{submitError}</div>}
        <TheoryEditor
          key={open ? "open" : "closed"}
          value={content}
          contentFormat={contentFormat}
          disabled={submitting}
          onChange={({ content: nextContent, contentFormat: nextFormat }) => {
            setContent(nextContent);
            setContentFormat(nextFormat);
          }}
        />
      </FormModalLayout>
    </Modal>
  );
}
