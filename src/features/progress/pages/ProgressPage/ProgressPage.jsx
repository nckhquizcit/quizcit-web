import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  getAverageAbility,
  getAbilityHistories,
  getAbilityHistoriesBySkill,
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
  Button,
  Card,
  EmptyState,
  ErrorState,
  ProgressRing,
  SkeletonCard,
} from "../../../../components/ui";
import ProgressBar from "../../../home/components/ProgressBar";
import { formatSubmittedAt } from "../../../../utils/dateFormat";
import "./ProgressPage.css";

const MISSING_SKILL_NAME = "Kỹ năng chưa đặt tên";
const HISTORY_LIMIT = 12;
const INVALID_SESSION_MESSAGE = "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.";
const LOAD_ERROR_MESSAGE = "Không thể tải tiến độ học tập.";

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
  const [averageAbility, setAverageAbility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [skillHistories, setSkillHistories] = useState([]);
  const [skillHistoryLoading, setSkillHistoryLoading] = useState(false);
  const [skillHistoryError, setSkillHistoryError] = useState("");
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

  useEffect(() => {
    if (!user?.userId || !selectedSkillId) {
      setSkillHistoryError("");
      setSkillHistoryLoading(false);
      return undefined;
    }

    let alive = true;
    setSkillHistories([]);
    setSkillHistoryError("");
    setSkillHistoryLoading(true);
    getAbilityHistoriesBySkill(user.userId, selectedSkillId)
      .then((rows) => {
        if (alive) setSkillHistories(rows || []);
      })
      .catch((fetchError) => {
        if (alive) {
          setSkillHistoryError(
            getErrorMessage(fetchError, "Không thể tải lịch sử của kỹ năng này."),
          );
        }
      })
      .finally(() => {
        if (alive) setSkillHistoryLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [user?.userId, selectedSkillId]);

  const skillNameById = useMemo(
    () =>
      new Map(
        skills.map((skill) => [String(skill.skillId ?? "").trim(), skill.name]),
      ),
    [skills],
  );

  const skillDescriptionById = useMemo(
    () =>
      new Map(
        skills.map((skill) => [String(skill.skillId ?? "").trim(), skill.description]),
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

  const selectedAbility = abilities.find(
    (ability) => String(ability.skillId ?? "").trim() === selectedSkillId,
  );
  // Chỉ hiển thị vòng năng lực khi lời gọi trung bình thực sự trả về dữ liệu.
  const hasAverage = averageAbility !== null && abilities.length > 0;
  const averagePercent = hasAverage ? thetaRawToPercent(averageAbility) : 0;
  const averageLevel = hasAverage ? getAbilityLevel(averageAbility) : null;
  const scopedSkillName = selectedSkillId
    ? getSkillDisplayName(skillNameById, selectedSkillId, selectedAbility?.name)
    : "";
  const activeHistories = selectedSkillId ? skillHistories : histories;
  const visibleHistories = activeHistories.slice(0, HISTORY_LIMIT);

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
                Chọn một kỹ năng để xem riêng lịch sử theta của kỹ năng đó.
              </p>
              <div className="progress-grid">
                {abilities.map((ability) => {
                  const thetaRaw = Number(ability.theta ?? 0);
                  const percent = thetaRawToPercent(thetaRaw);
                  const level = getAbilityLevel(thetaRaw);
                  const skillId = String(ability.skillId ?? "").trim();
                  const description = skillDescriptionById.get(skillId) || "";
                  const isSelected = Boolean(skillId) && skillId === selectedSkillId;
                  return (
                    <button
                      type="button"
                      className={`skill-tile ${isSelected ? "skill-tile--selected" : ""}`}
                      key={ability.id || ability.skillId}
                      onClick={() => setSelectedSkillId(isSelected ? "" : skillId)}
                      disabled={!skillId}
                      aria-pressed={isSelected}
                      title={description || undefined}
                    >
                      <span className="skill-tile__head">
                        <span className="skill-tile__name">
                          {getSkillDisplayName(skillNameById, ability.skillId, ability.name)}
                        </span>
                        <span className="skill-tile__level">{level.label}</span>
                      </span>
                      {description && <span className="skill-tile__desc">{description}</span>}
                      <strong className="skill-tile__theta">
                        {formatScaledThetaValue(thetaRaw)}
                        <span>/ 4</span>
                      </strong>
                      <ProgressBar value={percent} />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      <section className="progress-section">
        <div className="progress-section__head">
          <div className="progress-section__headline">
            <h2 className="progress-section__title">
              {selectedSkillId ? `Lịch sử cập nhật · ${scopedSkillName}` : "Lịch sử cập nhật"}
            </h2>
            {selectedSkillId && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedSkillId("")}>
                Tất cả kỹ năng
              </Button>
            )}
          </div>
          <p className="progress-section__sub">
            Theta được lưu sau bài kiểm tra và sau từng nhóm 5 câu thích ứng.
          </p>
          {activeHistories.length > HISTORY_LIMIT && (
            <p className="progress-muted">
              Hiển thị {HISTORY_LIMIT} / {activeHistories.length} lần cập nhật gần nhất.
            </p>
          )}
        </div>
        {skillHistoryLoading ? (
          <SkeletonCard lines={3} />
        ) : skillHistoryError ? (
          <p className="progress-muted">{skillHistoryError}</p>
        ) : visibleHistories.length === 0 ? (
          <p className="progress-muted">
            {selectedSkillId
              ? "Chưa có lịch sử theta cho kỹ năng này."
              : "Chưa có lịch sử theta cho tài khoản này."}
          </p>
        ) : (
          <Card padding="none" className="progress-history-card">
            {visibleHistories.map((item) => {
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
