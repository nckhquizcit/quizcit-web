import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Layers3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  SkeletonCard,
} from "../../../../components/ui";
import ProgressBar from "../../components/ProgressBar";
import { getAllChapters } from "../../../../services/chapterService";
import { getSubjects } from "../../../../services/subjectService";
import {
  getAverageAbility,
  getUserSkillAbilities,
} from "../../../../services/progressService";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
import {
  formatScaledThetaValue,
  getAbilityLevel,
  thetaRawToPercent,
} from "../../../../services/mappers";
import "./HomePage.css";

function getGreetingPeriod(hour) {
  if (hour < 11) return "sáng";
  if (hour < 18) return "chiều";
  return "tối";
}

function getFirstName(displayName) {
  const trimmed = (displayName || "").trim();
  if (!trimmed) return "bạn";
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1];
}

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
        const [subjectData = [], chaptersData = []] = await Promise.all([
          getSubjects(), getAllChapters(),
        ]);

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

  const firstName = getFirstName(user?.displayName || user?.username);
  const greetingPeriod = getGreetingPeriod(new Date().getHours());
  const abilityLevel = getAbilityLevel(averageTheta);
  const abilityProgress = thetaRawToPercent(averageTheta);

  const subjectsWithChapterCount = useMemo(
    () =>
      subjects.map((subject) => ({
        ...subject,
        chapterCount: chapters.filter(
          (chapter) => chapter.subjectId === subject.subjectId
        ).length,
      })),
    [subjects, chapters]
  );

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-overview-row">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </div>
        <div className="home-subjects-grid">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
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
      <section className="home-greeting">
        <h1>Chào buổi {greetingPeriod}, {firstName}</h1>
        <p>Hôm nay bạn muốn tiến thêm một chút ở đâu?</p>
      </section>

      <section className="home-overview-row">
        <Card padding="lg" className="home-ability-card">
          <span className="home-kicker-chip">NĂNG LỰC TỔNG QUAN</span>
          <div className="home-ability-card__value">
            {formatScaledThetaValue(averageTheta)}
            <span> / 4</span>
          </div>
          <p className="home-ability-card__label">Năng lực ước tính</p>

          <div className="home-ability-card__chips">
            <span className="home-chip">{skillCount} kỹ năng đã có theta</span>
            <span className="home-chip">Mức {abilityLevel.label}</span>
          </div>

          <div className="home-ability-card__progress">
            <div className="home-ability-card__progress-labels">
              <span>Thang năng lực</span>
              <span>0 – 4</span>
            </div>
            <ProgressBar value={abilityProgress} />
          </div>

          <Button variant="primary" onClick={() => navigate("/app/progress")}>
            Xem tiến độ
          </Button>

          <p className="home-ability-card__note">
            Cập nhật sau bài kiểm tra và nhóm 5 câu thích ứng
          </p>
        </Card>

        <Card padding="lg" className="home-content-card">
          <h2>Nội dung khả dụng</h2>
          <p className="home-content-card__sub">Dữ liệu từ hệ thống</p>

          <div className="home-content-card__stats">
            <div className="home-stat-tile">
              <BookOpen size={18} />
              <strong>{subjects.length}</strong>
              <span>Môn học</span>
            </div>
            <div className="home-stat-tile">
              <Layers3 size={18} />
              <strong>{chapters.length}</strong>
              <span>Chương khả dụng</span>
            </div>
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate("/app/subjects")}
          >
            Xem danh sách môn học
          </Button>
        </Card>
      </section>

      <section className="home-subjects-section">
        <div className="home-subjects-section__header">
          <div>
            <h2>Môn học của hệ thống</h2>
            <p className="home-subjects-section__helper">
              Chọn môn để xem chương, lý thuyết và bài kiểm tra.
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
          <div className="home-subjects-grid">
            {subjectsWithChapterCount.map((subject) => (
              <Card
                key={subject.subjectId}
                interactive
                className="home-subject-card"
                onClick={() =>
                  navigate(`/app/subjects/${subject.subjectId}`)
                }
              >
                {subject.courseCode && (
                  <Badge variant="primary" size="sm">
                    {subject.courseCode}
                  </Badge>
                )}
                <h3>{subject.name}</h3>
                <p className="home-subject-card__meta">
                  {subject.chapterCount} chương · Lý thuyết và bài kiểm tra
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
