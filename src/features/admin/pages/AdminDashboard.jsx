import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Brain,
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
import { getErrorMessage, isAccessDenied } from "../../../services/apiClient";
import "../Admin.css";
import "./AdminDashboard.css";
import { adminDashboardService } from "../services/dashboardService";

const emptyStats = {
  totalSubjects: 0,
  totalQuestions: 0,
  totalQuizzes: 0,
  totalSkills: 0,
  totalUsers: 0,
};

const statCards = [
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
  {
    key: "totalSkills",
    label: "Kỹ năng",
    icon: <Brain size={22} />,
    tone: "accent",
    to: "/admin/skills",
  },
  {
    key: "totalUsers",
    label: "Người dùng",
    icon: <Users size={22} />,
    tone: "info",
    to: "/admin/users",
  },
];

const quickActions = [
  { label: "Tạo đề thi", icon: <Plus size={18} />, to: "/admin/quizzes/new" },
  { label: "Import câu hỏi", icon: <Upload size={18} />, to: "/admin/questions/import" },
  { label: "Quản lý môn học", icon: <BookOpen size={18} />, to: "/admin/subjects" },
  { label: "Quản lý câu hỏi", icon: <ListChecks size={18} />, to: "/admin/questions" },
  { label: "Quản lý kỹ năng", icon: <Brain size={18} />, to: "/admin/skills" },
  { label: "Quản lý người dùng", icon: <Users size={18} />, to: "/admin/users" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const numberFormatter = useMemo(() => new Intl.NumberFormat("vi-VN"), []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminDashboardService.getStats();
      setStats({ ...emptyStats, ...data });
    } catch (loadError) {
      console.error("Failed to load admin dashboard stats:", loadError);
      // 403 do bi ha quyen giua phien thi thu lai chac chan lai hong -> khoa nut thu lai.
      setForbidden(isAccessDenied(loadError));
      setError(getErrorMessage(loadError, "Không thể tải thống kê hệ thống."));
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

      <div className="stats-grid">
        {error ? (
          <ErrorState
            className="stats-grid__error"
            description={error}
            onRetry={forbidden ? null : loadStats}
          />
        ) : (
          statCards.map((card) => (
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
          ))
        )}
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
    </div>
  );
}
