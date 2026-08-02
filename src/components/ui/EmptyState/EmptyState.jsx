import { Inbox } from "lucide-react";
import "./EmptyState.css";

export default function EmptyState({
  icon = null,
  title = "Chưa có dữ liệu",
  description = "",
  action = null,
  className = "",
}) {
  return (
    <div className={`ui-empty ${className}`}>
      <div className="ui-empty__icon">{icon ?? <Inbox size={28} />}</div>
      <h3 className="ui-empty__title">{title}</h3>
      {description && <p className="ui-empty__desc">{description}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  );
}
