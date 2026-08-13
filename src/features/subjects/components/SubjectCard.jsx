import { useState } from "react";
import { ArrowRight, BookOpen, Layers3, Lock, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card } from "../../../components/ui";
import "./SubjectCard.css";

export default function SubjectCard({ subject, enrolled = false, onEnroll, onUnenroll }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const chapterPreview = subject.chapterPreview || [];
  const targetId = subject.subjectId || subject.subject_id;
  const chapterCount = subject.chapterCount || 0;
  const contentLocked = !enrolled && chapterCount === 0;

  const runAction = async (action) => {
    if (!action || busy) return;
    try {
      setBusy(true);
      await action(subject);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="subject-card" padding="lg">
      <div className="subject-card__header">
        <div className="subject-card__heading">
          {(subject.course_code || enrolled) && (
            <div className="subject-card__badges">
              {subject.course_code && (
                <Badge variant="primary" size="sm">
                  {subject.course_code}
                </Badge>
              )}
              {enrolled && (
                <Badge variant="success" size="sm">
                  Đã đăng ký
                </Badge>
              )}
            </div>
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
          {contentLocked ? (
            <>
              <Lock size={15} />
              Đăng ký để xem nội dung
            </>
          ) : (
            <>
              <Layers3 size={15} />
              {chapterCount} chương
            </>
          )}
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
          {chapterCount > chapterPreview.length && (
            <p className="subject-card__chapters-more">
              + {chapterCount - chapterPreview.length} chương khác
            </p>
          )}
        </div>
      )}

      <div className="subject-card__actions">
        <Button
          variant={enrolled ? "primary" : "secondary"}
          fullWidth
          iconRight={<ArrowRight size={16} />}
          onClick={() => navigate(`/app/subjects/${targetId}`)}
          className="subject-card__cta"
        >
          Vào học
        </Button>
        {enrolled ? (
          <Button
            variant="ghost"
            fullWidth
            loading={busy}
            onClick={() => runAction(onUnenroll)}
            className="subject-card__enroll"
          >
            Hủy đăng ký
          </Button>
        ) : (
          <Button
            variant="primary"
            fullWidth
            loading={busy}
            iconLeft={<Plus size={16} />}
            onClick={() => runAction(onEnroll)}
            className="subject-card__enroll"
          >
            Đăng ký
          </Button>
        )}
      </div>
    </Card>
  );
}
