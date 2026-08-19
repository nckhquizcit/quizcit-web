import { useId, useState } from "react";
import FormModalLayout from "../ui/FormModalLayout";
import Modal from "../ui/Modal";
import { getErrorMessage } from "../../../../services/apiClient";
import TheoryEditor from "../../../content/components/TheoryEditor";
import { isTheoryContentEmpty } from "../../../content/components/theoryContentUtils";

function EditTheoryForm({ theory, onClose, onSubmit, titleId }) {
  const [content, setContent] = useState(theory?.content || "");
  const [contentFormat, setContentFormat] = useState(theory?.contentFormat || "plain");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    if (submitting || isTheoryContentEmpty(content, contentFormat)) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({ content, contentFormat });
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu lý thuyết. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModalLayout
      titleId={titleId}
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
            disabled={submitting || isTheoryContentEmpty(content, contentFormat)}
            onClick={handleSubmit}
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </button>
        </>
      }
      >
        {submitError && <div className="modal-inline-error">{submitError}</div>}
        <TheoryEditor
          value={content}
          contentFormat={contentFormat}
          disabled={submitting}
          onChange={({ content: nextContent, contentFormat: nextFormat }) => {
            setContent(nextContent);
            setContentFormat(nextFormat);
          }}
        />
    </FormModalLayout>
  );
}

export default function EditTheoryModal({ open, onClose, theory, onSubmit }) {
  const titleId = useId();
  if (!theory) return null;

  return (
    <Modal open={open} onClose={onClose} containerClassName="theory-editor-modal" labelledById={titleId}>
      <EditTheoryForm
        key={`${theory.theoryId || theory.id}-${open ? "open" : "closed"}`}
        theory={theory}
        onClose={onClose}
        onSubmit={onSubmit}
        titleId={titleId}
      />
    </Modal>
  );
}
