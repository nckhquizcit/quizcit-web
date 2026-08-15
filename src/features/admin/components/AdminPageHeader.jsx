import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminPageHeader({
  breadcrumb = [],
  title,
  subtitle,
  backHref,
  backLabel = "Quay lại",
  onBack,
  action,
  icon,
}) {
  const crumbs = Array.isArray(breadcrumb) ? breadcrumb.filter(Boolean) : [];

  return (
    <header className="admin-header admin-page-header">
      {crumbs.length > 0 && (
        <nav className="admin-breadcrumb" aria-label="Điều hướng">
          <ol>
            {crumbs.map((item, index) => {
              const isLast = index === crumbs.length - 1;
              const label = typeof item === "string" ? item : item.label;
              const href = typeof item === "string" ? "" : item.href;

              return (
                <li key={`${label}-${index}`}>
                  {href && !isLast ? <Link to={href}>{label}</Link> : <span>{label}</span>}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="header-main">
        <div className="header-left">
          {backHref ? (
            <Link className="back-btn" to={backHref}>
              <ArrowLeft size={16} />
              {backLabel}
            </Link>
          ) : (
            onBack && (
              <button className="back-btn" onClick={onBack} type="button">
                <ArrowLeft size={16} />
                {backLabel}
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
    </header>
  );
}
