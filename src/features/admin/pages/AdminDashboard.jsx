import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  FileQuestion,
  GraduationCap,
  ListChecks,
  Plus,
  Upload,
  Users,
} from "lucide-react";
import AdminPageHeader from "../components/AdminPageHeader";
import Skeleton from "../../../components/ui/Skeleton/Skeleton";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import "../Admin.css";
import "./AdminDashboard.css";
import { adminDashboardService } from "../services/dashboardService";

const emptyStats = {
  totalUsers: 0,
  totalSubjects: 0,
  totalQuestions: 0,
  totalQuizzes: 0,
};

const statCards = [
  {
    key: "totalUsers",
    label: "Người dùng",
    icon: <Users size={22} />,
    tone: "info",
    to: "/admin/users",
  },
  {
    key: "totalSubjects",
    label: "Môn học",
    icon: <BookOpen size={22} />,
    tone: "primary",
    to: "/admin/subjects",
  },
  {
    key: "totalQuestions",
    label: "Câu hỏi",
    icon: <FileQuestion size={22} />,
    tone: "warning",
    to: "/admin/questions",
  },
  {
    key: "totalQuizzes",
    label: "Đề thi",
    icon: <GraduationCap size={22} />,
    tone: "success",
    to: "/admin/quizzes",
  },
];

const quickActions = [
  { label: "Tạo đề thi", icon: <Plus size={18} />, to: "/admin/quizzes" },
  { label: "Import câu hỏi", icon: <Upload size={18} />, to: "/admin/questions" },
  { label: "Thêm môn học", icon: <BookOpen size={18} />, to: "/admin/subjects" },
  { label: "Quản lý câu hỏi", icon: <ListChecks size={18} />, to: "/admin/questions" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const numberFormatter = useMemo(() => new Intl.NumberFormat("vi-VN"), []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminDashboardService.getStats();
      setStats({ ...emptyStats, ...data });
    } catch (loadError) {
      console.error("Failed to load admin dashboard stats:", loadError);
      setError("Không thể tải thống kê hệ thống.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="admin-dashboard">
      <AdminPageHeader
        breadcrumb={["Tổng quan"]}
        title="Tổng quan hệ thống"
        subtitle="Theo dõi dữ liệu cốt lõi và đi nhanh tới tác vụ quản trị."
      />

      {error ? (
        <ErrorState description={error} onRetry={loadStats} />
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((card) => (
              <Link className={`stat-card stat-card--${card.tone}`} to={card.to} key={card.key}>
                <div className="stat-card__icon">{card.icon}</div>
                <div className="stat-card__body">
                  <div className="stat-card__value">
                    {loading ? (
                      <Skeleton height={28} width="60%" />
                    ) : (
                      numberFormatter.format(stats[card.key] ?? 0)
                    )}
                  </div>
                  <div className="stat-card__label">{card.label}</div>
                </div>
                <ArrowRight size={16} className="stat-card__arrow" />
              </Link>
            ))}
          </div>

          <section className="adm2-card adm2-card-pad dashboard-section">
            <h2 className="dashboard-section__title">Thao tác nhanh</h2>
            <div className="quick-actions">
              {quickActions.map((action) => (
                <Link className="quick-action" to={action.to} key={action.label}>
                  <span className="quick-action__icon">{action.icon}</span>
                  <span className="quick-action__label">{action.label}</span>
                  <ArrowRight size={16} className="quick-action__arrow" />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
