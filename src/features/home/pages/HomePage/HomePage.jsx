import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, Layers3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  SkeletonCard,
  StatTile,
} from "../../../../components/ui";
import ProgressBar from "../../components/ProgressBar";
import { getAllChapters } from "../../../../services/chapterService";
import { getMyEnrollments } from "../../../../services/enrollmentService";
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
  const [enrolledIds, setEnrolledIds] = useState(() => new Set());
  const [skillCount, setSkillCount] = useState(0);
  const [averageTheta, setAverageTheta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);
  const navigate = useNavigate();
  const loadIdRef = useRef(0);

  // Tách phần tải dữ liệu thành hàm gọi lại được: effect ban đầu và nút "Thử lại" dùng chung.
  const loadData = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    const isCurrent = () => loadIdRef.current === loadId;

    try {
      setLoading(true);
      setError("");
      // Enrollment loi thi degrade ve rong, khong lam chet trang chu.
      const [subjectData = [], chaptersData = [], enrolledData = []] = await Promise.all([
        getSubjects(), getAllChapters(), getMyEnrollments().catch(() => []),
      ]);

      if (!isCurrent()) return;
      setSubjects(subjectData);
      setChapters(chaptersData.filter(Boolean));
      setEnrolledIds(
        new Set(enrolledData.map((subject) => String(subject.subjectId || subject.subject_id))),
      );

      if (user?.userId) {
        const [abilitiesResult, averageResult] = await Promise.allSettled([
          getUserSkillAbilities(user.userId),
          getAverageAbility(user.userId),
        ]);
        if (!isCurrent()) return;
        const abilities =
          abilitiesResult.status === "fulfilled" ? abilitiesResult.value : [];
        setSkillCount(abilities.length);
        setAverageTheta(
          averageResult.status === "fulfilled" && abilities.length > 0
            ? averageResult.value
            : null
        );
      }
    } catch (loadError) {
      if (isCurrent())
        setError(
          getErrorMessage(loadError, "Không thể tải dữ liệu trang chủ.")
        );
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadData();
    return () => {
      loadIdRef.current += 1;
    };
  }, [loadData]);

  const firstName = getFirstName(user?.displayName || user?.username);
  const greetingPeriod = getGreetingPeriod(new Date().getHours());
  const hasAbilityData = averageTheta !== null;
  const abilityLevel = hasAbilityData ? getAbilityLevel(averageTheta) : null;
  const abilityProgress = hasAbilityData ? thetaRawToPercent(averageTheta) : 0;

  const subjectsWithChapterCount = useMemo(
    () =>
      subjects.map((subject) => ({
        ...subject,
        enrolled: enrolledIds.has(String(subject.subjectId)),
        chapterCount: chapters.filter(
          (chapter) => chapter.subjectId === subject.subjectId
        ).length,
      })),
    [subjects, chapters, enrolledIds]
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
        <ErrorState description={error} onRetry={loadData} />
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
          {hasAbilityData ? (
            <>
              <div className="home-ability-card__value">
                {formatScaledThetaValue(averageTheta)}
                <span> / 4</span>
              </div>
              <p className="home-ability-card__label">Năng lực ước tính</p>
            </>
          ) : (
            <EmptyState
              className="home-ability-card__empty"
              title="Chưa có dữ liệu năng lực"
              description="Làm một bài kiểm tra để hệ thống ước tính năng lực của bạn."
            />
          )}

          <div className="home-ability-card__chips">
            <span className="home-chip">{skillCount} kỹ năng đã có dữ liệu</span>
            {abilityLevel && (
              <span className="home-chip">Mức {abilityLevel.label}</span>
            )}
          </div>

          {hasAbilityData && (
            <div className="home-ability-card__progress">
              <div className="home-ability-card__progress-labels">
                <span>Thang năng lực</span>
                <span>0 – 4</span>
              </div>
              <ProgressBar value={abilityProgress} />
            </div>
          )}

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
            <StatTile icon={<BookOpen size={18} />} value={subjects.length} label="Môn học" />
            <StatTile
              icon={<Layers3 size={18} />}
              value={chapters.length}
              label="Chương khả dụng"
            />
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
            <h2>Danh sách môn học</h2>
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
                as="button"
                type="button"
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
                  {!subject.enrolled
                    ? "Đăng ký để xem nội dung"
                    : subject.chapterCount > 0
                      ? `${subject.chapterCount} chương · Lý thuyết và bài kiểm tra`
                      : "Chưa mở khóa chương nào"}
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
