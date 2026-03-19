import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminPageHeader({
  breadcrumb = [],
  title,
  subtitle,
  onBack,
  action,
  icon,
}) {
  // map route cho breadcrumb
  const routeMap = {
    "Tổng quan": "/admin/dashboard",
    "Môn học": "/admin/subjects",
    Chương: "/admin/subjects",
  };

  return (
    <div className="admin-header">
      {/* ===== BREADCRUMB ===== */}
      <div className="breadcrumb">
        {breadcrumb.map((item, index) => {
          const isLast = index === breadcrumb.length - 1;
          const path = routeMap[item];

          return (
            <span key={index} className="breadcrumb-item">
              {!isLast && path ? (
                <Link to={path}>{item}</Link>
              ) : (
                <span className="current">{item}</span>
              )}

              {!isLast && <span className="separator">›</span>}
            </span>
          );
        })}
      </div>

      {/* ===== HEADER MAIN ===== */}
      <div className="header-main">
        <div className="header-left">
          {onBack && (
            <button className="back-btn" onClick={onBack}>
              <ArrowLeft size={16} />
              Quay lại
            </button>
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
