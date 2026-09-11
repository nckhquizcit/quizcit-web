import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, Layers3 } from "lucide-react";
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
import { buildEnrolledSubjects } from "../../utils/homeSubjects";
import { getHomeSummary } from "../../../../services/homeService";
import { normalizeHomeSummary } from "../../utils/homeSummary";
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
  resolveImageUrl,
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
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [totalUnlockedChapters, setTotalUnlockedChapters] = useState(0);
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

      try {
        const summary = await getHomeSummary();
        if (!isCurrent()) return;

        if (summary) {
          const normalized = normalizeHomeSummary(summary);
          setEnrolledSubjects(normalized.enrolledSubjects);
          setTotalUnlockedChapters(normalized.totalUnlockedChapters);
          setSkillCount(normalized.skillCount);
          setAverageTheta(normalized.averageTheta);
          return;
        }
      } catch {
        // Resilient Fallback to legacy multi-request flow
      }

      // Fallback:
      const [subjectData = [], chaptersData = [], enrolledData = []] = await Promise.all([
        getSubjects(),
        getAllChapters(),
        getMyEnrollments().catch(() => []),
      ]);

      if (!isCurrent()) return;
      const validChapters = chaptersData.filter(Boolean);
      setTotalUnlockedChapters(validChapters.length);
      setEnrolledSubjects(buildEnrolledSubjects(enrolledData, subjectData, validChapters));

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
        <p>Hãy tiếp tục cố gắng nhé</p>
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
        </Card>

        <Card padding="lg" className="home-content-card">
          <h2>Nội dung học tập</h2>
          <p className="home-content-card__sub">Khóa học và tiến độ của bạn</p>

          <div className="home-content-card__stats">
            <StatTile
              icon={<GraduationCap size={18} />}
              value={enrolledSubjects.length}
              label="Môn đã đăng ký"
            />
            <StatTile
              icon={<Layers3 size={18} />}
              value={totalUnlockedChapters}
              label="Chương đã mở"
            />
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate("/app/subjects")}
          >
            Xem tất cả môn học
          </Button>
        </Card>
      </section>

      <section className="home-subjects-section">
        <div className="home-subjects-section__header">
          <div>
            <h2>Môn học đã đăng ký</h2>
            <p className="home-subjects-section__helper">
              Chọn môn để tiếp tục học lý thuyết và làm bài kiểm tra ôn tập.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconRight={<ArrowRight size={14} />}
            onClick={() => navigate("/app/subjects")}
          >
            Xem tất cả môn học
          </Button>
        </div>

        {enrolledSubjects.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={28} />}
            title="Bạn chưa đăng ký môn học nào"
            description="Hãy khám phá danh sách môn học và bấm đăng ký để mở khóa lý thuyết cùng bài kiểm tra ôn tập."
            action={
              <Button
                variant="primary"
                iconRight={<ArrowRight size={16} />}
                onClick={() => navigate("/app/subjects")}
              >
                Khám phá và đăng ký môn học
              </Button>
            }
          />
        ) : (
          <div className="home-subjects-grid">
            {enrolledSubjects.map((subject) => (
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
                {subject.imageUrl && (
                  <div className="home-subject-card__cover">
                    <img
                      src={resolveImageUrl(subject.imageUrl)}
                      alt={subject.name}
                      className="home-subject-card__cover-img"
                      loading="lazy"
                    />
                  </div>
                )}
                {subject.courseCode && (
                  <Badge variant="primary" size="sm">
                    {subject.courseCode}
                  </Badge>
                )}
                <h3>{subject.name}</h3>
                <p className="home-subject-card__meta">
                  {subject.chapterCount > 0
                    ? `${subject.chapterCount} chương đã mở · Lý thuyết và bài kiểm tra`
                    : "Chưa mở khóa chương nào"}
                </p>
                <span className="home-subject-card__link">
                  Vào học ngay <ArrowRight size={14} />
                </span>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
