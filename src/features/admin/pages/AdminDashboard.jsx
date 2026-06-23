import { useEffect, useMemo, useState } from "react";

import "../Admin.css";
import { adminDashboardService } from "../services/dashboardService";

const emptyStats = {
  totalUsers: 0,
  totalSubjects: 0,
  totalQuestions: 0,
  totalQuizzes: 0,
};

const statCards = [
  { key: "totalUsers", label: "Tổng số người dùng" },
  { key: "totalSubjects", label: "Tổng số môn học" },
  { key: "totalQuestions", label: "Tổng số câu hỏi" },
  { key: "totalQuizzes", label: "Tổng số đề thi" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const numberFormatter = useMemo(() => new Intl.NumberFormat("vi-VN"), []);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        setLoading(true);
        setError("");
        const data = await adminDashboardService.getStats();
        if (isMounted) {
          setStats({ ...emptyStats, ...data });
        }
      } catch (loadError) {
        console.error("Failed to load admin dashboard stats:", loadError);
        if (isMounted) {
          setError("Không thể tải thống kê");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatStat = (value) => {
    if (loading) return "...";
    return numberFormatter.format(value ?? 0);
  };

  return (
    <>
      <h1 className="dashboard-title">Tổng quan</h1>
      <p className="dashboard-sub">Thống kê tổng quan hệ thống QuizCIT</p>
      {error && <p className="dashboard-error">{error}</p>}

      <div className="stats-grid">
        {statCards.map((card) => (
          <div className="stat-card" key={card.key}>
            <div className="stat-title">{card.label}</div>
            <div className="stat-value">{formatStat(stats[card.key])}</div>
          </div>
        ))}
      </div>
    </>
  );
}
