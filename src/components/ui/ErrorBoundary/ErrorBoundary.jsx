import { Component } from "react";

/*
 * ErrorBoundary — chan loi render cua React.
 *
 * Truoc day du an khong co lop chan nao, nen mot component throw se roi vao
 * errorElement mac dinh cua react-router: trang tieng Anh "Unexpected Application
 * Error!" kem stack trace va duong dan noi bo, thay luon ca cay route (mat ca
 * sidebar lan topbar) va khong co nut nao de quay lai.
 *
 * Component nay co hai tang su dung:
 *  - Tang ngoai cung (src/main.jsx): luoi an toan cuoi, hien fallback tu chua
 *    (inline style) vi luc do CSS co the chua tai kip.
 *  - Tang layout (MainLayout / AuthLayout / AdminLayout): boc quanh <Outlet />,
 *    nho vay sidebar va topbar van con khi mot trang bi loi.
 *
 * Khong bao gio in error.message hay stack ra man hinh.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Ghi log cho lap trinh vien, khong hien ra giao dien.
    console.error("ErrorBoundary bat duoc loi render:", error, errorInfo);
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { renderFallback } = this.props;
    if (typeof renderFallback === "function") {
      return renderFallback({ reload: this.handleReload });
    }

    // Fallback tu chua: khong import CSS, khong dung component khac.
    return (
      <div
        role="alert"
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          color: "#0f172a",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Đã có lỗi xảy ra</h1>
        <p style={{ margin: 0, color: "#64748b" }}>
          Trang này gặp sự cố không mong muốn. Vui lòng tải lại trang để tiếp tục.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            marginTop: "8px",
            padding: "10px 20px",
            border: "none",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
            color: "#ffffff",
            fontSize: "0.95rem",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Tải lại trang
        </button>
      </div>
    );
  }
}
