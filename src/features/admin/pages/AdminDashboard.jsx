import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
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
    label: "Tổng số người dùng",
    icon: <Users size={22} />,
    tone: "info",
    to: "/admin/users",
  },
  {
    key: "totalSubjects",
    label: "Tổng số môn học",
    icon: <BookOpen size={22} />,
    tone: "primary",
    to: "/admin/subjects",
  },
  {
    key: "totalQuestions",
    label: "Tổng số câu hỏi",
    icon: <FileQuestion size={22} />,
    tone: "warning",
    to: "/admin/questions",
  },
  {
    key: "totalQuizzes",
    label: "Tổng số đề thi",
    icon: <GraduationCap size={22} />,
    tone: "success",
    to: "/admin/quizzes",
  },
];

const quickActions = [
  { label: "Quản lý câu hỏi", icon: <ListChecks size={18} />, to: "/admin/questions" },
  { label: "Tạo đề thi", icon: <Plus size={18} />, to: "/admin/quizzes" },
  { label: "Thêm môn học", icon: <BookOpen size={18} />, to: "/admin/subjects" },
  { label: "Nhập câu hỏi", icon: <Upload size={18} />, to: "/admin/questions" },
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
        title="Tổng quan"
        subtitle="Thống kê tổng quan hệ thống QuizCIT"
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
                  <div className="stat-card__label">{card.label}</div>
                  <div className="stat-card__value">
                    {loading ? (
                      <Skeleton height={28} width="60%" />
                    ) : (
                      numberFormatter.format(stats[card.key] ?? 0)
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <section className="dashboard-section">
            <h2 className="dashboard-section__title">Thao tác nhanh</h2>
            <div className="quick-actions">
              {quickActions.map((action) => (
                <Link className="quick-action" to={action.to} key={action.label}>
                  <span className="quick-action__icon">{action.icon}</span>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
