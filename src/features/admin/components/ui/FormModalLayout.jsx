import { useId } from "react";

export default function FormModalLayout({
  title,
  subtitle,
  infoBox,
  children,
  actions,
  titleId,
}) {
  const generatedId = useId();
  const headingId = titleId || generatedId;

  return (
    <div className="form-modal">
      <div className="form-header">
        <h2 id={headingId}>{title}</h2>
        {subtitle && <p className="form-sub">{subtitle}</p>}
      </div>

      {infoBox && <div className="form-info">{infoBox}</div>}

      <div className="form-body">{children}</div>

      <div className="form-actions">{actions}</div>
    </div>
  );
}
