import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Brain, Sparkles, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Badge,
  ProgressRing,
  EmptyState,
  ErrorState,
  SkeletonCard,
} from "../../../../components/ui";
import { getChaptersBySubject } from "../../../../services/chapterService";
import { getSubjects } from "../../../../services/subjectService";
import {
  getAverageAbility,
  getUserSkillAbilities,
} from "../../../../services/progressService";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
import {
  formatThetaValue,
  thetaRawToPercent,
} from "../../../../services/mappers";
import "./HomePage.css";

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
          await Promise.all(
            subjectData.map((subject) => getChaptersBySubject(subject.subjectId))
          )
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
          setSkillCount(
            abilitiesResult.status === "fulfilled"
              ? abilitiesResult.value.length
              : 0
          );
          setAverageTheta(
            averageResult.status === "fulfilled" ? averageResult.value : 0
          );
        }
      } catch (loadError) {
        if (alive)
          setError(
            getErrorMessage(loadError, "Không thể tải dữ liệu trang chủ.")
          );
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => {
      alive = false;
    };
  }, [user?.userId]);

  const overallProgress = skillCount > 0 ? thetaRawToPercent(averageTheta) : 0;
  const recommendations = subjects.slice(0, 2).map((subject) => {
    const subjectChapters = chapters.filter(
      (chapter) => chapter.subjectId === subject.subjectId
    );
    return {
      subject,
      chapter: subjectChapters[0] || null,
      reason:
        skillCount > 0
          ? "Tiếp tục luyện tập để cải thiện năng lực theo kỹ năng."
          : "Hoàn thành quiz đầu tiên để hệ thống bắt đầu ước tính năng lực.",
    };
  });

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-summary-grid">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <ErrorState
          description={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__text">
          <p className="home-hero__eyebrow">Học viên QuizCIT</p>
          <h1>Chào, {user?.displayName || user?.username || "bạn"} 👋</h1>
          <p className="home-hero__description">
            Chọn môn học, làm quiz và theo dõi năng lực theo kỹ năng sau mỗi lần
            nộp bài.
          </p>
          <Button
            variant="primary"
            size="lg"
            iconRight={<ArrowRight size={18} />}
            onClick={() => navigate("/app/subjects")}
          >
            Học tiếp
          </Button>
        </div>
        <div className="home-hero__ring">
          <ProgressRing
            value={overallProgress}
            size={150}
            stroke={12}
            label={skillCount > 0 ? formatThetaValue(averageTheta) : "—"}
            sublabel="Theta -4 đến +4"
          />
        </div>
      </section>

      <section className="home-summary-grid">
        <Card className="stat-card">
          <span className="stat-card__icon stat-card__icon--green">
            <BookOpen size={22} />
          </span>
          <div className="stat-card__body">
            <h3>{subjects.length}</h3>
            <p>Môn học</p>
          </div>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__icon stat-card__icon--blue">
            <Brain size={22} />
          </span>
          <div className="stat-card__body">
            <h3>{skillCount}</h3>
            <p>Kỹ năng đã có theta</p>
          </div>
        </Card>
        <Card className="stat-card">
          <span className="stat-card__icon stat-card__icon--amber">
            <TrendingUp size={22} />
          </span>
          <div className="stat-card__body">
            <h3>{skillCount > 0 ? formatThetaValue(averageTheta) : "—"}</h3>
            <p>Mức năng lực ước tính</p>
          </div>
        </Card>
      </section>

      <Card padding="lg" className="ai-card">
        <div className="ai-card__header">
          <span className="ai-card__icon">
            <Sparkles size={20} />
          </span>
          <div className="ai-card__heading">
            <div className="ai-card__title-row">
              <h2>Gợi ý học tập</h2>
              {skillCount === 0 && <Badge variant="warning">Cần dữ liệu quiz</Badge>}
            </div>
            <p className="ai-card__desc">
              {skillCount === 0
                ? "Hãy làm một bài quiz để hệ thống cập nhật theta và lịch sử năng lực."
                : `Theta hiện tại: ${formatThetaValue(averageTheta)} (-4 đến +4).`}
            </p>
          </div>
        </div>

        <div className="ai-card__list">
          {recommendations.map((item) => (
            <Card
              key={item.subject.subjectId}
              padding="md"
              className="reco-card"
            >
              <div className="reco-card__top">
                <h3>{item.subject.name}</h3>
                <Badge variant="primary">{item.subject.courseCode}</Badge>
              </div>
              <p className="reco-card__reason">{item.reason}</p>
              {item.chapter && (
                <Button
                  variant="secondary"
                  size="sm"
                  iconRight={<ArrowRight size={14} />}
                  onClick={() =>
                    navigate(`/app/subjects/${item.subject.subjectId}`)
                  }
                >
                  {item.chapter.name}
                </Button>
              )}
            </Card>
          ))}
        </div>
      </Card>

      <section className="subjects-section">
        <div className="subjects-section__header">
          <div>
            <h2>Môn học của hệ thống</h2>
            <p className="subjects-section__helper">
              Chọn môn học để tiếp tục lộ trình ôn tập của bạn.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconRight={<ArrowRight size={14} />}
            onClick={() => navigate("/app/subjects")}
          >
            Xem tất cả
          </Button>
        </div>

        {subjects.length === 0 ? (
          <EmptyState
            title="Chưa có môn học nào"
            description="Hệ thống chưa có môn học để hiển thị."
          />
        ) : (
          <div className="subjects-grid">
            {subjects.map((subject) => (
              <Card
                key={subject.subjectId}
                interactive
                className="home-subject-card"
                onClick={() =>
                  navigate(`/app/subjects/${subject.subjectId}`)
                }
              >
                <div className="home-subject-card__head">
                  <span className="home-subject-card__icon">
                    <BookOpen size={20} />
                  </span>
                  {subject.courseCode && (
                    <Badge variant="neutral" size="sm">
                      {subject.courseCode}
                    </Badge>
                  )}
                </div>
                <h3>{subject.name}</h3>
                <p className="home-subject-card__desc">
                  {subject.description || "Chưa có mô tả cho môn học này."}
                </p>
                <span className="home-subject-card__link">
                  Xem chi tiết <ArrowRight size={14} />
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
