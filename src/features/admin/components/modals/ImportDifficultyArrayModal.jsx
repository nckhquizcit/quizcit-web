import { useState, useMemo } from "react";
import { AlertCircle, CheckCircle2, SlidersHorizontal, Trash2 } from "lucide-react";

import Modal from "../ui/Modal";
import { parseDifficultyArray } from "../../utils/difficultyLevels";

export default function ImportDifficultyArrayModal({
  open,
  onClose,
  onApply,
  questionCount = 0,
}) {
  const [inputValue, setInputValue] = useState("");

  const parseResult = useMemo(() => parseDifficultyArray(inputValue), [inputValue]);
  const { values, invalidTokens, isValid } = parseResult;

  const handleApply = () => {
    if (!values.length || !isValid) return;
    onApply?.(values);
    onClose?.();
  };

  const handleSetExample = () => {
    setInputValue("[1, 1.05, 2, 3, -2]");
  };

  const handleClear = () => {
    setInputValue("");
  };

  return (
    <Modal open={open} onClose={onClose} containerClassName="admin-modal-md difficulty-array-modal">
      <div className="adm2-section-heading" style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="question-import-header__icon" style={{ display: "inline-flex", padding: 8, borderRadius: 8, background: "#ecfdf5", color: "#047857" }}>
            <SlidersHorizontal size={20} />
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Nhập mảng độ khó (Theta)</h3>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
              Gán giá trị độ khó hàng loạt cho các câu hỏi theo thứ tự.
            </p>
          </div>
        </div>
      </div>

      <div className="modal-body" style={{ padding: "16px 24px" }}>
        <div className="adm2-note adm2-note--muted" style={{ marginBottom: 14 }}>
          Hỗ trợ định dạng JSON mảng số như <code>[1, 1.05, 2, 3, -2]</code>, hoặc các số phân cách bằng dấu phẩy, khoảng trắng, xuống dòng.
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
            Mảng độ khó ({questionCount} câu hỏi hiện có)
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="adm2-link-arrow"
              onClick={handleSetExample}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#0284c7" }}
            >
              Dán mẫu [1, 1.05, 2, 3, -2]
            </button>
            {inputValue && (
              <button
                type="button"
                className="adm2-link-arrow"
                onClick={handleClear}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444" }}
              >
                <Trash2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 2 }} />
                Xóa
              </button>
            )}
          </div>
        </div>

        <textarea
          className="adm2-mono-textarea"
          style={{ width: "100%", minHeight: 110, fontFamily: "monospace", fontSize: 13 }}
          placeholder="Ví dụ: [1, 1.05, 2, 3, -2] hoặc 1, 1.05, 2, 3, -2"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />

        {inputValue.trim() && (
          <div style={{ marginTop: 12 }}>
            {invalidTokens.length > 0 && (
              <div className="modal-inline-error" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>
                  Giá trị không hợp lệ: <strong>{invalidTokens.slice(0, 5).join(", ")}</strong>
                  {invalidTokens.length > 5 ? "..." : ""} (chỉ chấp nhận số thực hoặc số nguyên).
                </span>
              </div>
            )}

            {isValid && (
              <>
                {values.length === questionCount && (
                  <div className="modal-inline-success" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <span>
                      Đã nhận diện <strong>{values.length}</strong> giá trị độ khó (khớp chính xác với {questionCount} câu hỏi).
                    </span>
                  </div>
                )}
                {values.length < questionCount && (
                  <div className="modal-inline-warning" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>
                      Đã nhận diện <strong>{values.length}</strong> giá trị độ khó cho <strong>{questionCount}</strong> câu hỏi. {questionCount - values.length} câu còn lại sẽ giữ nguyên.
                    </span>
                  </div>
                )}
                {values.length > questionCount && (
                  <div className="modal-inline-warning" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>
                      Đã nhận diện <strong>{values.length}</strong> giá trị (nhiều hơn {questionCount} câu hỏi). Chỉ {questionCount} giá trị đầu tiên sẽ được áp dụng.
                    </span>
                  </div>
                )}

                <div style={{ marginTop: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>
                    Xem trước phân bổ giá trị:
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      maxHeight: 120,
                      overflowY: "auto",
                      padding: 8,
                      borderRadius: 8,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {values.map((val, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          background: idx < questionCount ? "#ecfdf5" : "#f1f5f9",
                          color: idx < questionCount ? "#047857" : "#94a3b8",
                          border: idx < questionCount ? "1px solid #a7f3d0" : "1px dashed #cbd5e1",
                        }}
                      >
                        <strong style={{ fontSize: 11, color: "#64748b" }}>Câu {idx + 1}:</strong>
                        <span>{val > 0 ? `+${val}` : val}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ padding: "14px 24px" }}>
        <button className="cancel-btn" type="button" onClick={onClose}>
          Hủy
        </button>
        <button
          className="add-btn"
          type="button"
          disabled={!values.length || !isValid}
          onClick={handleApply}
        >
          Áp dụng {values.length ? `(${Math.min(values.length, questionCount)} câu)` : ""}
        </button>
      </div>
    </Modal>
  );
}
