import React from "react";
import HistoryCard from "../../components/HistoryCard/HistoryCard";
import "./HistoryPage.css";

export default function HistoryPage() {
  const historyData = [
    {
      id: 1,
      title: "Kiểm tra Mảng cơ bản",
      date: "20/2/2026",
      questionCount: 10,
      score: 7,
      totalQuestions: 10,
      powerIndex: 680,
      percentage: 70,
    },
    {
      id: 2,
      title: "Kiểm tra Mảng cơ bản",
      date: "22/2/2026",
      questionCount: 10,
      score: 8,
      totalQuestions: 10,
      powerIndex: 700,
      percentage: 80,
    },
    {
      id: 3,
      title: "Đề luyện tập Danh sách Liên kết",
      date: "24/2/2026",
      questionCount: 15,
      score: 12,
      totalQuestions: 15,
      powerIndex: 715,
      percentage: 80,
    },
    {
      id: 4,
      title: "Kiểm tra Mảng cơ bản",
      date: "26/2/2026",
      questionCount: 10,
      score: 9,
      totalQuestions: 10,
      powerIndex: 750,
      percentage: 90,
    },
  ];

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
