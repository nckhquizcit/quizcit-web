import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import {
  getAbilityHistoriesBySkill,
  getUserSkillAbilities,
} from "../../../../services/progressService";
import { getSkills } from "../../../../services/skillService";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
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
import ThetaTrendChart from "../../components/ThetaTrendChart/ThetaTrendChart";
import {
  TREND_BADGE_VARIANT,
  TREND_ICON,
  buildSkillMaps,
  formatDelta,
  getSkillDisplayName,
  normalizeSkillId,
  sortHistoriesAscending,
} from "../../utils/skillProgress";
import { formatShortDate, formatSubmittedAt } from "../../../../utils/dateFormat";
import "./SkillDetailPage.css";

const OTHER_SKILL_LIMIT = 5;
const INVALID_SESSION_MESSAGE = "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.";
const LOAD_ERROR_MESSAGE = "Không thể tải chi tiết kỹ năng.";

export default function SkillDetailPage() {
  const { skillId } = useParams();
  const [abilities, setAbilities] = useState([]);
  const [skills, setSkills] = useState([]);
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    let alive = true;

    async function loadSkillDetail() {
      if (!user?.userId) {
        setError(INVALID_SESSION_MESSAGE);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      const [abilityRows, skillRows, historyRows] = await Promise.allSettled([
        getUserSkillAbilities(user.userId),
        getSkills(),
        getAbilityHistoriesBySkill(user.userId, skillId),
      ]);

      if (!alive) return;

      if (abilityRows.status === "rejected" && historyRows.status === "rejected") {
        setError(getErrorMessage(abilityRows.reason, LOAD_ERROR_MESSAGE));
        setLoading(false);
        return;
      }

      setAbilities(abilityRows.status === "fulfilled" ? abilityRows.value : []);
      setSkills(skillRows.status === "fulfilled" ? skillRows.value : []);
      setHistories(historyRows.status === "fulfilled" ? historyRows.value || [] : []);
      setLoading(false);
    }

    loadSkillDetail();
    return () => {
      alive = false;
    };
  }, [user?.userId, skillId]);

  const { nameById, descriptionById } = useMemo(() => buildSkillMaps(skills), [skills]);
  const ascendingHistories = useMemo(() => sortHistoriesAscending(histories), [histories]);

  if (loading) {
    return (
      <div className="skill-detail-page">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={5} />
      </div>
    );
  }

  const currentSkillId = normalizeSkillId(skillId);
  const ability = abilities.find((row) => normalizeSkillId(row.skillId) === currentSkillId);
  const skillName = getSkillDisplayName(nameById, currentSkillId, ability?.name);
  const description = descriptionById.get(currentSkillId) || "";

  const backLink = (
    <Link className="skill-detail-back" to="/app/progress">
      <ArrowLeft size={16} />
      Tiến độ
    </Link>
  );

  if (error) {
    return (
      <div className="skill-detail-page">
        {backLink}
        <ErrorState description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!ability && ascendingHistories.length === 0) {
    return (
      <div className="skill-detail-page">
        {backLink}
        <EmptyState
          title={`Chưa có dữ liệu cho ${skillName}`}
          description="Hoàn thành một bài quiz có kỹ năng này để hệ thống ghi nhận theta."
        />
      </div>
    );
  }

  const latestHistory = ascendingHistories.at(-1);
  const thetaRaw = Number(ability?.theta ?? latestHistory?.theta ?? 0);
  const level = getAbilityLevel(thetaRaw);
  const percent = thetaRawToPercent(thetaRaw);
  const latestDelta = formatDelta(latestHistory?.deltaScaled ?? 0);
  const LatestTrendIcon = TREND_ICON[latestDelta.trend];
  const peakScaled = ascendingHistories.reduce(
    (max, item) => Math.max(max, Number(item.thetaScaled ?? 0)),
    level.thetaScaled,
  );
  const lastUpdatedAt = ability?.updatedAt || latestHistory?.createdAt;
  const chartPoints = ascendingHistories.map((item) => ({
    value: Number(item.thetaScaled ?? 0),
    label: formatShortDate(item.createdAt),
  }));
  const descendingHistories = [...ascendingHistories].reverse();
  const otherAbilities = abilities.filter(
    (row) => normalizeSkillId(row.skillId) && normalizeSkillId(row.skillId) !== currentSkillId,
  );
  const visibleOtherAbilities = otherAbilities.slice(0, OTHER_SKILL_LIMIT);

  return (
    <div className="skill-detail-page">
      {backLink}

      <Card as="header" padding="lg" className="skill-detail-hero">
        <div className="skill-detail-hero__info">
          <Badge variant="primary" size="sm">
            Mức {level.label}
          </Badge>
          <h1>{skillName}</h1>
          {description && <p className="skill-detail-hero__desc">{description}</p>}
          <div className="skill-detail-hero__bar">
            <ProgressBar value={percent} />
            <span>{percent}% so với mức tối đa</span>
          </div>
        </div>
        <ProgressRing
          value={percent}
          size={132}
          stroke={12}
          label={formatScaledThetaValue(thetaRaw)}
          sublabel="trên 4"
          ariaLabel={`Theta ${formatScaledThetaValue(thetaRaw)} trên 4, mức ${level.label}`}
        />
      </Card>

      <div className="skill-detail-stats">
        <div className="skill-detail-stats__cell">
          <span className="skill-detail-stats__value">{formatScaledThetaValue(thetaRaw)}</span>
          <span className="skill-detail-stats__label">Theta hiện tại</span>
        </div>
        <div className="skill-detail-stats__cell">
          <span className={`skill-detail-stats__value skill-detail-stats__value--${latestDelta.trend}`}>
            <LatestTrendIcon size={18} />
            {latestDelta.text}
          </span>
          <span className="skill-detail-stats__label">Thay đổi gần nhất</span>
        </div>
        <div className="skill-detail-stats__cell">
          <span className="skill-detail-stats__value">{peakScaled.toFixed(2)}</span>
          <span className="skill-detail-stats__label">Mức cao nhất</span>
        </div>
        <div className="skill-detail-stats__cell">
          <span className="skill-detail-stats__value skill-detail-stats__value--sm">
            {formatSubmittedAt(lastUpdatedAt)}
          </span>
          <span className="skill-detail-stats__label">Cập nhật lần cuối</span>
        </div>
      </div>

      <Card padding="lg" className="skill-detail-chart-card">
        <div className="skill-detail-section__head">
          <h2>Diễn biến theta</h2>
          <p>{ascendingHistories.length} lần cập nhật, theo thang 0–4.</p>
        </div>
        {chartPoints.length < 2 ? (
          <p className="skill-detail-muted">
            Cần ít nhất hai lần cập nhật để vẽ biểu đồ diễn biến.
          </p>
        ) : (
          <ThetaTrendChart
            points={chartPoints}
            ariaLabel={`Diễn biến theta của kỹ năng ${skillName}`}
          />
        )}
      </Card>

      <section className="skill-detail-section">
        <div className="skill-detail-section__head">
          <h2>Lịch sử cập nhật</h2>
          <p>Theta được lưu sau bài kiểm tra và sau từng nhóm 5 câu thích ứng.</p>
        </div>
        {descendingHistories.length === 0 ? (
          <p className="skill-detail-muted">Chưa có lịch sử theta cho kỹ năng này.</p>
        ) : (
          <Card padding="none" className="skill-detail-history">
            {descendingHistories.map((item, index) => {
              const delta = formatDelta(item.deltaScaled ?? 0);
              const TrendIcon = TREND_ICON[delta.trend];
              return (
                <div className="skill-detail-history__row" key={item.id || index}>
                  <span className="skill-detail-history__date">
                    {formatSubmittedAt(item.createdAt)}
                  </span>
                  <span className="skill-detail-history__theta">
                    θ {formatScaledThetaValue(item.theta)} / 4
                  </span>
                  <Badge
                    variant={TREND_BADGE_VARIANT[delta.trend]}
                    size="sm"
                    className="skill-detail-history__delta"
                    iconLeft={<TrendIcon size={12} />}
                  >
                    {delta.text}
                  </Badge>
                </div>
              );
            })}
          </Card>
        )}
      </section>

      {otherAbilities.length > 0 && (
        <section className="skill-detail-section">
          <div className="skill-detail-section__head skill-detail-section__head--row">
            <h2>Kỹ năng khác</h2>
            <Link className="skill-detail-section__link" to="/app/progress/skills">
              Tất cả kỹ năng
              <ChevronRight size={14} />
            </Link>
          </div>
          <Card padding="none" className="skill-detail-others">
            {visibleOtherAbilities.map((row) => {
              const otherId = normalizeSkillId(row.skillId);
              const otherTheta = Number(row.theta ?? 0);
              return (
                <Link
                  key={row.id || otherId}
                  to={`/app/progress/skills/${otherId}`}
                  className="skill-detail-others__row"
                >
                  <span className="skill-detail-others__name">
                    {getSkillDisplayName(nameById, otherId, row.name)}
                  </span>
                  <span className="skill-detail-others__theta">
                    {formatScaledThetaValue(otherTheta)} / 4
                  </span>
                  <span className="skill-detail-others__level">
                    {getAbilityLevel(otherTheta).label}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              );
            })}
          </Card>
        </section>
      )}
    </div>
  );
}
