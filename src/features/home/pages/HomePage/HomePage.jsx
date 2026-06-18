import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import './HomePage.css';
import ProgressBar from '../../components/ProgressBar';
import { getChaptersBySubject, getSubjects } from '../../../../services/contentService';

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const user = getStoredUser();

  useEffect(() => {
    const loadData = async () => {
      const subjectData = (await getSubjects()) || [];
      const chaptersData = (
        await Promise.all(
          subjectData.map((subject) => getChaptersBySubject(subject.subjectId)),
        )
      ).flat();
      
      setSubjects(
        subjectData.map((s) => ({
          ...s,
          progress: Math.floor(Math.random() * 80) + 10, // Mock progress tạm thời do API chưa hỗ trợ
        })),
      );
      setChapters(chaptersData.filter(Boolean));
    };
    loadData();
  }, []);

  const overallProgress = subjects.length
    ? Math.round(
        subjects.reduce((total, subject) => total + subject.progress, 0) / subjects.length,
      )
    : 0;

  const lowProgressSubjects = subjects
    .filter((subject) => subject.progress < 60)
    .sort((a, b) => a.progress - b.progress);

  const recommendations = lowProgressSubjects.slice(0, 2).map((subject) => {
    const subjectChapters = chapters.filter(
      (chapter) => chapter.subjectId === subject.subjectId,
    );
    const chapterIndex = Math.min(
      Math.floor((subject.progress / 100) * subjectChapters.length),
      Math.max(subjectChapters.length - 1, 0),
    );

    return {
      subject,
      chapter: subjectChapters[chapterIndex] || null,
      reason:
        subject.progress < 40
          ? 'Tiến độ còn thấp, nên ôn tập ngay để tránh quên kiến thức nền.'
          : 'Đây là môn học cần được tăng tốc trong giai đoạn hiện tại.',
    };
  });

  return (
    <section className="home-page">
      <header className="home-hero">
        <div>
          <p className="home-hero__eyebrow">QuizCIT Dashboard</p>
          <h1>Chào, {user?.displayName || 'bạn'} 👋</h1>
          <p className="home-hero__description">
            Theo dõi tiến độ học tập, nhận gợi ý ôn tập thông minh và tiếp tục
            hành trình chinh phục các môn học nền tảng của bạn.
          </p>
        </div>
        <div className="home-hero__badge">Sinh viên</div>
      </header>

      <div className="home-summary-grid">
        <article className="summary-card summary-card--highlight">
          <div className="summary-card__icon">
            <Brain size={22} />
          </div>
          <div>
            <p className="summary-card__label">Chỉ số năng lực</p>
            <h2>{user?.theta_overall || 'Đang cập nhật'}</h2>
            <p className="summary-card__text">
              Năng lực tổng thể phản ánh kết quả làm bài và độ ổn định của quá
              trình ôn tập.
            </p>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-card__icon summary-card__icon--soft">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="summary-card__label">Tiến độ tổng thể</p>
            <h2>{overallProgress}%</h2>
            <ProgressBar value={overallProgress} />
          </div>
        </article>
      </div>

      <article
        className={`ai-card ${
          recommendations.some((r) => r.subject.progress < 40) ? 'ai-card--high' : ''
        }`}
      >
        <div className="ai-card__header">
          <div className="ai-card__icon">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="ai-card__title-row">
              <h2>Khuyến nghị từ AI</h2>
              {recommendations.some((r) => r.subject.progress < 40) && (
                <span className="ai-card__chip">Ưu tiên cao</span>
              )}
            </div>
            <p>
              {recommendations.length > 0
                ? 'Dựa trên tiến độ hiện tại, hệ thống gợi ý bạn nên ưu tiên các môn dưới đây để cải thiện kết quả.'
                : 'Bạn đang duy trì tiến độ rất tốt. Hãy tiếp tục ôn tập đều để hoàn thành mục tiêu học kỳ.'}
            </p>
          </div>
        </div>

        <div className="ai-card__list">
          {recommendations.map((item) => (
            <article
              className="recommendation-card"
              key={`${item.subject.subjectId}-${item.chapter?.chapterId || 'none'}`}
            >
              <div className="recommendation-card__content">
                <div className="recommendation-card__subject-row">
                  <TrendingUp size={18} />
                  <h3>{item.subject.name}</h3>
                </div>

                <div className="recommendation-card__chapter-row">
                  <BookOpen size={16} />
                  <span>{item.chapter?.name || 'Chương đang cập nhật'}</span>
                </div>

                <p className="recommendation-card__reason">{item.reason}</p>

                <div className="recommendation-card__progress-row">
                  <span>Tiến độ hiện tại</span>
                  <strong>{item.subject.progress}%</strong>
                </div>
                <ProgressBar value={item.subject.progress} />
              </div>

              <button type="button" className="primary-action-button">
                Học ngay
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </article>

      <section className="subjects-section">
        <div className="subjects-section__header">
          <div>
            <p className="section-eyebrow">Môn học</p>
            <h2>Môn học của tôi</h2>
          </div>
          <p className="subjects-section__helper">
            Danh sách môn học được ưu tiên theo tiến độ và mức độ cần cải thiện.
          </p>
        </div>

        <div className="subjects-grid">
          {subjects.map((subject) => (
            <article className="subject-card" key={subject.subjectId}>
              <div className="subject-card__header">
                <div>
                  <p className="subject-card__code">{subject.courseCode}</p>
                  <h3>{subject.name}</h3>
                </div>
                <span className="subject-card__pill">{subject.progress}%</span>
              </div>

              <p className="subject-card__description">{subject.description}</p>

              <div className="subject-card__progress-row">
                <span>Tiến độ</span>
                <strong>{subject.progress}%</strong>
              </div>
              <ProgressBar value={subject.progress} />

              <button type="button" className="secondary-action-button">
                Vào học
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}