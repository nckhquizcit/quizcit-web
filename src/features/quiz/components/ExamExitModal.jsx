import { AlertTriangle } from "lucide-react";
import { Button, Modal } from "../../../components/ui";
import "./ExamExitModal.css";

export default function ExamExitModal({ open, onStay, onLeave }) {
  return (
    <Modal
      open={open}
      onClose={onStay}
      title="Cảnh báo rời bài làm"
      size="md"
      footer={
        <div className="exam-exit-footer">
          <Button variant="ghost" onClick={onLeave}>
            Rời khỏi bài làm
          </Button>
          <Button variant="primary" onClick={onStay}>
            Ở lại tiếp tục làm bài
          </Button>
        </div>
      }
    >
      <div className="exam-exit-content">
        <div className="exam-exit-icon" aria-hidden="true">
          <AlertTriangle size={36} />
        </div>
        <div className="exam-exit-body">
          <p className="exam-exit-message">
            Đồng hồ vẫn chạy khi bạn rời bài. Hệ thống tự nộp khi hết giờ.
          </p>
          <p className="exam-exit-subtext">
            Đáp án được lưu vào tài khoản. Bạn có thể mở lại bài từ trang môn học để tiếp tục nếu vẫn còn thời gian.
          </p>
        </div>
      </div>
    </Modal>
  );
}
