import { ArrowRight, BookOpen, Layers3, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card } from "../../../components/ui";
import "./SubjectCard.css";

export default function SubjectCard({ subject }) {
  const navigate = useNavigate();
  const chapterPreview = subject.chapterPreview || [];
  const targetId = subject.subjectId || subject.subject_id;

  return (
    <Card className="subject-card" padding="lg">
      <div className="subject-card__header">
        <div className="subject-card__heading">
          {subject.course_code && (
            <Badge variant="primary" size="sm">
              {subject.course_code}
            </Badge>
          )}
          <h3>{subject.name}</h3>
        </div>
        <span className="subject-card__icon">
          <BookOpen size={22} />
        </span>
      </div>

      <p className="subject-card__description">
        {subject.description || "Chưa có mô tả cho môn học này."}
      </p>

      <div className="subject-card__meta">
        <span className="subject-card__meta-pill">
          <Layers3 size={15} />
          {subject.chapterCount} chương
        </span>
      </div>

      {chapterPreview.length > 0 && (
        <div className="subject-card__chapters">
          <p className="subject-card__chapters-title">Nội dung chính</p>
          {chapterPreview.map((chapter) => (
            <div className="subject-card__chapter-item" key={chapter.chapter_id}>
              <BookOpen size={14} />
              <span>{chapter.name}</span>
            </div>
          ))}
          {subject.chapterCount > chapterPreview.length && (
            <p className="subject-card__chapters-more">
              + {subject.chapterCount - chapterPreview.length} chương khác
            </p>
          )}
        </div>
      )}

      <div className="subject-card__actions">
        <Button
          variant="primary"
          fullWidth
          iconRight={<ArrowRight size={16} />}
          onClick={() => navigate(`/app/subjects/${targetId}`)}
          className="subject-card__cta"
        >
          Vào học
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled
          iconLeft={<Plus size={16} />}
          className="subject-card__enroll"
          title="Tính năng đăng ký môn học sắp ra mắt"
        >
          Đăng ký
        </Button>
      </div>
    </Card>
  );
}
