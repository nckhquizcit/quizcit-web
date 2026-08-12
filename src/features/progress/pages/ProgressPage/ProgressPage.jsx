import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getAverageAbility, getAbilityHistories, getUserSkillAbilities } from "../../../../services/progressService";
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
import ProgressBar from "../../../home/components/ProgressBar";
import "./ProgressPage.css";

const MISSING_SKILL_NAME = "Kỹ năng chưa đặt tên";

const getSkillDisplayName = (skillNameById, skillId, rowName) =>
  skillNameById.get(String(skillId ?? "").trim()) ||
  (rowName && rowName !== MISSING_SKILL_NAME ? rowName : "") ||
  MISSING_SKILL_NAME;

function formatDelta(delta) {
  if (delta > 0.001) return { text: `+${delta.toFixed(2)}`, trend: "up" };
  if (delta < -0.001) return { text: `\u2212${Math.abs(delta).toFixed(2)}`, trend: "down" };
  return { text: "0.00", trend: "flat" };
}

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus };
const TREND_BADGE_VARIANT = { up: "success", down: "error", flat: "neutral" };

export default function ProgressPage() {
  const [abilities, setAbilities] = useState([]);
  const [histories, setHistories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [averageAbility, setAverageAbility] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    let alive = true;

    async function loadProgress() {
      if (!user?.userId) return;
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
        setAbilities(abilityRows.status === "fulfilled" ? abilityRows.value : []);
        setHistories(historyRows.status === "fulfilled" ? historyRows.value : []);
        setSkills(skillRows.status === "fulfilled" ? skillRows.value : []);
        setAverageAbility(average.status === "fulfilled" ? average.value : 0);
      } catch (loadError) {
        if (alive) setError(getErrorMessage(loadError, "Không thể tải tiến độ học tập."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProgress();
    return () => {
      alive = false;
    };
  }, [user?.userId]);

  const skillNameById = useMemo(
    () =>
      new Map(
        skills.map((skill) => [String(skill.skillId ?? "").trim(), skill.name]),
      ),
    [skills],
  );

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

  const hasAbilityData = abilities.length > 0;
  const averagePercent = hasAbilityData ? thetaRawToPercent(averageAbility) : 0;
  const averageLevel = getAbilityLevel(averageAbility);

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
            {hasAbilityData
              ? `Mức ${averageLevel.label} · Thang 0–4`
              : "Chưa có dữ liệu · Thang 0–4"}
          </p>
          <div className="progress-overview-card__ring">
            <ProgressRing
              value={averagePercent}
              size={130}
              stroke={12}
              label={hasAbilityData ? formatScaledThetaValue(averageAbility) : "—"}
              sublabel="trên 4"
            />
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
            <div className="progress-grid">
              {abilities.map((ability) => {
                const thetaRaw = Number(ability.theta ?? 0);
                const percent = thetaRawToPercent(thetaRaw);
                const level = getAbilityLevel(thetaRaw);
                return (
                  <div className="skill-tile" key={ability.id || ability.skillId}>
                    <div className="skill-tile__head">
                      <span className="skill-tile__name">
                        {getSkillDisplayName(skillNameById, ability.skillId, ability.name)}
                      </span>
                      <span className="skill-tile__level">{level.label}</span>
                    </div>
                    <strong className="skill-tile__theta">
                      {formatScaledThetaValue(thetaRaw)}
                      <span>/ 4</span>
                    </strong>
                    <ProgressBar value={percent} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <section className="progress-section">
        <div className="progress-section__head">
          <h2 className="progress-section__title">Lịch sử cập nhật</h2>
          <p className="progress-section__sub">
            Theta được lưu sau bài kiểm tra và sau từng nhóm 5 câu thích ứng.
          </p>
        </div>
        {histories.length === 0 ? (
          <p className="progress-muted">
            Chưa có lịch sử theta cho tài khoản này.
          </p>
        ) : (
          <Card padding="none" className="progress-history-card">
            {histories.slice(0, 12).map((item) => {
              const thetaRaw = Number(item.theta ?? 0);
              const level = getAbilityLevel(thetaRaw);
              const delta = formatDelta(Number(item.delta ?? 0));
              const TrendIcon = TREND_ICON[delta.trend];
              return (
                <div className="progress-history-row" key={item.id}>
                  <span className="progress-history-row__name">
                    {getSkillDisplayName(skillNameById, item.skillId, item.name)}
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
                      {item.createdAt}
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
