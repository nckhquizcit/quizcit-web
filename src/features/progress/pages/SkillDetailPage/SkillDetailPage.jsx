import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  StatTile,
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

const shortTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatShortTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : shortTimeFormatter.format(date);
}

/* Nhãn trục X: ngày; khi nhiều điểm trùng ngày thì kèm giờ để phân biệt. */
function buildChartPoints(histories) {
  const dayCounts = new Map();
  histories.forEach((item) => {
    const day = formatShortDate(item.createdAt);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  });

  return histories.map((item) => {
    const value = Number(item.thetaScaled ?? 0);
    const day = formatShortDate(item.createdAt);
    const time = formatShortTime(item.createdAt);
    const duplicatedDay = (dayCounts.get(day) || 0) > 1;
    return {
      value,
      label: duplicatedDay && time ? `${day} ${time}` : day,
      aria: `${time ? `${time} ` : ""}${day} — năng lực ${value.toFixed(2)}/4`,
    };
  });
}

export default function SkillDetailPage() {
  const { skillId } = useParams();
  const [abilities, setAbilities] = useState([]);
  const [skills, setSkills] = useState([]);
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);
  const loadIdRef = useRef(0);

  // Tách phần tải dữ liệu thành hàm gọi lại được: effect ban đầu và nút "Thử lại" dùng chung.
  const loadSkillDetail = useCallback(async () => {
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
      const [abilityRows, skillRows, historyRows] = await Promise.allSettled([
        getUserSkillAbilities(user.userId),
        getSkills(),
        getAbilityHistoriesBySkill(user.userId, skillId),
      ]);

      if (!isCurrent()) return;

      if (abilityRows.status === "rejected" && historyRows.status === "rejected") {
        setError(getErrorMessage(abilityRows.reason, LOAD_ERROR_MESSAGE));
        return;
      }

      setAbilities(abilityRows.status === "fulfilled" ? abilityRows.value : []);
      setSkills(skillRows.status === "fulfilled" ? skillRows.value : []);
      setHistories(historyRows.status === "fulfilled" ? historyRows.value || [] : []);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [user?.userId, skillId]);

  useEffect(() => {
    loadSkillDetail();
    return () => {
      loadIdRef.current += 1;
    };
  }, [loadSkillDetail]);

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
  const latestHistoryFallback = ascendingHistories.at(-1);
  const skillName = getSkillDisplayName(
    nameById,
    currentSkillId,
    ability?.name || latestHistoryFallback?.name || latestHistoryFallback?.skillName,
  );
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
        <ErrorState description={error} onRetry={loadSkillDetail} />
      </div>
    );
  }

  if (!ability && ascendingHistories.length === 0) {
    return (
      <div className="skill-detail-page">
        {backLink}
        <EmptyState
          title={`Chưa có dữ liệu cho ${skillName}`}
          description="Hoàn thành một bài kiểm tra có kỹ năng này để hệ thống ghi nhận năng lực."
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
  const chartPoints = buildChartPoints(ascendingHistories);
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
          ariaLabel={`Năng lực ${formatScaledThetaValue(thetaRaw)} trên 4, mức ${level.label}`}
        />
      </Card>

      <div className="skill-detail-stats">
        <StatTile value={formatScaledThetaValue(thetaRaw)} label="Năng lực hiện tại" />
        <StatTile
          tone={
            latestDelta.trend === "up"
              ? "success"
              : latestDelta.trend === "down"
                ? "danger"
                : "default"
          }
          value={
            <span className="skill-detail-stats__trend">
              <LatestTrendIcon size={18} />
              {latestDelta.text}
            </span>
          }
          label="Thay đổi gần nhất"
        />
        <StatTile value={peakScaled.toFixed(2)} label="Mức cao nhất" />
        <StatTile
          value={
            <span className="skill-detail-stats__datetime">
              {formatSubmittedAt(lastUpdatedAt)}
            </span>
          }
          label="Cập nhật lần cuối"
        />
      </div>

      <Card padding="lg" className="skill-detail-chart-card">
        <div className="skill-detail-section__head">
          <h2>Diễn biến năng lực</h2>
          <p>{ascendingHistories.length} lần cập nhật, theo thang 0–4.</p>
        </div>
        {chartPoints.length < 2 ? (
          <p className="skill-detail-muted">
            Cần ít nhất hai lần cập nhật để vẽ biểu đồ diễn biến.
          </p>
        ) : (
          <ThetaTrendChart
            points={chartPoints}
            ariaLabel={`Diễn biến năng lực của kỹ năng ${skillName}`}
          />
        )}
      </Card>

      <section className="skill-detail-section">
        <div className="skill-detail-section__head">
          <h2>Lịch sử cập nhật</h2>
          <p>Năng lực được lưu sau bài kiểm tra và sau từng nhóm 5 câu thích ứng.</p>
        </div>
        {descendingHistories.length === 0 ? (
          <p className="skill-detail-muted">Chưa có lịch sử cập nhật cho kỹ năng này.</p>
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
                  <span
                    className="skill-detail-history__theta"
                    title="Năng lực"
                    aria-label={`Năng lực ${formatScaledThetaValue(item.theta)} trên 4`}
                  >
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
