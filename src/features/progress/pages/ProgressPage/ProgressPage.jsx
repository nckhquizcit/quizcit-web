import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, HelpCircle } from "lucide-react";
import {
  getAverageAbility,
  getAbilityHistories,
  getUserSkillAbilities,
  getUserProgressOverview,
} from "../../../../services/progressService";
import { getSkills } from "../../../../services/skillService";
import { getStoredUser, getErrorMessage } from "../../../../services/apiClient";
import {
  formatScaledThetaValue,
  getAbilityLevel,
  thetaRawToPercent,
} from "../../../../services/mappers";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  ProgressRing,
  SkeletonCard,
} from "../../../../components/ui";
import { normalizeProgressOverview } from "../../utils/progressOverview";
import SkillTile from "../../components/SkillTile/SkillTile";
import { getProgressTone } from "../../../home/components/progressTone.js";
import {
  TREND_BADGE_VARIANT,
  TREND_ICON,
  buildSkillMaps,
  formatDelta,
  getSkillDisplayName,
  normalizeSkillId,
} from "../../utils/skillProgress";
import { formatSubmittedAt } from "../../../../utils/dateFormat";
import "./ProgressPage.css";

const PROGRESS_RING_COLORS = {
  danger: "var(--color-error)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
  success: "var(--color-success)",
};

const HISTORY_LIMIT = 12;
const SKILL_LIMIT = 4;
const INVALID_SESSION_MESSAGE = "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.";
const LOAD_ERROR_MESSAGE = "Không thể tải tiến độ học tập.";

export default function ProgressPage() {
  const [abilities, setAbilities] = useState([]);
  const [histories, setHistories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [averageAbility, setAverageAbility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);
  const loadIdRef = useRef(0);

  // Tách phần tải dữ liệu thành hàm gọi lại được: effect ban đầu và nút "Thử lại" dùng chung.
  const loadProgress = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    const isCurrent = () => loadIdRef.current === loadId;

    if (!user?.userId) {
      setError(INVALID_SESSION_MESSAGE);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      try {
        const overview = await getUserProgressOverview(user.userId);
        if (!isCurrent()) return;

        if (overview) {
          const normalized = normalizeProgressOverview(overview);
          setAbilities(normalized.abilities);
          setHistories(normalized.histories);
          setSkills(normalized.skills);
          setAverageAbility(normalized.averageAbility);
          return;
        }
      } catch (overviewError) {
        console.warn("getUserProgressOverview failed, falling back to legacy flow:", overviewError);
      }

      const [abilityRows, historyRows, skillRows, average] = await Promise.allSettled([
        getUserSkillAbilities(user.userId),
        getAbilityHistories(user.userId),
        getSkills(),
        getAverageAbility(user.userId),
      ]);

      if (!isCurrent()) return;

      // allSettled không bao giờ reject nên phải tự kiểm tra từng kết quả.
      if (abilityRows.status === "rejected" && historyRows.status === "rejected") {
        setError(getErrorMessage(abilityRows.reason, LOAD_ERROR_MESSAGE));
        return;
      }

      setAbilities(abilityRows.status === "fulfilled" ? abilityRows.value : []);
      setHistories(historyRows.status === "fulfilled" ? historyRows.value : []);
      setSkills(skillRows.status === "fulfilled" ? skillRows.value : []);
      setAverageAbility(average.status === "fulfilled" ? average.value : null);
    } catch (loadError) {
      if (isCurrent()) setError(getErrorMessage(loadError, LOAD_ERROR_MESSAGE));
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadProgress();
    return () => {
      loadIdRef.current += 1;
    };
  }, [loadProgress]);

  const { nameById, descriptionById } = useMemo(() => buildSkillMaps(skills), [skills]);

  if (loading) {
    return (
      <div className="progress-page">
        {/* Dựng khung xương theo đúng bố cục thật: lưới trên 2 cột + mục lịch sử. */}
        <div className="progress-top-grid">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={5} />
        </div>
        <div className="progress-section">
          <SkeletonCard lines={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-page">
        <ErrorState description={error} onRetry={loadProgress} />
      </div>
    );
  }

  // Chỉ hiển thị vòng năng lực khi lời gọi trung bình thực sự trả về dữ liệu.
  const hasAverage = averageAbility !== null && abilities.length > 0;
  const averagePercent = hasAverage ? thetaRawToPercent(averageAbility) : 0;
  const averageLevel = hasAverage ? getAbilityLevel(averageAbility) : null;
  const averageTone = hasAverage ? getProgressTone(averagePercent) : null;
  const visibleHistories = histories.slice(0, HISTORY_LIMIT);
  const visibleAbilities = abilities.slice(0, SKILL_LIMIT);
  const hiddenSkillCount = abilities.length - SKILL_LIMIT;

  return (
    <div className="progress-page">
      <header className="progress-header">
        <h1>Tiến độ</h1>
        <p className="progress-header__desc">
          Theo dõi năng lực theo từng kỹ năng.
        </p>
      </header>

      <div className="progress-top-grid">
        <Card as="section" padding="lg" className="progress-overview-card">
          <div className="progress-overview-header">
            <h2>Năng lực tổng quan</h2>
            <div className="progress-ability-tooltip-wrapper" tabIndex={0}>
              <HelpCircle size={20} className="progress-ability-help-icon" />
              <div className="progress-ability-tooltip">
                Năng lực của bạn được tính toán dựa trên các lần làm bài kiểm tra trên hệ thống. Điểm số được tính riêng biệt trên từng kỹ năng của bài kiểm tra đã làm tương ứng. Điểm số bạn hiện thấy là tổng hợp dựa trên các điểm riêng biệt đó.
              </div>
            </div>
          </div>
          <p
            className={`progress-overview-card__meta${averageTone ? ` progress-overview-card__meta--${averageTone}` : ""}`}
          >
            {hasAverage ? `Mức ${averageLevel.label}` : "Chưa có dữ liệu"}
          </p>
          <div className="progress-overview-card__ring">
            <ProgressRing
              value={averagePercent}
              size={130}
              stroke={12}
              color={averageTone ? PROGRESS_RING_COLORS[averageTone] : undefined}
              label={hasAverage ? formatScaledThetaValue(averageAbility) : "—"}
              sublabel="trên 4"
              ariaLabel={
                hasAverage
                  ? `Năng lực tổng quan ${formatScaledThetaValue(averageAbility)} trên 4, mức ${averageLevel.label}`
                  : "Chưa có dữ liệu năng lực tổng quan"
              }
            />
          </div>
          <div className="progress-overview-card__stats">
            <div className="progress-overview-card__stat">
              <strong>{abilities.length}</strong>
              <span>Kỹ năng theo dõi</span>
            </div>
            <span className="progress-overview-card__divider" aria-hidden="true" />
            <div className="progress-overview-card__stat">
              <strong>{histories.length}</strong>
              <span>Lần cập nhật</span>
            </div>
          </div>
          <p className="progress-overview-card__note">
            Cập nhật sau bài kiểm tra hoặc mỗi nhóm 5 câu
          </p>
        </Card>

        <Card as="section" padding="lg" className="progress-skills-card">
          <h2>Kỹ năng của bạn</h2>
          {abilities.length === 0 ? (
            <EmptyState
              title="Chưa có dữ liệu năng lực"
              description="Hoàn thành một bài kiểm tra để hệ thống cập nhật năng lực theo kỹ năng."
            />
          ) : (
            <>
              <p className="progress-skills-card__hint">
                Chọn một kỹ năng để mở trang chi tiết với biểu đồ và lịch sử năng lực.
              </p>
              <div className="progress-grid">
                {visibleAbilities.map((ability) => {
                  const skillId = normalizeSkillId(ability.skillId);
                  return (
                    <SkillTile
                      key={ability.id || skillId}
                      skillId={skillId}
                      name={getSkillDisplayName(nameById, skillId, ability.name)}
                      description={descriptionById.get(skillId) || ""}
                      theta={ability.theta}
                    />
                  );
                })}
              </div>
              {hiddenSkillCount > 0 && (
                <Link className="progress-skills-card__more" to="/app/progress/skills">
                  Xem tất cả {abilities.length} kỹ năng
                  <ChevronRight size={16} />
                </Link>
              )}
            </>
          )}
        </Card>
      </div>

      <section className="progress-section">
        <div className="progress-section__head">
          <h2 className="progress-section__title">Lịch sử cập nhật</h2>
          <p className="progress-section__sub">
            Năng lực được lưu sau bài kiểm tra và sau từng nhóm 5 câu thích ứng.
          </p>
          {histories.length > HISTORY_LIMIT && (
            <p className="progress-muted">
              Hiển thị {HISTORY_LIMIT} / {histories.length} lần cập nhật gần nhất.
            </p>
          )}
        </div>
        {visibleHistories.length === 0 ? (
          <EmptyState
            className="progress-history-empty"
            title="Chưa có lịch sử cập nhật"
            description="Hoàn thành một bài kiểm tra để hệ thống ghi nhận năng lực."
          />
        ) : (
          <Card padding="none" className="progress-history-card">
            {visibleHistories.map((item) => {
              const thetaRaw = Number(item.theta ?? 0);
              const level = getAbilityLevel(thetaRaw);
              const delta = formatDelta(item.deltaScaled ?? 0);
              const TrendIcon = TREND_ICON[delta.trend];
              return (
                <div className="progress-history-row" key={item.id}>
                  <span className="progress-history-row__name">
                    {getSkillDisplayName(nameById, item.skillId, item.name)}
                  </span>
                  <span
                    className="progress-history-row__theta"
                    title="Năng lực"
                    aria-label={`Năng lực ${formatScaledThetaValue(thetaRaw)} trên 4, mức ${level.label}`}
                  >
                    Theta {formatScaledThetaValue(thetaRaw)} / 4 · {level.label}
                  </span>
                  <Badge
                    variant={TREND_BADGE_VARIANT[delta.trend]}
                    size="sm"
                    className="progress-history-row__delta"
                    iconLeft={<TrendIcon size={12} />}
                  >
                    {delta.text}
                  </Badge>
                  {item.createdAt && (
                    <small className="progress-history-row__date">
                      {formatSubmittedAt(item.createdAt)}
                    </small>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
