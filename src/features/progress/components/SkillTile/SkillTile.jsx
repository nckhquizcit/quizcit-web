import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import ProgressBar from "../../../home/components/ProgressBar";
import {
  formatScaledThetaValue,
  getAbilityLevel,
  thetaRawToPercent,
} from "../../../../services/mappers";
import "./SkillTile.css";

export default function SkillTile({ skillId, name, description = "", theta = 0 }) {
  const thetaRaw = Number(theta ?? 0);
  const level = getAbilityLevel(thetaRaw);
  const percent = thetaRawToPercent(thetaRaw);

  const content = (
    <>
      <span className="skill-tile__head">
        <span className="skill-tile__name">{name}</span>
        <span className="skill-tile__level">{level.label}</span>
        {skillId && <ChevronRight className="skill-tile__arrow" size={16} aria-hidden="true" />}
      </span>
      {description && <span className="skill-tile__desc">{description}</span>}
      <strong className="skill-tile__theta">
        {formatScaledThetaValue(thetaRaw)}
        <span>/ 4</span>
      </strong>
      <ProgressBar value={percent} />
    </>
  );

  if (!skillId) {
    return <div className="skill-tile skill-tile--static">{content}</div>;
  }

  return (
    <Link
      to={`/app/progress/skills/${skillId}`}
      className="skill-tile"
      title={description || undefined}
      aria-label={`Xem chi tiết kỹ năng ${name}`}
    >
      {content}
    </Link>
  );
}
