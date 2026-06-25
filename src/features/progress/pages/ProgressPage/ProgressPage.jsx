import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getAverageAbility, getAbilityHistories, getUserSkillAbilities } from "../../../../services/progressService";
import { getSkills } from "../../../../services/skillService";
import { getStoredUser, getErrorMessage } from "../../../../services/apiClient";
import {
  Card,
  EmptyState,
  ErrorState,
  ProgressRing,
  SkeletonCard,
} from "../../../../components/ui";
import ProgressBar from "../../../home/components/ProgressBar";
import "./ProgressPage.css";

const thetaToPercent = (theta) =>
  Math.max(0, Math.min(100, Math.round(((Number(theta) + 3) / 6) * 100)));

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
    () => new Map(skills.map((skill) => [skill.skillId, skill.name])),
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

  const averagePercent = thetaToPercent(averageAbility);

  return (
    <div className="progress-page">
      <header className="progress-header">
        <div className="progress-header__text">
          <p className="progress-eyebrow">Tiến độ học tập</p>
          <h1>Năng lực theo kỹ năng</h1>
          <p className="progress-header__desc">
            Theta được cập nhật sau mỗi bài kiểm tra bạn hoàn thành.
          </p>
        </div>
        <div className="progress-header__ring">
          <ProgressRing
            value={averagePercent}
            size={130}
            stroke={12}
            label={averageAbility.toFixed(2)}
            sublabel="Theta trung bình"
          />
        </div>
      </header>

      {abilities.length === 0 ? (
        <EmptyState
          title="Chưa có dữ liệu năng lực"
          description="Hoàn thành một bài quiz để hệ thống cập nhật theta theo kỹ năng."
        />
      ) : (
        <section className="progress-section">
          <h2 className="progress-section__title">Kỹ năng của bạn</h2>
          <div className="progress-grid">
            {abilities.map((ability) => {
              const percent = thetaToPercent(ability.theta);
              return (
                <Card
                  className="skill-progress-card"
                  key={ability.id || ability.skillId}
                >
                  <div className="skill-progress-card__head">
                    <span className="skill-progress-card__name">
                      {skillNameById.get(ability.skillId) || ability.skillId}
                    </span>
                    <strong className="skill-progress-card__theta">
                      {ability.theta.toFixed(2)}
                    </strong>
                  </div>
                  <ProgressBar value={percent} />
                  <small className="skill-progress-card__se">
                    Sai số chuẩn: {ability.standardError ?? "—"}
                  </small>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="progress-section">
        <h2 className="progress-section__title">Lịch sử cập nhật</h2>
        {histories.length === 0 ? (
          <p className="progress-muted">
            Chưa có lịch sử theta cho tài khoản này.
          </p>
        ) : (
          <Card padding="none" className="progress-history-card">
            {histories.slice(0, 12).map((item) => {
              const delta = Number(item.delta || 0);
              const trend =
                delta > 0 ? "up" : delta < 0 ? "down" : "flat";
              const TrendIcon =
                trend === "up"
                  ? TrendingUp
                  : trend === "down"
                    ? TrendingDown
                    : Minus;
              return (
                <div className="progress-history-row" key={item.id}>
                  <span className="progress-history-row__name">
                    {skillNameById.get(item.skillId) || item.skillId}
                  </span>
                  <span className="progress-history-row__theta">
                    {item.theta.toFixed(2)}
                  </span>
                  <span
                    className={`progress-history-row__delta progress-history-row__delta--${trend}`}
                  >
                    <TrendIcon size={14} />
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(2)}
                  </span>
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
