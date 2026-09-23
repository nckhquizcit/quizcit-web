import { useEffect, useState, useMemo } from "react";
import Skeleton from "../../../components/ui/Skeleton/Skeleton";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { adminDashboardService } from "../services/dashboardService";
import { getErrorMessage } from "../../../services/apiClient";
import "./QuestionPerformanceList.css";

export default function QuestionPerformanceList() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [x, setX] = useState(70);
  const [y, setY] = useState(10);
  
  const [showPreview, setShowPreview] = useState(false);
  const [previewList, setPreviewList] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  
  const [sortConfig, setSortConfig] = useState({ key: "totalEligible", direction: "desc" });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminDashboardService.getQuestionPerformanceStats();
      setStats(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách thống kê."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSort = (key) => {
    let direction = "desc";
    if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const filteredStats = useMemo(() => {
    return stats.filter(s => s.correctRate > x || s.incorrectRate > x);
  }, [stats, x]);

  const sortedStats = useMemo(() => {
    return [...filteredStats].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredStats, sortConfig]);

  const totalPages = Math.ceil(sortedStats.length / itemsPerPage);
  
  // Reset to page 1 if data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [x, sortedStats.length]);

  const paginatedStats = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedStats.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedStats, currentPage]);

  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError("");
      setShowPreview(true);
      const data = await adminDashboardService.getDifficultyTuningPreview(x, y);
      setPreviewList(Array.isArray(data) ? data : []);
    } catch (err) {
      setPreviewError(getErrorMessage(err, "Không thể tải preview."));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApply = async () => {
    const confirm1 = window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn cập nhật độ khó cho toàn bộ câu hỏi trong danh sách này không?");
    if (!confirm1) return;
    
    const confirm2 = window.confirm("CẢNH BÁO LẦN 2: Hành động này sẽ thay đổi thông số độ khó của hệ thống làm bài thích ứng và không thể hoàn tác. Bạn VẪN TIẾP TỤC?");
    if (!confirm2) return;

    try {
      setPreviewLoading(true);
      await adminDashboardService.applyDifficultyTuning(x, y);
      alert("Cập nhật độ khó thành công!");
      setShowPreview(false);
      loadStats();
    } catch (err) {
      alert("Có lỗi xảy ra: " + getErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="perf-list-container">
      <div className="perf-form">
        <div className="perf-form-group">
          <label>Tỷ lệ X (%)</label>
          <input type="number" min="1" max="100" value={x} onChange={e => setX(Number(e.target.value))} />
          <span className="perf-hint">Ngưỡng % làm đúng/sai để kích hoạt cập nhật</span>
        </div>
        <div className="perf-form-group">
          <label>Mức điều chỉnh Y (%)</label>
          <input type="number" min="1" max="100" value={y} onChange={e => setY(Number(e.target.value))} />
          <span className="perf-hint">Tỷ lệ giảm/tăng độ khó nếu đạt ngưỡng X</span>
        </div>
        <div className="perf-form-actions">
          <button className="perf-btn perf-btn-primary" onClick={handlePreview}>
            Xem trước thay đổi
          </button>
        </div>
      </div>

      <div className="perf-table-wrapper">
        {loading ? (
          <Skeleton height={200} />
        ) : error ? (
          <ErrorState description={error} onRetry={loadStats} />
        ) : (
          <>
            <table className="perf-table">
              <thead>
                <tr>
                  <th>Câu hỏi (Trích đoạn)</th>
                  <th>Môn học</th>
                  <th onClick={() => handleSort("difficultyB")}>Độ khó (b)</th>
                  <th onClick={() => handleSort("totalEligible")}>Số lượt hợp lệ</th>
                  <th onClick={() => handleSort("correctCount")}>Đúng</th>
                  <th onClick={() => handleSort("incorrectCount")}>Sai</th>
                  <th onClick={() => handleSort("correctRate")}>Tỷ lệ đúng (%)</th>
                  <th onClick={() => handleSort("incorrectRate")}>Tỷ lệ sai (%)</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStats.length === 0 && (
                  <tr><td colSpan="8" style={{textAlign:"center", padding:"20px"}}>Không có dữ liệu hợp lệ vượt ngưỡng X</td></tr>
                )}
                {paginatedStats.map(s => (
                  <tr key={s.questionId}>
                    <td title={s.content}>
                      <div style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.content}
                      </div>
                    </td>
                    <td>{s.subjectName}</td>
                    <td>{s.difficultyB.toFixed(2)}</td>
                    <td>{s.totalEligible}</td>
                    <td>{s.correctCount}</td>
                    <td>{s.incorrectCount}</td>
                    <td style={{color: s.correctRate > x ? "#10b981" : "inherit"}}>{s.correctRate.toFixed(1)}%</td>
                    <td style={{color: s.incorrectRate > x ? "#ef4444" : "inherit"}}>{s.incorrectRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="perf-pagination">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="perf-btn"
                >
                  Trước
                </button>
                <span>Trang {currentPage} / {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="perf-btn"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showPreview && (
        <div className="perf-modal-overlay">
          <div className="perf-modal">
            <div className="perf-modal-header">
              <h3>Danh sách câu hỏi sẽ bị ảnh hưởng (Preview)</h3>
              <button onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className="perf-modal-body">
              {previewLoading ? (
                <Skeleton height={150} />
              ) : previewError ? (
                <ErrorState description={previewError} />
              ) : previewList.length === 0 ? (
                <div style={{textAlign: "center", padding: "20px"}}>Không có câu hỏi nào đạt ngưỡng để cập nhật.</div>
              ) : (
                <table className="perf-table">
                  <thead>
                    <tr>
                      <th>Câu hỏi</th>
                      <th>Độ khó hiện tại (b)</th>
                      <th>Độ khó mới (Sau cập nhật)</th>
                      <th>Lý do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewList.map(s => (
                      <tr key={s.questionId}>
                        <td>
                          <div style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {s.content}
                          </div>
                        </td>
                        <td>{s.difficultyB.toFixed(2)}</td>
                        <td style={{fontWeight:"bold", color:"#3b82f6"}}>{s.newDifficulty?.toFixed(2)}</td>
                        <td>
                          {s.correctRate > x ? `Đúng ${s.correctRate.toFixed(1)}% > ${x}%` : `Sai ${s.incorrectRate.toFixed(1)}% > ${x}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="perf-modal-footer">
              <span style={{fontSize:"13px", color:"#64748b"}}>Số lượng: {previewList.length} câu</span>
              <div style={{display:"flex", gap:"10px"}}>
                <button className="perf-btn" onClick={() => setShowPreview(false)}>Hủy</button>
                <button 
                  className="perf-btn perf-btn-danger" 
                  onClick={handleApply}
                  disabled={previewList.length === 0 || previewLoading}
                >
                  Thực hiện Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
