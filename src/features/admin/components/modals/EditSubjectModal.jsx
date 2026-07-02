import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./modal.css";

export default function EditSubjectModal({ open, onClose, subject, onSubmit }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name || "");
      setCourseCode(subject.courseCode || "");
      setDescription(subject.description || "");
    }
  }, [subject]);

  if (!open || !subject) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await onSubmit({ name, courseCode, description });
      handleClose();
    } catch (error) {
      console.error("Failed to update subject:", error);
      alert("Không thể cập nhật môn học. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setCourseCode("");
    setDescription("");
    onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chỉnh sửa môn học</h2>
          <button className="close-btn" onClick={handleClose} type="button" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Tên môn học *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên môn học"
              required
            />
          </div>

          <div className="form-group">
            <label>Mã môn học *</label>
            <input
              type="text"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="Nhập mã môn học"
              required
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả về môn học"
              rows="4"
            />
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
