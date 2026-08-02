import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";

import { useEffect, useState } from "react";
import { getSkills } from "../../services/skillService";
import ChapterSkillsField from "../ChapterSkillsField";

export default function AddChapterModal({ open, onClose, subject, onSubmit }) {
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

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
    <Modal open={open} onClose={handleClose}>
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
            <button className="cancel-btn" onClick={handleClose}>
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
        <input type="number" min="1" placeholder="Thứ tự (để trống để xếp cuối)" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
        <ChapterSkillsField skills={skills} value={selectedSkills} onChange={setSelectedSkills} />
      </FormModalLayout>
    </Modal>
  );
}
