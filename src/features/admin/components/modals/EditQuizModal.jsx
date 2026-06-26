import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getErrorMessage } from "../../../../services/apiClient";
import { updateQuiz } from "../../services/quizService";

const getQuizId = (quiz) => String(quiz?.quizId ?? quiz?.id ?? "");

export default function EditQuizModal({ open, quiz, onClose, onUpdated }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && quiz) {
      setName(quiz.name || "");
      setDuration(quiz.durationMinutes || quiz.duration || 30);
      setError("");
    }
  }, [open, quiz]);

  const handleSubmit = async () => {
    if (isSubmitting || !quiz) return;
    if (!name.trim()) {
      setError("Vui lòng nhập tên đề thi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const updated = await updateQuiz(getQuizId(quiz), {
        name: name.trim(),
        duration: Number(duration),
        chapterId: quiz.chapterId,
      });
      onUpdated?.({ ...quiz, ...updated, name: name.trim(), duration: Number(duration) });
      onClose?.();
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Không thể cập nhật đề thi."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} containerClassName="quiz-modal">
      <FormModalLayout
        title="Cập nhật đề thi"
        subtitle="Chỉnh sửa tên và thời gian làm bài"
        infoBox="Không thể chỉnh sửa danh sách câu hỏi của đề thi đã tạo. Nếu cần đổi câu hỏi, hãy tạo đề thi mới."
        actions={
          <>
            <button className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button className="add-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </>
        }
      >
        {error && <div className="modal-inline-error">{error}</div>}

        <label className="quiz-field">
          <span>Tên đề thi</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <label className="quiz-field">
          <span>Thời gian (phút)</span>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </label>
      </FormModalLayout>
    </Modal>
  );
}
