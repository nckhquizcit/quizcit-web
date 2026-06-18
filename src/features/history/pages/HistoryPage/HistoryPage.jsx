import { useEffect, useMemo, useState } from "react";
import HistoryCard from "../../components/HistoryCard/HistoryCard";
import { getUserAttempts } from "../../../../services/quizService";
import "./HistoryPage.css";

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState([]);
  const user = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      const attempts = (await getUserAttempts(user.userId)) || [];
      setHistoryData(
        attempts.map((attempt) => ({
          id: attempt.attemptId,
          title: `Quiz ${attempt.quizId}`,
          date: "-",
          questionCount: attempt.totalQuestion,
          score: Math.round((attempt.rawScore || 0) * attempt.totalQuestion),
          totalQuestions: attempt.totalQuestion,
          powerIndex: Math.round((attempt.overallTheta || 0) * 100),
          percentage: Math.round((attempt.rawScore || 0) * 100),
        })),
      );
    };
    load();
  }, [user?.userId]);

  return (
    <div className="history-page-wrapper">
      <div className="history-page-header">
        <h1 className="history-title">Lịch sử làm bài</h1>
        <p className="history-subtitle">
          Xem lại các bài kiểm tra đã hoàn thành
        </p>
      </div>

      <div className="history-list">
        {historyData.map((item) => (
          <HistoryCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}
