import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  getAverageAbility,
  getAbilityHistories,
  getUserSkillAbilities,
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
import SkillTile from "../../components/SkillTile/SkillTile";
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

  useEffect(() => {
    let alive = true;

    async function loadProgress() {
      if (!user?.userId) {
        setError(INVALID_SESSION_MESSAGE);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const [abilityRows, historyRows, skillRows, average] = await Promise.allSettled([
          getUserSkillAbilities(user.userId),
          getAbilityHistories(user.userId),
          getSkills(),
          getAverageAbility(user.userId),
        ]);

        if (!alive) return;

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
        if (alive) setError(getErrorMessage(loadError, LOAD_ERROR_MESSAGE));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProgress();
    return () => {
      alive = false;
    };
  }, [user?.userId]);

  const { nameById, descriptionById } = useMemo(() => buildSkillMaps(skills), [skills]);

  if (loading) {
    return (
      <div className="progress-page">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-page">
        <ErrorState
          description={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // Chỉ hiển thị vòng năng lực khi lời gọi trung bình thực sự trả về dữ liệu.
  const hasAverage = averageAbility !== null && abilities.length > 0;
  const averagePercent = hasAverage ? thetaRawToPercent(averageAbility) : 0;
  const averageLevel = hasAverage ? getAbilityLevel(averageAbility) : null;
  const visibleHistories = histories.slice(0, HISTORY_LIMIT);
  const visibleAbilities = abilities.slice(0, SKILL_LIMIT);
  const hiddenSkillCount = abilities.length - SKILL_LIMIT;

  return (
    <div className="progress-page">
      <header className="progress-header">
        <h1>Tiến độ</h1>
        <p className="progress-header__desc">
          Theo dõi theta theo kỹ năng và các lần hệ thống cập nhật năng lực.
        </p>
      </header>

      <div className="progress-top-grid">
        <Card as="section" padding="lg" className="progress-overview-card">
          <h2>Năng lực tổng quan</h2>
          <p className="progress-overview-card__meta">
            {hasAverage
              ? `Mức ${averageLevel.label} · Thang 0–4`
              : "Chưa có dữ liệu · Thang 0–4"}
          </p>
          <div className="progress-overview-card__ring">
            <ProgressRing
              value={averagePercent}
              size={130}
              stroke={12}
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
              description="Hoàn thành một bài quiz để hệ thống cập nhật theta theo kỹ năng."
            />
          ) : (
            <>
              <p className="progress-skills-card__hint">
                Chọn một kỹ năng để mở trang chi tiết với biểu đồ và lịch sử theta.
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
            Theta được lưu sau bài kiểm tra và sau từng nhóm 5 câu thích ứng.
          </p>
          {histories.length > HISTORY_LIMIT && (
            <p className="progress-muted">
              Hiển thị {HISTORY_LIMIT} / {histories.length} lần cập nhật gần nhất.
            </p>
          )}
        </div>
        {visibleHistories.length === 0 ? (
          <p className="progress-muted">Chưa có lịch sử theta cho tài khoản này.</p>
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
                  <span className="progress-history-row__theta">
                    θ {formatScaledThetaValue(thetaRaw)} / 4 · {level.label}
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
