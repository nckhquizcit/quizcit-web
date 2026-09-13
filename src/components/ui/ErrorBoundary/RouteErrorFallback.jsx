import ErrorState from "../ErrorState/ErrorState";

/*
 * Fallback dung o tang layout: giu nguyen sidebar/topbar, chi thay phan noi dung
 * tuyen duong con bang ErrorState co san trong thu vien dung chung.
 * Khong hien error.message hay stack trace.
 */
export default function RouteErrorFallback({ reload }) {
  return (
    <div className="route-error-fallback">
      <ErrorState
        title="Trang này đang gặp sự cố"
        description="Nội dung không hiển thị được. Bạn có thể tải lại trang hoặc chuyển sang mục khác."
        onRetry={reload}
        retryLabel="Tải lại trang"
      />
    </div>
  );
}
