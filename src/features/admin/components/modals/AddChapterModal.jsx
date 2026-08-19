import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";

import { useEffect, useId, useState } from "react";
import { getSkills } from "../../services/skillService";
import ChapterSkillsField from "../ChapterSkillsField";

export default function AddChapterModal({ open, onClose, subject, onSubmit }) {
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const titleId = useId();

  useEffect(() => {
    if (open) getSkills().then(setSkills).catch(() => setSkills([]));
  }, [open]);

  useEffect(() => {
    if (open) return;

    setName("");
    setDisplayOrder("");
    setSubmitError("");
    setSubmitting(false);
    setSelectedSkills([]);
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (submitting || !name.trim()) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({ name: name.trim(), displayOrder: displayOrder ? Number(displayOrder) : null, skills: selectedSkills });
      setName("");
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu chương. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!subject) return null;

  return (
    <Modal open={open} onClose={handleClose} labelledById={titleId}>
      <FormModalLayout
        titleId={titleId}
        title="Thêm chương mới"
        subtitle={`Thêm chương vào "${subject.name}"`}
        infoBox={
          <>
            <div>
              <b>Môn:</b> {subject.name}
            </div>
            <div>
              <b>Mã:</b> {subject.courseCode}
            </div>
          </>
        }
        actions={
          <>
            <button className="cancel-btn" onClick={handleClose} disabled={submitting}>
              Hủy
            </button>
            <button className="add-btn" onClick={handleSubmit} disabled={submitting || !name.trim()}>
              {submitting ? "Đang lưu..." : "Thêm chương"}
            </button>
          </>
        }
      >
        {submitError && <div className="modal-inline-error">{submitError}</div>}
        <label className="quiz-field" htmlFor="add-chapter-name">
          <span>Tên chương</span>
          <input
            id="add-chapter-name"
            placeholder="Tên chương"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
          />
        </label>
        <label className="quiz-field" htmlFor="add-chapter-display-order">
          <span>Thứ tự hiển thị</span>
          <input
            id="add-chapter-display-order"
            type="number"
            min="1"
            placeholder="Thứ tự (để trống để xếp cuối)"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
          />
        </label>
        <ChapterSkillsField skills={skills} value={selectedSkills} onChange={setSelectedSkills} />
      </FormModalLayout>
    </Modal>
  );
}
