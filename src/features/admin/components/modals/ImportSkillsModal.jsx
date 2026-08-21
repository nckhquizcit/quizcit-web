import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import Modal from "../ui/Modal";
import SkillImportPreview from "../SkillImportPreview";
import {
  parseSkillImport,
  summarizeSkillImport,
  validateSkillRows,
} from "../../utils/skillImportParser";
import { downloadSkillImportTemplate } from "../../utils/skillImportTemplate";
import { createSkillsBulk } from "../../services/skillService";
import { getErrorMessage } from "../../../../services/apiClient";
import { useToast } from "../../../../components/ui/Toast/Toast";
import "./ImportSkillsModal.css";

const SUPPORTED_EXTENSIONS = [".csv", ".txt", ".tsv"];

export default function ImportSkillsModal({
  open,
  onClose,
  existingSkills = [],
  onImportSuccess,
}) {
  const titleId = useId();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("file");
  const [sourceText, setSourceText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  const [rows, setRows] = useState([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [parseMessage, setParseMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [allowPartialSave, setAllowPartialSave] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);
  const [saveResult, setSaveResult] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    setActiveTab("file");
    setSourceText("");
    setFileName("");
    setIsDragging(false);
    setFileLoading(false);
    setRows([]);
    setHasParsed(false);
    setParseMessage("");
    setFormError("");
    setAllowPartialSave(false);
    setSubmitting(false);
    setSaveProgress(null);
    setSaveResult(null);
  }, [open]);

  const summary = useMemo(() => summarizeSkillImport(rows), [rows]);

  const handleFileChange = (file) => {
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isSupported = SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    setFormError("");
    setSaveResult(null);
    setSaveProgress(null);

    if (!isSupported) {
      setFormError("Hệ thống chỉ hỗ trợ file .csv, .txt hoặc .tsv.");
      return;
    }

    setFileLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || "");
      setSourceText(content);
      setFileLoading(false);

      // Auto-parse on file upload for seamless experience
      try {
        const parsed = parseSkillImport(content, { existingSkills });
        setRows(parsed);
        setHasParsed(true);
        const stats = summarizeSkillImport(parsed);
        setParseMessage(
          `Đã đọc file: ${file.name} (${stats.total} kỹ năng: ${stats.validCount} hợp lệ${
            stats.invalidCount > 0 ? `, ${stats.invalidCount} có lỗi` : ""
          }).`
        );
      } catch (err) {
        setFormError(err.message || "Không thể đọc dữ liệu từ file.");
      }
    };

    reader.onerror = () => {
      setFormError("Không thể đọc file. Vui lòng thử lại.");
      setFileLoading(false);
    };

    reader.readAsText(file, "utf-8");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleParse = () => {
    const text = sourceText.trim();
    setFormError("");
    setSaveResult(null);
    setSaveProgress(null);

    if (!text) {
      setFormError("Vui lòng tải file hoặc dán nội dung CSV trước khi phân tích.");
      return;
    }

    try {
      const parsed = parseSkillImport(text, { existingSkills });
      if (!parsed.length) {
        setFormError("Không tìm thấy dòng dữ liệu nào theo định dạng hỗ trợ.");
        return;
      }

      setRows(parsed);
      setHasParsed(true);
      const stats = summarizeSkillImport(parsed);
      setParseMessage(
        `Đã phân tích ${stats.total} kỹ năng: ${stats.validCount} hợp lệ${
          stats.invalidCount > 0 ? `, ${stats.invalidCount} có lỗi cần sửa` : ""
        }.`
      );
    } catch (err) {
      setFormError(err.message || "Không thể phân tích dữ liệu CSV.");
    }
  };

  const handleChangeRow = useCallback((rowId, partial) => {
    setSaveResult(null);
    setRows((currentRows) => {
      const nextRows = currentRows.map((row) =>
        row.id === rowId ? { ...row, ...partial, serverError: "" } : row
      );
      return validateSkillRows(nextRows, { existingSkills });
    });
  }, [existingSkills]);

  const handleRemoveRow = useCallback((rowId) => {
    setSaveResult(null);
    setRows((currentRows) => {
      const nextRows = currentRows.filter((row) => row.id !== rowId);
      return validateSkillRows(nextRows, { existingSkills });
    });
  }, [existingSkills]);

  const handleReset = () => {
    setSourceText("");
    setFileName("");
    setRows([]);
    setHasParsed(false);
    setParseMessage("");
    setFormError("");
    setSaveResult(null);
    setSaveProgress(null);
  };

  const handleSubmit = async () => {
    const nextRows = validateSkillRows(rows, { existingSkills });
    const validRows = nextRows.filter((row) => !row.errors?.length);
    const invalidCount = nextRows.length - validRows.length;

    setRows(nextRows);
    setFormError("");
    setSaveResult(null);

    if (!validRows.length) {
      setFormError("Không có kỹ năng hợp lệ nào để lưu. Vui lòng sửa các lỗi trong bảng xem trước.");
      return;
    }

    if (invalidCount > 0 && !allowPartialSave) {
      setFormError(
        "Có một số dòng bị lỗi. Vui lòng sửa hết lỗi hoặc tích chọn 'Chỉ import các dòng hợp lệ'."
      );
      return;
    }

    setSubmitting(true);
    setSaveProgress({
      total: validRows.length,
      completed: 0,
      success: 0,
      failed: 0,
    });

    const errors = [];
    let successCount = 0;
    const batchSize = 500;

    try {
      for (let offset = 0; offset < validRows.length; offset += batchSize) {
        const batch = validRows.slice(offset, offset + batchSize);
        const result = await createSkillsBulk(batch);

        const batchSuccess = result?.data?.successCount ?? result?.successCount ?? 0;
        successCount += batchSuccess;

        const failedItems = (result?.data?.items || result?.items || []).filter(
          (item) => !item.success
        );

        failedItems.forEach((item) => {
          errors.push({
            clientId: item.clientId,
            message: item.message || "Không thể tạo kỹ năng này.",
          });
        });

        setSaveProgress({
          total: validRows.length,
          completed: Math.min(offset + batch.length, validRows.length),
          success: successCount,
          failed: errors.length,
        });
      }

      setSaveResult({
        successCount,
        failureCount: errors.length,
        errors,
      });

      if (errors.length === 0) {
        toast.success(`Import thành công ${successCount} kỹ năng!`);
        onImportSuccess?.();
        onClose?.();
      } else {
        // Mark server errors on corresponding rows
        const errorMap = new Map(errors.map((e) => [e.clientId, e.message]));
        setRows((currentRows) =>
          currentRows.map((row) => ({
            ...row,
            serverError: errorMap.get(row.id) || "",
            errors: errorMap.has(row.id)
              ? [...row.errors, errorMap.get(row.id)]
              : row.errors,
          }))
        );

        if (successCount > 0) {
          toast.info(`Đã import thành công ${successCount} kỹ năng (${errors.length} lỗi).`);
          onImportSuccess?.();
        }
      }
    } catch (err) {
      setFormError(getErrorMessage(err, "Đã xảy ra lỗi khi gửi dữ liệu lên máy chủ."));
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid =
    rows.length > 0 &&
    (summary.invalidCount === 0 || (allowPartialSave && summary.validCount > 0));

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      labelledById={titleId}
      containerClassName="import-skills-modal-container"
    >
      <div className="import-skills-modal">
        {/* Header */}
        <div className="import-skills-header">
          <div className="import-skills-header__info">
            <span className="import-skills-header__icon">
              <Brain size={22} />
            </span>
            <div>
              <h2 id={titleId} className="import-skills-header__title">
                Import nhanh kỹ năng từ CSV
              </h2>
              <p className="import-skills-header__subtitle">
                Tải file mẫu, điền tên và mô tả, xem trước và kiểm tra trước khi lưu.
              </p>
            </div>
          </div>

          <div className="import-skills-header__actions">
            <button
              type="button"
              className="import-skills-template-btn"
              onClick={() => downloadSkillImportTemplate()}
              title="Tải về file CSV mẫu"
            >
              <Download size={15} />
              Tải file mẫu CSV
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="import-skills-body">
          {formError && (
            <div className="modal-inline-error">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Step 1: Input source */}
          <div className="import-skills-source-card">
            <div className="import-skills-source-tabs" role="tablist">
              <button
                type="button"
                className={`import-skills-tab-btn ${activeTab === "file" ? "active" : ""}`}
                onClick={() => setActiveTab("file")}
              >
                <FileUp size={15} />
                Tải file CSV (.csv, .txt)
              </button>
              <button
                type="button"
                className={`import-skills-tab-btn ${activeTab === "text" ? "active" : ""}`}
                onClick={() => setActiveTab("text")}
              >
                <FileText size={15} />
                Dán nội dung CSV
              </button>
            </div>

            {activeTab === "file" ? (
              fileName ? (
                <div className="import-skills-file-selected">
                  <div className="import-skills-file-selected__info">
                    <FileSpreadsheet size={18} />
                    <span>{fileName}</span>
                  </div>
                  <button
                    type="button"
                    className="import-skills-file-selected__remove"
                    onClick={() => {
                      setFileName("");
                      setSourceText("");
                    }}
                    title="Xóa file đã chọn"
                    disabled={submitting}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className={`import-skills-dropzone ${isDragging ? "dragging" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    disabled={submitting || fileLoading}
                  />
                  <Upload size={28} className="import-skills-dropzone__icon" />
                  <span className="import-skills-dropzone__title">
                    {fileLoading ? "Đang đọc file..." : "Kéo thả file CSV vào đây hoặc bấm để chọn file"}
                  </span>
                  <span className="import-skills-dropzone__subtitle">
                    Hỗ trợ định dạng .csv, .txt, .tsv (mã hóa UTF-8)
                  </span>
                </div>
              )
            ) : (
              <textarea
                className="import-skills-textarea"
                rows={5}
                placeholder="Dán nội dung CSV hoặc văn bản tại đây...&#10;Ví dụ:&#10;Tên kỹ năng,Mô tả&#10;Giải phương trình bậc hai,Kỹ năng giải và biện luận&#10;Đạo hàm hàm hợp,Tính đạo hàm các hàm hợp"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                disabled={submitting}
              />
            )}

            <div className="import-skills-source-bar">
              <span className="import-skills-source-guide">
                Cột 1: <strong>Tên kỹ năng</strong> (bắt buộc, &le;200 ký tự) · Cột 2:{" "}
                <strong>Mô tả</strong> (&le;2000 ký tự)
              </span>

              <button
                type="button"
                className="import-skills-parse-btn"
                onClick={handleParse}
                disabled={!sourceText.trim() || submitting || fileLoading}
              >
                <Sparkles size={15} />
                Phân tích &amp; Xem trước
              </button>
            </div>

            {parseMessage && (
              <div className="question-import-note" style={{ marginTop: 4 }}>
                {parseMessage}
              </div>
            )}
          </div>

          {/* Step 2: Preview & Validation Table */}
          {hasParsed && (
            <div className="import-skills-preview-card">
              <div className="import-skills-preview-header">
                <div className="import-skills-preview-title">
                  <span>Bảng xem trước &amp; kiểm tra lỗi ({rows.length} kỹ năng)</span>
                </div>
              </div>

              <SkillImportPreview
                rows={rows}
                onChangeRow={handleChangeRow}
                onRemoveRow={handleRemoveRow}
                disabled={submitting}
              />

              {summary.invalidCount > 0 && (
                <div className="import-skills-options-bar">
                  <label className="import-skills-partial-toggle">
                    <input
                      type="checkbox"
                      checked={allowPartialSave}
                      onChange={(e) => setAllowPartialSave(e.target.checked)}
                      disabled={submitting}
                    />
                    <span>
                      Chỉ import các dòng hợp lệ (bỏ qua {summary.invalidCount} dòng có lỗi)
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Progress bar */}
          {saveProgress && (
            <div className="import-skills-progress">
              <div className="import-skills-progress__meta">
                <span>Đang lưu kỹ năng vào hệ thống...</span>
                <span>
                  {saveProgress.completed} / {saveProgress.total} (Thành công: {saveProgress.success}, Thất bại: {saveProgress.failed})
                </span>
              </div>
              <div className="import-skills-progress__bar">
                <div
                  className="import-skills-progress__fill"
                  style={{
                    width: `${Math.round(
                      (saveProgress.completed / Math.max(saveProgress.total, 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Result summary banner */}
          {saveResult && saveResult.failureCount > 0 && (
            <div className="import-skills-result partial">
              <AlertCircle size={18} />
              <span>
                Đã import thành công {saveResult.successCount} kỹ năng. Còn {saveResult.failureCount} dòng bị lỗi, bạn có thể chỉnh sửa trực tiếp ở bảng phía trên rồi bấm lưu lại.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="import-skills-footer">
          <div className="import-skills-footer__left">
            {hasParsed && (
              <button
                type="button"
                className="cancel-btn"
                onClick={handleReset}
                disabled={submitting}
              >
                <RotateCcw size={14} style={{ marginRight: 4 }} />
                Làm mới
              </button>
            )}
          </div>

          <div className="import-skills-footer__right">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </button>

            <button
              type="button"
              className="add-btn"
              onClick={handleSubmit}
              disabled={!isFormValid || submitting}
            >
              <CheckCircle2 size={16} />
              {submitting
                ? "Đang import..."
                : `Xác nhận import (${
                    allowPartialSave ? summary.validCount : rows.length
                  } kỹ năng)`}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
