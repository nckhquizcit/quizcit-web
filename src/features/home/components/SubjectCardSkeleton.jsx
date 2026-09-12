import { Skeleton } from "../../../components/ui";
import "./SubjectCardSkeleton.css";

/**
 * Khung xương cho card môn học ở trang chủ.
 * Mô phỏng đúng thứ tự khối của card thật (ảnh 16:9 → badge → tiêu đề → meta → link)
 * để chiều cao trang không nhảy khi dữ liệu về.
 */
export default function SubjectCardSkeleton() {
  return (
    <div className="ui-card home-subject-card subject-card-skeleton" aria-hidden="true">
      <Skeleton className="subject-card-skeleton__cover" height="auto" radius="var(--radius-md)" />
      <Skeleton height={20} width="38%" radius="var(--radius-pill)" />
      <Skeleton height={18} width="80%" />
      <Skeleton height={14} width="65%" />
      <Skeleton className="subject-card-skeleton__link" height={14} width="45%" />
    </div>
  );
}
