import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";
import SubjectImageField from "../../../../components/ui/SubjectImageField/SubjectImageField";

import { useEffect, useState } from "react";

export default function AddSubjectModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) return;

    setName("");
    setCourseCode("");
    setDescription("");
    setDisplayOrder("");
    setImageUrl("");
    setSubmitError("");
    setSubmitting(false);
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    if (submitting || !name.trim() || !courseCode.trim()) return;

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.({
        name,
        courseCode,
        description,
        displayOrder: displayOrder ? Number(displayOrder) : null,
        imageUrl: imageUrl || null,
      });
      setName("");
      setCourseCode("");
      setDescription("");
      setDisplayOrder("");
      setImageUrl("");
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
            <button className="cancel-btn" onClick={handleClose} disabled={submitting}>
              Hủy
            </button>
            <button
              className="add-btn"
              onClick={handleSubmit}
              disabled={submitting || !name.trim() || !courseCode.trim()}
            >
              {submitting ? "Đang lưu..." : "Thêm môn học"}
            </button>
          </>
        }
      >
        {submitError && <div className="modal-inline-error">{submitError}</div>}
        <SubjectImageField
          value={imageUrl}
          onChange={setImageUrl}
          disabled={submitting}
        />
        <label className="quiz-field" htmlFor="add-subject-name">
          <span>Tên môn học</span>
          <input
            id="add-subject-name"
            placeholder="Tên môn học"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
          />
        </label>
        <label className="quiz-field" htmlFor="add-subject-code">
          <span>Mã môn học</span>
          <input
            id="add-subject-code"
            placeholder="Mã môn học"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            maxLength={20}
          />
        </label>
        <label className="quiz-field" htmlFor="add-subject-description">
          <span>Mô tả</span>
          <textarea
            id="add-subject-description"
            placeholder="Mô tả môn học"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="quiz-field" htmlFor="add-subject-display-order">
          <span>Thứ tự hiển thị</span>
          <input
            id="add-subject-display-order"
            type="number"
            min="1"
            placeholder="Thứ tự (để trống để xếp cuối)"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
          />
        </label>
      </FormModalLayout>
    </Modal>
  );
}
