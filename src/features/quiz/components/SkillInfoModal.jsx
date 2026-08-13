/* Modal "Kỹ năng của câu hỏi" dùng chung cho bài thường và bài kiểm tra thích ứng.
   Chỉ hiển thị tên kỹ năng + nhãn "Chính" — trọng số là thông tin nội bộ, không đưa cho người học. */
import { Modal } from "../../../components/ui";
import "./SkillInfoModal.css";

export default function SkillInfoModal({ question, onClose }) {
  if (!question) return null;

  const skills = Array.isArray(question.skills) ? question.skills : [];

  return (
    <Modal open onClose={onClose} title="Kỹ năng của câu hỏi" size="sm">
      <ul className="skill-info-list">
        {skills.map((skill) => (
          <li key={skill.skillId} className="skill-info-item">
            <span className="skill-info-item__name">
              {skill.name || "Kỹ năng chưa đặt tên"}
            </span>
            {skill.primary && (
              <span className="skill-info-item__primary">Chính</span>
            )}
          </li>
        ))}
        {skills.length === 0 && (
          <li className="skill-info-item skill-info-item--empty">
            Câu hỏi này chưa gắn kỹ năng.
          </li>
        )}
      </ul>
    </Modal>
  );
}
