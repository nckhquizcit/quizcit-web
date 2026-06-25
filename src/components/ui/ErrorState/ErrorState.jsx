import { AlertTriangle } from "lucide-react";
import Button from "../Button/Button";
import "./ErrorState.css";

export default function ErrorState({
  title = "Đã có lỗi xảy ra",
  description = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry = null,
  retryLabel = "Thử lại",
  className = "",
}) {
  return (
    <div className={`ui-error ${className}`}>
      <div className="ui-error__icon">
        <AlertTriangle size={28} />
      </div>
      <h3 className="ui-error__title">{title}</h3>
      {description && <p className="ui-error__desc">{description}</p>}
      {onRetry && (
        <Button variant="primary" onClick={onRetry} className="ui-error__btn">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
