import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import Skeleton, { SkeletonCard } from "../../../components/ui/Skeleton/Skeleton";

/**
 * Body-only loading/error helper. Keep page header outside this component.
 */
export default function AdminPageState({
  loading = false,
  error = null,
  onRetry = null,
  errorTitle = "Không tải được dữ liệu",
  skeletonLines = 4,
  children,
}) {
  if (error) {
    return (
      <div className="admin-page-state error">
        <ErrorState
          title={errorTitle}
          description={typeof error === "string" ? error : error?.message || "Vui lòng thử lại."}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-page-state" aria-busy="true">
        <SkeletonCard lines={skeletonLines} />
        <Skeleton height={12} width="40%" style={{ marginTop: 12 }} />
      </div>
    );
  }

  return children;
}
