import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Brain, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../../components/ProgressBar";
import { getChaptersBySubject } from "../../../../services/chapterService";
import { getSubjects } from "../../../../services/subjectService";
import { getAverageAbility, getUserSkillAbilities } from "../../../../services/progressService";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
import "./HomePage.css";

const thetaToProgress = (theta) => Math.max(0, Math.min(100, Math.round(((theta + 3) / 6) * 100)));

export default function HomePage() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [skillCount, setSkillCount] = useState(0);
  const [averageTheta, setAverageTheta] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const subjectData = (await getSubjects()) || [];
        const chaptersData = (
          await Promise.all(subjectData.map((subject) => getChaptersBySubject(subject.subjectId)))
        ).flat();

        if (!alive) return;
        setSubjects(subjectData);
        setChapters(chaptersData.filter(Boolean));

        if (user?.userId) {
          const [abilitiesResult, averageResult] = await Promise.allSettled([
            getUserSkillAbilities(user.userId),
            getAverageAbility(user.userId),
          ]);
          if (!alive) return;
          setSkillCount(abilitiesResult.status === "fulfilled" ? abilitiesResult.value.length : 0);
          setAverageTheta(averageResult.status === "fulfilled" ? averageResult.value : 0);
        }
      } catch (loadError) {
        if (alive) setError(getErrorMessage(loadError, "Không thể tải dữ liệu trang chủ."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => {
      alive = false;
    };
  }, [user?.userId]);

  const overallProgress = skillCount > 0 ? thetaToProgress(averageTheta) : 0;
  const recommendations = subjects.slice(0, 2).map((subject) => {
    const subjectChapters = chapters.filter((chapter) => chapter.subjectId === subject.subjectId);
    return {
      subject,
      chapter: subjectChapters[0] || null,
      reason:
        skillCount > 0
          ? "Tiếp tục luyện tập để cải thiện theta theo kỹ năng."
          : "Hoàn thành quiz đầu tiên để hệ thống bắt đầu đo tiến độ.",
    };
  });

  if (loading) {
    return <div className="home-page">Đang tải trang chủ...</div>;
  }

  if (error) {
    return (
      <div className="home-page">
        <section className="ai-card">
          <h2>{error}</h2>
          <button type="button" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="home-hero">
        <div>
          <p className="home-hero__eyebrow">Học viên QuizCit</p>
          <h1>Chào, {user?.displayName || user?.username || "bạn"}.</h1>
          <p className="home-hero__description">
            Chọn môn học, làm quiz và theo dõi năng lực theo kỹ năng sau mỗi lần nộp bài.
          </p>
        </div>
        <button type="button" className="home-hero__badge" onClick={() => navigate("/app/subjects")}>
          Học tiếp <ArrowRight size={16} />
        </button>
      </section>

      <section className="home-summary-grid">
        <article className="recommendation-card">
          <div className="recommendation-card__content">
            <BookOpen size={24} />
            <h3>{subjects.length}</h3>
            <p>Môn học</p>
          </div>
        </article>
        <article className="recommendation-card">
          <div className="recommendation-card__content">
            <Brain size={24} />
            <h3>{skillCount}</h3>
            <p>Kỹ năng đã có theta</p>
          </div>
        </article>
        <article className="recommendation-card">
          <div className="recommendation-card__content">
            <TrendingUp size={24} />
            <h3>{overallProgress}%</h3>
              <p>Tiến độ năng lực</p>
            <ProgressBar value={overallProgress} />
          </div>
        </article>
      </section>

      <article className={`ai-card ${skillCount === 0 ? "ai-card--high" : ""}`}>
        <div className="ai-card__header">
          <div className="ai-card__icon">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="ai-card__title-row">
              <h2>Gợi ý học tập</h2>
              {skillCount === 0 && <span className="ai-card__chip">Cần dữ liệu quiz</span>}
            </div>
            <p>
              {skillCount === 0
                ? "Hãy làm một bài quiz để hệ thống cập nhật theta và lịch sử năng lực."
                : `Theta trung bình hiện tại: ${averageTheta.toFixed(2)}.`}
            </p>
          </div>
        </div>

        <div className="ai-card__list">
          {recommendations.map((item) => (
            <article className="recommendation-card" key={item.subject.subjectId}>
              <div className="recommendation-card__content">
                <div className="recommendation-card__subject-row">
                  <h3>{item.subject.name}</h3>
                  <span>{item.subject.courseCode}</span>
                </div>
                <p className="recommendation-card__reason">{item.reason}</p>
                {item.chapter && (
                  <button
                    type="button"
                    className="home-hero__badge"
                    onClick={() => navigate(`/app/subjects/${item.subject.subjectId}`)}
                  >
                    {item.chapter.name} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </article>

      <section className="subjects-section">
        <div className="subjects-section__header">
          <div>
            <h2>Môn học của hệ thống</h2>
            <p className="subjects-section__helper">Chọn môn học để tiếp tục lộ trình ôn tập của bạn.</p>
          </div>
        </div>
        <div className="subjects-grid">
          {subjects.map((subject) => (
            <article className="recommendation-card" key={subject.subjectId}>
              <div className="recommendation-card__content">
                <h3>{subject.name}</h3>
                <p>{subject.description || subject.courseCode}</p>
                <button type="button" className="home-hero__badge" onClick={() => navigate(`/app/subjects/${subject.subjectId}`)}>
                  Xem chi tiết <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
          {subjects.length === 0 && <p className="subjects-section__helper">Chưa có môn học nào.</p>}
        </div>
      </section>
    </div>
  );
}
