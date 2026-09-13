import { AlertTriangle } from "lucide-react";
import Button from "../Button/Button";
import "./ErrorState.css";

const DEFAULT_DESCRIPTION = "Không thể tải dữ liệu. Vui lòng thử lại.";
const INVALID_DATA_DESCRIPTION = "Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại sau.";
const SERVER_ERROR_DESCRIPTION = "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";

// Thong diep goc cua thu vien goi mang (tieng Anh), khong nen hien cho nguoi dung.
const NETWORK_MESSAGE_PATTERN =
  /request failed with status code|network error|timeout of \d+ms exceeded|failed to fetch|axioserror|is not a function|is not iterable|cannot read prop/i;

// Thân phản hồi là HTML thì khong duoc do nguyen khoi vao phan mo ta.
const HTML_LIKE_PATTERN = /^\s*<(!doctype|html|head|body|\?xml)/i;

/*
 * Loc gia tri mo ta loi truoc khi render.
 *
 * Nguon goc cua chuoi tieng Anh nam o src/services/ (ngoai pham vi lan nay), nen
 * chan ngay tai day - noi phan lon man hinh di qua. Cac truong hop:
 *  - khong phai chuoi (object/array/...) -> React se nem loi render => dung cau mac dinh
 *  - trong nhu HTML -> cau bao du lieu khong hop le
 *  - trong nhu thong diep tieng Anh cua thu vien goi mang -> cau bao may chu su co
 *  - chuoi rong hoac chi co khoang trang -> cau mac dinh
 */
function resolveDescription(description) {
  if (typeof description !== "string") {
    return DEFAULT_DESCRIPTION;
  }
  const trimmed = description.trim();
  if (!trimmed) {
    return DEFAULT_DESCRIPTION;
  }
  if (HTML_LIKE_PATTERN.test(trimmed)) {
    return INVALID_DATA_DESCRIPTION;
  }
  if (NETWORK_MESSAGE_PATTERN.test(trimmed)) {
    return SERVER_ERROR_DESCRIPTION;
  }
  return trimmed;
}

export default function ErrorState({
  title = "Đã có lỗi xảy ra",
  description = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry = null,
  retryLabel = "Thử lại",
  className = "",
}) {
  const safeDescription = resolveDescription(description);

  return (
    <div className={`ui-error ${className}`}>
      <div className="ui-error__icon">
        <AlertTriangle size={28} />
      </div>
      <h3 className="ui-error__title">{title}</h3>
      {safeDescription && <p className="ui-error__desc">{safeDescription}</p>}
      {onRetry && (
        <Button variant="primary" onClick={onRetry} className="ui-error__btn">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
