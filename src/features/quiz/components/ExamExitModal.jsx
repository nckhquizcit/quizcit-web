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
            Bạn đang làm bài trắc nghiệm, nếu thoát ra thì bài của bạn sẽ tự động được nộp khi hết giờ làm bài.
          </p>
          <p className="exam-exit-subtext">
            Các đáp án bạn đã chọn đã được lưu lại tự động trong trình duyệt. Bạn vẫn có thể truy cập lại để tiếp tục làm bài nếu thời gian làm bài vẫn còn.
          </p>
        </div>
      </div>
    </Modal>
  );
}
