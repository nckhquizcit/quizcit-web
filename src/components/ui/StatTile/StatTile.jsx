/* StatTile dùng chung: ô thống kê "con số + nhãn".
   API: <StatTile value label icon={<Icon/>} note tone="default|success|warning|danger" /> */
import "./StatTile.css";

export default function StatTile({
  value,
  label,
  icon = null,
  note = null,
  tone = "default",
}) {
  return (
    <div className={`ui-stat-tile ui-stat-tile--${tone}`}>
      {icon && <span className="ui-stat-tile__icon">{icon}</span>}
      <div className="ui-stat-tile__content">
        <strong className="ui-stat-tile__value">{value}</strong>
        <span className="ui-stat-tile__label">{label}</span>
        {note && <span className="ui-stat-tile__note">{note}</span>}
      </div>
    </div>
  );
}
