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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import QuestionPerformanceList from "./QuestionPerformanceList";

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

function SubjectThetaTrendChart({ subjectId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(3);
  const [customMonths, setCustomMonths] = useState("");

  useEffect(() => {
    if (!subjectId) return;
    let isMounted = true;
    setLoading(true);
    adminDashboardService
      .getSubjectThetaTrendOverTime(subjectId, months)
      .then((res) => {
        if (isMounted) {
          setData(Array.isArray(res) ? res : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load time series trend:", err);
        if (isMounted) {
          setData([]);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [subjectId, months]);

  const handleCustomMonthsApply = () => {
    const parsed = parseInt(customMonths, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
      setMonths(parsed);
    } else {
      alert("Vui lòng nhập số tháng hợp lệ (1-12)");
    }
  };

  return (
    <div className="trend-chart-container">
      <div className="trend-chart-controls" style={{ display: "flex", gap: "12px", marginBottom: "16px", alignItems: "center" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Thời gian:</span>
        <button
          onClick={() => setMonths(1)}
          style={{
            padding: "6px 12px",
            border: "1px solid #10b981",
            borderRadius: "6px",
            background: months === 1 ? "#10b981" : "#fff",
            color: months === 1 ? "#fff" : "#10b981",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            transition: "all 0.2s"
          }}
        >
          1 tháng
        </button>
        <button
          onClick={() => setMonths(3)}
          style={{
            padding: "6px 12px",
            border: "1px solid #10b981",
            borderRadius: "6px",
            background: months === 3 ? "#10b981" : "#fff",
            color: months === 3 ? "#fff" : "#10b981",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            transition: "all 0.2s"
          }}
        >
          3 tháng
        </button>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>Tùy chỉnh (tháng):</span>
          <input
            type="number"
            min="1"
            max="12"
            value={customMonths}
            onChange={(e) => setCustomMonths(e.target.value)}
            placeholder="VD: 6"
            style={{ 
              width: "80px", 
              padding: "6px 10px", 
              border: "1px solid #cbd5e1", 
              borderRadius: "6px",
              fontSize: "13px",
              outline: "none"
            }}
          />
          <button 
            onClick={handleCustomMonthsApply} 
            style={{
              padding: "6px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              background: "#f8fafc",
              color: "#475569",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              transition: "all 0.2s"
            }}
          >
            Áp dụng
          </button>
        </div>
      </div>

      <div style={{ width: "100%", height: 350 }}>
        {loading ? (
          <Skeleton height={350} width="100%" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="timeLabel" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ stroke: "rgba(0, 0, 0, 0.1)", strokeWidth: 2 }}
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value) => [value.toFixed(4), "Trung bình Theta"]}
              />
              <Line 
                type="monotone" 
                dataKey="averageDeltaTheta" 
                stroke="#3b82f6" 
                strokeWidth={3}
                connectNulls={true}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", color: "#6b7280", paddingTop: 40 }}>
            Chưa có dữ liệu xu hướng trong thời gian này.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [visibleSubjects, setVisibleSubjects] = useState([]);
  const [activeSubjectTab, setActiveSubjectTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const numberFormatter = useMemo(() => new Intl.NumberFormat("vi-VN"), []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [data, subjectsResponse] = await Promise.all([
        adminDashboardService.getStats(),
        adminDashboardService.getVisibleSubjectsForTrends().catch(() => []),
      ]);
      setStats({ ...emptyStats, ...data });
      const subjects = Array.isArray(subjectsResponse) ? subjectsResponse : [];
      setVisibleSubjects(subjects);
      if (subjects.length > 0) {
        setActiveSubjectTab(subjects[0].id);
      }
    } catch (loadError) {
      console.error("Failed to load admin dashboard stats:", loadError);
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
        <h2 className="dashboard-section__title">Xu hướng Theta theo thời gian</h2>
        
        {visibleSubjects.length > 0 ? (
          <div>
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "16px", borderBottom: "1px solid #e5e7eb" }}>
              {visibleSubjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => setActiveSubjectTab(subject.id)}
                  style={{
                    padding: "8px 16px",
                    background: "none",
                    border: "none",
                    borderBottom: activeSubjectTab === subject.id ? "2px solid #3b82f6" : "2px solid transparent",
                    color: activeSubjectTab === subject.id ? "#3b82f6" : "#6b7280",
                    fontWeight: activeSubjectTab === subject.id ? "600" : "400",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {subject.name}
                </button>
              ))}
            </div>
            
            <SubjectThetaTrendChart subjectId={activeSubjectTab} />
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#6b7280", paddingTop: 40, paddingBottom: 40 }}>
            Chưa có môn học nào được mở khóa để hiển thị.
          </div>
        )}
      </section>

      <section className="adm2-card adm2-card-pad dashboard-section" style={{ marginTop: 24 }}>
        <h2 className="dashboard-section__title">Tinh chỉnh độ khó câu hỏi (Tự động)</h2>
        <QuestionPerformanceList />
      </section>

      <section className="adm2-card adm2-card-pad dashboard-section" style={{ marginTop: 24 }}>
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
