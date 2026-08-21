import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";

export default function SkillImportPreview({
  rows = [],
  onChangeRow,
  onRemoveRow,
  disabled = false,
}) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", description: "" });

  if (!rows.length) {
    return (
      <div className="skill-import-empty">
        <AlertCircle size={32} className="skill-import-empty__icon" />
        <strong>Chưa có dữ liệu xem trước</strong>
        <span>Vui lòng tải lên file CSV hoặc dán nội dung và nhấn &ldquo;Phân tích dữ liệu&rdquo;.</span>
      </div>
    );
  }

  const validCount = rows.filter((r) => !r.errors?.length).length;
  const errorCount = rows.filter((r) => r.errors?.length > 0).length;
  const warningCount = rows.filter((r) => r.warnings?.length > 0 && !r.errors?.length).length;

  const handleStartEdit = (row) => {
    setEditingRowId(row.id);
    setEditFormData({
      name: row.name || "",
      description: row.description || "",
    });
  };

  const handleSaveEdit = (rowId) => {
    onChangeRow?.(rowId, {
      name: editFormData.name.trim(),
      description: editFormData.description.trim(),
    });
    setEditingRowId(null);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
  };

  const filteredRows = rows
    .map((row, originalIndex) => ({ row, originalIndex }))
    .filter(({ row }) => {
      if (filter === "valid") return !row.errors?.length;
      if (filter === "errors") return row.errors?.length > 0;
      if (filter === "warnings") return row.warnings?.length > 0;
      return true;
    })
    .filter(({ row }) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        row.name.toLowerCase().includes(q) ||
        (row.description || "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="skill-import-preview-wrapper">
      <div className="skill-import-preview-toolbar">
        <div className="skill-import-preview-filters" role="tablist" aria-label="Bộ lọc xem trước">
          <button
            type="button"
            className={`skill-import-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tất cả ({rows.length})
          </button>
          <button
            type="button"
            className={`skill-import-filter-btn ok ${filter === "valid" ? "active" : ""}`}
            onClick={() => setFilter("valid")}
          >
            <CheckCircle2 size={14} />
            Hợp lệ ({validCount})
          </button>
          {errorCount > 0 && (
            <button
              type="button"
              className={`skill-import-filter-btn error ${filter === "errors" ? "active" : ""}`}
              onClick={() => setFilter("errors")}
            >
              <AlertCircle size={14} />
              Có lỗi ({errorCount})
            </button>
          )}
          {warningCount > 0 && (
            <button
              type="button"
              className={`skill-import-filter-btn warn ${filter === "warnings" ? "active" : ""}`}
              onClick={() => setFilter("warnings")}
            >
              <AlertTriangle size={14} />
              Cảnh báo ({warningCount})
            </button>
          )}
        </div>

        <div className="skill-import-search-box">
          <Search size={15} className="skill-import-search-icon" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mô tả kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled}
          />
          {searchQuery && (
            <button
              type="button"
              className="skill-import-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Xóa tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="skill-import-table-container">
        <table className="skill-import-table">
          <thead>
            <tr>
              <th style={{ width: 50, textAlign: "center" }}>STT</th>
              <th style={{ width: "32%" }}>Tên kỹ năng</th>
              <th>Mô tả</th>
              <th style={{ width: 170 }}>Trạng thái</th>
              <th style={{ width: 90, textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="skill-import-table-empty">
                  Không tìm thấy dòng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredRows.map(({ row, originalIndex }) => {
                const isEditing = editingRowId === row.id;
                const hasErrors = row.errors?.length > 0;
                const hasWarnings = row.warnings?.length > 0;

                return (
                  <tr
                    key={row.id}
                    className={`skill-import-row ${hasErrors ? "has-error" : ""} ${
                      hasWarnings && !hasErrors ? "has-warning" : ""
                    }`}
                  >
                    <td className="skill-import-col-index">
                      <span className="bank-question-index">
                        {String(originalIndex + 1).padStart(2, "0")}
                      </span>
                    </td>

                    <td className="skill-import-col-name">
                      {isEditing ? (
                        <input
                          type="text"
                          className="skill-import-inline-input"
                          value={editFormData.name}
                          maxLength={200}
                          placeholder="Nhập tên kỹ năng..."
                          onChange={(e) =>
                            setEditFormData((prev) => ({ ...prev, name: e.target.value }))
                          }
                          autoFocus
                        />
                      ) : (
                        <div className="skill-import-name-text">
                          <strong>{row.name || "(Chưa có tên)"}</strong>
                        </div>
                      )}
                    </td>

                    <td className="skill-import-col-desc">
                      {isEditing ? (
                        <textarea
                          className="skill-import-inline-textarea"
                          rows={2}
                          value={editFormData.description}
                          maxLength={2000}
                          placeholder="Mô tả kỹ năng (tùy chọn)..."
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <div className="skill-import-desc-text">
                          {row.description ? (
                            <span>{row.description}</span>
                          ) : (
                            <span className="skill-import-desc-empty">Chưa có mô tả</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="skill-import-col-status">
                      {hasErrors ? (
                        <div className="skill-status-pill error" title={row.errors.join("; ")}>
                          <AlertCircle size={13} />
                          <span>{row.errors[0]}</span>
                        </div>
                      ) : hasWarnings ? (
                        <div className="skill-status-pill warn" title={row.warnings.join("; ")}>
                          <AlertTriangle size={13} />
                          <span>{row.warnings[0]}</span>
                        </div>
                      ) : (
                        <div className="skill-status-pill ok">
                          <CheckCircle2 size={13} />
                          <span>Hợp lệ</span>
                        </div>
                      )}
                    </td>

                    <td className="skill-import-col-actions">
                      {isEditing ? (
                        <div className="skill-import-action-buttons">
                          <button
                            type="button"
                            className="skill-action-btn ok"
                            title="Lưu thay đổi"
                            onClick={() => handleSaveEdit(row.id)}
                            disabled={disabled}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            className="skill-action-btn cancel"
                            title="Hủy sửa"
                            onClick={handleCancelEdit}
                            disabled={disabled}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="skill-import-action-buttons">
                          <button
                            type="button"
                            className="skill-action-btn edit"
                            title="Chỉnh sửa dòng này"
                            onClick={() => handleStartEdit(row)}
                            disabled={disabled}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="skill-action-btn delete"
                            title="Xóa dòng khỏi danh sách import"
                            onClick={() => onRemoveRow?.(row.id)}
                            disabled={disabled}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
