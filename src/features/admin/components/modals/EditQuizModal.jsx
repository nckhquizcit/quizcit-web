import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./modal.css";

export default function EditQuizModal({ open, onClose, quiz, onSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [passingScore, setPassingScore] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (quiz) {
      setTitle(quiz.title || "");
      setDescription(quiz.description || "");
      setTimeLimit(quiz.timeLimit || 60);
      setPassingScore(quiz.passingScore || 50);
    }
  }, [quiz]);

  if (!open || !quiz) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSubmit({ title, description, timeLimit, passingScore });
      handleClose();
    } catch (error) {
      console.error("Failed to update quiz:", error);
      alert("Không thể cập nhật đề thi. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTimeLimit(60);
    setPassingScore(50);
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chỉnh sửa đề thi</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Tên đề thi *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên đề thi"
              required
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về đề thi"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Thời gian làm bài (phút)</label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                min="1"
                max="300"
              />
            </div>

            <div className="form-group">
              <label>Điểm đạt (%)</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value))}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}