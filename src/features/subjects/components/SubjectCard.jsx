import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../../components/ui";
import "./SubjectCard.css";

export default function SubjectCard({ subject }) {
  const navigate = useNavigate();
  const targetId = subject.subjectId || subject.subject_id;
  const courseCode = subject.courseCode || subject.course_code || "—";

  return (
    <Card className="subject-card" padding="lg">
      <div className="subject-card__header">
        <span className="subject-card__code-icon">{courseCode}</span>
        <div className="subject-card__heading">
          <h3>{subject.name}</h3>
          <span className="subject-card__chapter-count">
            {subject.chapterCount || 0} chương
          </span>
        </div>
      </div>

      <p className="subject-card__description">
        {subject.description || "Chưa có mô tả cho môn học này."}
      </p>

      <button
        type="button"
        className="subject-card__footer"
        onClick={() => navigate(`/app/subjects/${targetId}`)}
      >
        <span>Vào học</span>
        <ArrowRight size={16} />
      </button>
    </Card>
  );
}
