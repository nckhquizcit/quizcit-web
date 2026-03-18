import { ArrowRight, BookOpen, Clock3, Layers3, Sparkles } from 'lucide-react';
import ProgressBar from '../../home/components/ProgressBar';
import './SubjectCard.css';

export default function SubjectCard({ subject }) {
  return (
    <article className={`subject-overview-card accent-${subject.accent}`}>
      <div className="subject-overview-card__header">
        <div>
          <p className="subject-overview-card__code">{subject.course_code}</p>
          <h3>{subject.name}</h3>
        </div>
        <span className="subject-overview-card__badge">{subject.status}</span>
      </div>

      <p className="subject-overview-card__description">{subject.description}</p>

      <div className="subject-overview-card__meta-grid">
        <div className="subject-meta-pill">
          <Layers3 size={16} />
          <span>{subject.chapterCount} chương</span>
        </div>
        <div className="subject-meta-pill">
          <Clock3 size={16} />
          <span>{subject.weeklyGoal}</span>
        </div>
        <div className="subject-meta-pill">
          <BookOpen size={16} />
          <span>{subject.category}</span>
        </div>
      </div>

      <div className="subject-overview-card__progress-row">
        <span>Tiến độ môn học</span>
        <strong>{subject.progress}%</strong>
      </div>
      <ProgressBar value={subject.progress} />

      <div className="subject-overview-card__chapter-progress">
        <span>
          Hoàn thành {subject.completedChapters}/{subject.chapterCount} chương
        </span>
        <span>
          {subject.nextChapter ? `Tiếp theo: ${subject.nextChapter.name}` : 'Đã hoàn tất'}
        </span>
      </div>

      <div className="subject-overview-card__chapters">
        {subject.chapterPreview.map((chapter) => (
          <div className="subject-overview-card__chapter-item" key={chapter.chapter_id}>
            <BookOpen size={14} />
            <span>{chapter.name}</span>
          </div>
        ))}
      </div>

      <div className="subject-focus-card">
        <div className="subject-focus-card__icon">
          <Sparkles size={16} />
        </div>
        <p>{subject.focus}</p>
      </div>

      <div className="subject-overview-card__actions">
        <button type="button" className="subject-overview-card__primary-button">
          Vào học
          <ArrowRight size={16} />
        </button>
        <button type="button" className="subject-overview-card__secondary-button">
          Xem lộ trình
        </button>
      </div>
    </article>
  );
}
