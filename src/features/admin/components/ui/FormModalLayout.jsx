export default function FormModalLayout({
  title,
  subtitle,
  infoBox,
  children,
  actions,
}) {
  return (
    <div className="form-modal">
      {/* ===== HEADER ===== */}
      <div className="form-header">
        <h2>{title}</h2>
        {subtitle && <p className="form-sub">{subtitle}</p>}
      </div>

      {/* ===== INFO BOX ===== */}
      {infoBox && <div className="form-info">{infoBox}</div>}

      {/* ===== BODY ===== */}
      <div className="form-body">{children}</div>

      {/* ===== ACTIONS ===== */}
      <div className="form-actions">{actions}</div>
    </div>
  );
}
