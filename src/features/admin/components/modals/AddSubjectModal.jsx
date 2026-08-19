import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";
import SubjectImageField from "../../../../components/ui/SubjectImageField/SubjectImageField";

import { useEffect, useState } from "react";

export default function AddSubjectModal({ open, onClose, onSubmit, nextDisplayOrder = 1 }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const displayOrder = nextDisplayOrder;
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) return;

    setName("");
    setCourseCode("");
    setDescription("");
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
        displayOrder,
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
        <div className="quiz-field add-subject-order-note">
          <span>Thứ tự hiển thị</span>
          <p>Môn mới sẽ tự xếp ở vị trí {nextDisplayOrder}. Kéo thả để sắp xếp lại sau khi thêm.</p>
        </div>
      </FormModalLayout>
    </Modal>
  );
}
