import { ArrowLeft } from "lucide-react";

export default function AdminPageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  action,
  icon,
}) {
  return (
    <div className="admin-header">
      {/* ===== HEADER MAIN ===== */}
      <div className="header-main">
        <div className="header-left">
          {backHref ? (
            <a className="back-btn" href={backHref}>
              <ArrowLeft size={16} />
              Quay lại
            </a>
          ) : (
            onBack && (
            <button className="back-btn" onClick={onBack} type="button">
              <ArrowLeft size={16} />
              Quay lại
            </button>
            )
          )}

          {icon && <div className="header-icon">{icon}</div>}

          <div className="header-text">
            <h1 className="header-title">{title}</h1>
            {subtitle && <p className="header-subtitle">{subtitle}</p>}
          </div>
        </div>

        {action && <div className="header-action">{action}</div>}
      </div>
    </div>
  );
}
