import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, FileUp, Upload } from "lucide-react";

import QuestionImportPreview from "../QuestionImportPreview";
import Modal from "../ui/Modal";
import { getSkills } from "../../services/skillService";
import { getErrorMessage } from "../../../../services/apiClient";
import { getChaptersBySubject } from "../../../../services/contentService";
import {
  compactImportKey,
  detectCsvImport,
  parseQuestionImport,
  validateQuestionImportRow,
} from "../../utils/questionImportParser";
import { downloadQuestionImportTemplate } from "../../utils/questionImportTemplate";

const SUPPORTED_FILE_EXTENSIONS = [".txt", ".csv"];

const normalizeId = (value) => (value === undefined || value === null ? "" : String(value));

const getSubjectId = (subject) => subject?.subjectId ?? subject?.id;

const getChapterId = (chapter) => chapter?.chapterId ?? chapter?.id;

const getChapterSubjectId = (chapter) =>
  chapter?.subjectId ?? chapter?.subject?.subjectId ?? chapter?.subject?.id;

const getSkillId = (skill) => skill?.skillId ?? skill?.id;

const getSkillName = (skill) => skill?.name || skill?.skillName || "Kỹ năng chưa đặt tên";

const normalizeSubject = (subject) => ({
  ...subject,
  subjectId: normalizeId(getSubjectId(subject)),
});

const normalizeChapter = (chapter, fallbackSubjectId = "") => ({
  ...chapter,
  chapterId: normalizeId(getChapterId(chapter)),
  subjectId: normalizeId(getChapterSubjectId(chapter) || fallbackSubjectId),
});

const normalizeSkill = (skill) => ({
  ...skill,
  skillId: normalizeId(getSkillId(skill)),
  name: getSkillName(skill),
});

const formatWeight = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "";
  return String(Number(numberValue.toFixed(6)));
};

const equalSkillWeight = (count) => (count > 0 ? formatWeight(1 / count) : "");

const ensureSinglePrimarySkill = (skills = []) => {
  if (!skills.length) return [];

  const primaryIndex = skills.findIndex((skill) => skill.primary);
  const safePrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return skills.map((skill, index) => ({
    ...skill,
    primary: index === safePrimaryIndex,
  }));
};

const findByIdOrName = (items = [], ref = "", idKey) => {
  const normalizedRef = normalizeId(ref).trim();
  const compactRef = compactImportKey(normalizedRef);

  if (!normalizedRef) return null;

  return (
    items.find((item) => normalizeId(item[idKey]) === normalizedRef || normalizeId(item.id) === normalizedRef) ||
    items.find((item) => compactImportKey(item.name) === compactRef || compactImportKey(item.skillName) === compactRef)
  );
};

const getDifficultyValue = (difficulty) => {
  if (difficulty === "Easy") return -1;
  if (difficulty === "Hard") return 1;
  return 0;
};

const getSupportedExtension = (filename = "") => {
  const lowerFilename = filename.toLowerCase();
  return SUPPORTED_FILE_EXTENSIONS.find((extension) => lowerFilename.endsWith(extension)) || "";
};

const toImportPayload = (row) => ({
  subjectId: row.subjectId,
  chapterId: row.chapterId,
  content: row.content.trim(),
  explanation: row.explanation?.trim() || "",
  difficultyB: getDifficultyValue(row.difficulty),
  skills: (row.skills || []).map((skill) => ({
    skillId: skill.skillId,
    weight: Number(skill.weight),
    primary: Boolean(skill.primary),
  })),
  options: (row.options || [])
    .filter((option) => option.content?.trim())
    .map((option) => ({
      content: option.content.trim(),
      corrected: row.correctKey === option.key,
    })),
});

export default function ImportQuestionsModal({
  open,
  onClose,
  subjects = [],
  chapters = [],
  subject,
  chapter,
  onSubmit,
}) {
  const normalizedSubjects = useMemo(() => subjects.map(normalizeSubject), [subjects]);
  const normalizedInitialChapters = useMemo(
    () => chapters.map((item) => normalizeChapter(item, normalizeId(getSubjectId(subject)))),
    [chapters, subject],
  );
  const [activeTab, setActiveTab] = useState("text");
  const [sourceText, setSourceText] = useState("");
  const [sourceType, setSourceType] = useState("auto");
  const [sourceName, setSourceName] = useState("");
  const [rows, setRows] = useState([]);
  const [parseMessage, setParseMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [defaultSubjectId, setDefaultSubjectId] = useState("");
  const [defaultChapterId, setDefaultChapterId] = useState("");
  const [defaultDifficulty, setDefaultDifficulty] = useState("Medium");
  const [availableChapters, setAvailableChapters] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const allPreviewChapters = useMemo(() => {
    const byId = new Map();
    [...normalizedInitialChapters, ...availableChapters].forEach((item) => {
      if (item?.chapterId) {
        byId.set(item.chapterId, item);
      }
    });
    return [...byId.values()];
  }, [availableChapters, normalizedInitialChapters]);

  const resolveImportedRow = useCallback((row) => {
    const mappingErrors = [];
    let subjectId = defaultSubjectId;
    let chapterId = defaultChapterId;

    if (row.subjectId) {
      const matchedSubject = findByIdOrName(normalizedSubjects, row.subjectId, "subjectId");
      if (matchedSubject) {
        subjectId = matchedSubject.subjectId;
      } else {
        mappingErrors.push(`Không map được môn học "${row.subjectId}".`);
        subjectId = "";
      }
    }

    if (row.chapterId) {
      const chapterCandidates = subjectId
        ? allPreviewChapters.filter((item) => item.subjectId === subjectId)
        : allPreviewChapters;
      const matchedChapter =
        findByIdOrName(chapterCandidates, row.chapterId, "chapterId") ||
        findByIdOrName(allPreviewChapters, row.chapterId, "chapterId");

      if (matchedChapter && (!subjectId || matchedChapter.subjectId === subjectId)) {
        chapterId = matchedChapter.chapterId;
      } else {
        mappingErrors.push(`Không map được chương "${row.chapterId}".`);
        chapterId = "";
      }
    }

    const selectedChapter = allPreviewChapters.find((item) => item.chapterId === chapterId);
    if (subjectId && selectedChapter && selectedChapter.subjectId !== subjectId) {
      mappingErrors.push("Chương đã chọn không thuộc môn học của dòng này.");
    }

    const sourceSkills = row.skills || [];
    const equalWeight = equalSkillWeight(sourceSkills.length);
    const hasPrimary = sourceSkills.some((skill) => skill.primary);
    const resolvedSkills = sourceSkills.map((skill, index) => {
      const matchedSkill = findByIdOrName(availableSkills, skill.skillId || skill.name, "skillId");

      if (!matchedSkill) {
        mappingErrors.push(`Không map được kỹ năng "${skill.name || skill.skillId || "không rõ"}".`);
      }

      return {
        skillId: matchedSkill?.skillId || "",
        name: matchedSkill?.name || skill.name || skill.skillId || "Kỹ năng không rõ",
        weight: skill.weight === "" || skill.weight === undefined ? equalWeight : String(skill.weight),
        primary: hasPrimary ? Boolean(skill.primary) : index === 0,
      };
    });

    return {
      ...row,
      subjectId,
      chapterId,
      difficulty: row.difficulty || defaultDifficulty,
      skills: ensureSinglePrimarySkill(resolvedSkills),
      mappingErrors,
      serverError: "",
    };
  }, [
    allPreviewChapters,
    availableSkills,
    defaultChapterId,
    defaultDifficulty,
    defaultSubjectId,
    normalizedSubjects,
  ]);

  const validateRows = useCallback((nextRows) =>
    nextRows.map((row) => {
      const validation = validateQuestionImportRow(row, {
        requireSubject: true,
        requireChapter: true,
      });

      return {
        ...row,
        errors: row.serverError ? [...validation.errors, row.serverError] : validation.errors,
        warnings: validation.warnings,
      };
    }), []);

  const updateRowsWithDefaults = useCallback((partial) => {
    setRows((currentRows) =>
      validateRows(
        currentRows.map((row) =>
          resolveImportedRow({
            ...row,
            ...partial,
            mappingErrors: [],
            serverError: "",
          }),
        ),
      ),
    );
  }, [resolveImportedRow, validateRows]);

  useEffect(() => {
    if (!open) return;

    const fallbackSubjectId = normalizeId(getSubjectId(subject) || getSubjectId(normalizedSubjects[0]));
    const fallbackChapters = normalizedInitialChapters.filter(
      (item) => !fallbackSubjectId || item.subjectId === fallbackSubjectId,
    );
    const fallbackChapterId = normalizeId(getChapterId(chapter) || getChapterId(fallbackChapters[0]));

    setActiveTab("text");
    setSourceText("");
    setSourceType("auto");
    setSourceName("");
    setRows([]);
    setParseMessage("");
    setFormError("");
    setFileLoading(false);
    setSubmitting(false);
    setSaveProgress(null);
    setSaveResult(null);
    setDefaultSubjectId(fallbackSubjectId);
    setDefaultChapterId(fallbackChapterId);
    setDefaultDifficulty("Medium");
  }, [chapter, normalizedInitialChapters, normalizedSubjects, open, subject]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadSkills = async () => {
      try {
        const skillData = await getSkills();
        if (!cancelled) {
          setAvailableSkills((skillData || []).map(normalizeSkill));
        }
      } catch {
        if (!cancelled) {
          setAvailableSkills([]);
        }
      }
    };

    loadSkills();

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !defaultSubjectId) {
      setAvailableChapters([]);
      setDefaultChapterId("");
      return;
    }

    let cancelled = false;

    const fallbackChapters = normalizedInitialChapters.filter(
      (item) => item.subjectId === defaultSubjectId,
    );

    const loadChapters = async () => {
      setLoadingChapters(true);
      try {
        const chapterData = await getChaptersBySubject(defaultSubjectId);
        if (cancelled) return;

        const normalizedChapters = (chapterData || []).map((item) =>
          normalizeChapter(item, defaultSubjectId),
        );
        const nextChapters = normalizedChapters.length ? normalizedChapters : fallbackChapters;

        setAvailableChapters(nextChapters);
        setDefaultChapterId((currentChapterId) => {
          const hasCurrent = nextChapters.some((item) => item.chapterId === currentChapterId);
          return hasCurrent ? currentChapterId : normalizeId(nextChapters[0]?.chapterId);
        });
      } catch {
        if (!cancelled) {
          setAvailableChapters(fallbackChapters);
          setDefaultChapterId((currentChapterId) => {
            const hasCurrent = fallbackChapters.some((item) => item.chapterId === currentChapterId);
            return hasCurrent ? currentChapterId : normalizeId(fallbackChapters[0]?.chapterId);
          });
        }
      } finally {
        if (!cancelled) {
          setLoadingChapters(false);
        }
      }
    };

    loadChapters();

    return () => {
      cancelled = true;
    };
  }, [defaultSubjectId, normalizedInitialChapters, open]);

  useEffect(() => {
    if (!rows.length) return;

    updateRowsWithDefaults({
      subjectId: defaultSubjectId,
      chapterId: defaultChapterId,
    });
  }, [defaultChapterId, defaultSubjectId, rows.length, updateRowsWithDefaults]);

  const handleClose = () => {
    if (submitting) return;

    if (rows.length > 0 && !saveResult) {
      const confirmed = window.confirm("Bạn có dữ liệu import chưa lưu. Đóng modal sẽ mất phần preview hiện tại.");
      if (!confirmed) return;
    }

    onClose?.();
  };

  const handleParse = () => {
    const text = sourceText.trim();

    setFormError("");
    setSaveResult(null);
    setSaveProgress(null);

    if (!text) {
      setRows([]);
      setParseMessage("");
      setFormError("Vui lòng dán nội dung hoặc tải file trước khi parse.");
      return;
    }

    const effectiveSourceType = sourceType === "auto" ? (detectCsvImport(text) ? "csv" : "text") : sourceType;
    const parsedRows = parseQuestionImport(text, sourceType);
    const rowsWithDefaults = parsedRows.map((row) => resolveImportedRow(row));

    setRows(validateRows(rowsWithDefaults));
    setParseMessage(
      parsedRows.length
        ? `Đã parse ${parsedRows.length} câu hỏi dạng ${effectiveSourceType.toUpperCase()} từ ${sourceName || "nội dung đã nhập"}.`
        : "Không tìm thấy câu hỏi nào theo format hỗ trợ.",
    );
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = getSupportedExtension(file.name);
    setFormError("");
    setSaveResult(null);
    setSaveProgress(null);

    if (!extension) {
      setSourceText("");
      setSourceName(file.name);
      setRows([]);
      setParseMessage("");
      setFormError("Hiện chỉ hỗ trợ file .txt và .csv. XLSX, DOCX, PDF/OCR chưa hỗ trợ trong lượt này.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    setFileLoading(true);
    setSourceName(file.name);
    setSourceType(extension === ".csv" ? "csv" : "text");

    reader.onload = () => {
      setSourceText(String(reader.result || ""));
      setParseMessage(`Đã đọc file ${file.name}. Bấm Parse dữ liệu để xem trước.`);
      setFileLoading(false);
      event.target.value = "";
    };

    reader.onerror = () => {
      setSourceText("");
      setFormError("Không thể đọc file. Vui lòng thử lại với file .txt hoặc .csv khác.");
      setFileLoading(false);
      event.target.value = "";
    };

    reader.readAsText(file, "utf-8");
  };

  const handleSubjectChange = (nextSubjectId) => {
    setDefaultSubjectId(nextSubjectId);
    setDefaultChapterId("");
    updateRowsWithDefaults({
      subjectId: nextSubjectId,
      chapterId: "",
    });
  };

  const handleChapterChange = (nextChapterId) => {
    setDefaultChapterId(nextChapterId);
    updateRowsWithDefaults({ chapterId: nextChapterId });
  };

  const handleDifficultyChange = (nextDifficulty) => {
    setDefaultDifficulty(nextDifficulty);
    updateRowsWithDefaults({ difficulty: nextDifficulty });
  };

  const handleChangeRow = (rowId, partial) => {
    setSaveResult(null);
    setRows((currentRows) =>
      validateRows(
        currentRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                ...partial,
                mappingErrors: partial.skills ? [] : row.mappingErrors,
                serverError: "",
              }
            : row,
        ),
      ),
    );
  };

  const handleRemoveRow = (rowId) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
    setSaveResult(null);
  };

  const handleSubmit = async () => {
    const nextRows = validateRows(rows);
    const invalidCount = nextRows.filter((row) => row.errors?.length > 0).length;
    const validRows = nextRows.filter((row) => !row.errors?.length);

    setRows(nextRows);
    setFormError("");
    setSaveResult(null);

    if (!validRows.length) {
      setFormError("Không có câu hỏi hợp lệ để lưu. Vui lòng sửa lỗi trong preview.");
      return;
    }

    if (invalidCount > 0) {
      const confirmed = window.confirm(
        `${invalidCount} câu đang lỗi sẽ bị bỏ qua. Bạn có muốn lưu ${validRows.length} câu hợp lệ không?`,
      );
      if (!confirmed) return;
    }

    const importItems = validRows.map((row, index) => ({
      clientId: row.id,
      index: index + 1,
      payload: toImportPayload(row),
    }));

    try {
      setSubmitting(true);
      setSaveProgress({
        total: importItems.length,
        completed: 0,
        success: 0,
        failed: 0,
      });

      const result = await onSubmit?.(importItems, setSaveProgress);
      const failedIds = new Set((result?.errors || []).map((error) => error.clientId));

      setSaveResult(
        result || {
          successCount: 0,
          failureCount: importItems.length,
          errors: [],
        },
      );

      setRows((currentRows) =>
        validateRows(
          currentRows
            .map((row) => {
              const matchedError = (result?.errors || []).find((error) => error.clientId === row.id);
              return matchedError
                ? {
                    ...row,
                    serverError: matchedError.message,
                  }
                : row;
            })
            .filter((row) => row.errors?.length > 0 || failedIds.has(row.id)),
        ),
      );
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể import câu hỏi. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  const validCount = rows.filter((row) => !row.errors?.length).length;
  const invalidCount = rows.length - validCount;

  return (
    <Modal open={open} onClose={handleClose} containerClassName="import-questions-modal-shell">
      <div className="question-import-modal">
        <div className="question-form-header">
          <div>
            <h2>Import câu hỏi</h2>
            <p>Dán nội dung hoặc tải file để tạo nhanh nhiều câu hỏi cho ngân hàng câu hỏi.</p>
          </div>
        </div>

        <div className="question-import-tabs">
          <button
            type="button"
            className={activeTab === "text" ? "active" : ""}
            onClick={() => setActiveTab("text")}
          >
            <FileText size={16} />
            Dán text
          </button>
          <button
            type="button"
            className={activeTab === "file" ? "active" : ""}
            onClick={() => setActiveTab("file")}
          >
            <FileUp size={16} />
            Upload file
          </button>
          <button
            type="button"
            className={activeTab === "template" ? "active" : ""}
            onClick={() => setActiveTab("template")}
          >
            <Download size={16} />
            File mẫu
          </button>
        </div>

        <div className="question-import-defaults">
          <label className="form-field">
            <span>Môn học mặc định *</span>
            <select value={defaultSubjectId} onChange={(event) => handleSubjectChange(event.target.value)}>
              <option value="">Chọn môn học</option>
              {normalizedSubjects.map((item) => (
                <option value={item.subjectId} key={item.subjectId}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Chương mặc định *</span>
            <select
              value={defaultChapterId}
              onChange={(event) => handleChapterChange(event.target.value)}
              disabled={!defaultSubjectId || loadingChapters}
            >
              <option value="">{loadingChapters ? "Đang tải chương..." : "Chọn chương"}</option>
              {availableChapters.map((item) => (
                <option value={item.chapterId} key={item.chapterId}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Độ khó mặc định</span>
            <select value={defaultDifficulty} onChange={(event) => handleDifficultyChange(event.target.value)}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>
        </div>

        {activeTab === "text" && (
          <div className="question-import-source">
            <label className="form-field">
              <span>Kiểu nội dung</span>
              <select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                <option value="auto">Tự nhận diện TXT/CSV</option>
                <option value="text">Dán văn bản thường</option>
                <option value="csv">Dán CSV</option>
              </select>
            </label>
            <label className="form-field full">
              <span>Nội dung câu hỏi</span>
              <textarea
                value={sourceText}
                placeholder="TXT: Câu 1..., A. ..., B. ..., Đáp án: A. CSV: Câu hỏi,A,B,C,D,Đáp án,..."
                onChange={(event) => {
                  setSourceText(event.target.value);
                  setSourceName("");
                }}
              />
            </label>
            <button type="button" className="add-btn" onClick={handleParse}>
              Parse dữ liệu
            </button>
          </div>
        )}

        {activeTab === "file" && (
          <div className="question-import-source">
            <div className="quiz-import-zone question-import-file-zone">
              <Upload size={42} />
              <strong>Upload file câu hỏi</strong>
              <span>Hỗ trợ .txt và .csv. XLSX, DOCX, PDF/OCR chưa hỗ trợ.</span>
              <label>
                <FileUp size={18} />
                Chọn file
                <input type="file" accept=".txt,.csv" onChange={handleFileChange} />
              </label>
              {sourceName && <em>File đã chọn: {sourceName}</em>}
              {fileLoading && <em>Đang đọc file...</em>}
            </div>
            <button type="button" className="add-btn" onClick={handleParse} disabled={fileLoading || !sourceText}>
              Parse dữ liệu
            </button>
          </div>
        )}

        {activeTab === "template" && (
          <div className="question-import-template">
            <div>
              <strong>Tải file mẫu</strong>
              <span>CSV phù hợp khi soạn bằng Excel/Google Sheets, TXT phù hợp khi copy từ tài liệu thường.</span>
            </div>
            <div className="question-import-template-actions">
              <button type="button" className="add-btn" onClick={() => downloadQuestionImportTemplate("csv")}>
                <Download size={16} />
                Tải CSV mẫu
              </button>
              <button type="button" className="cancel-btn" onClick={() => downloadQuestionImportTemplate("txt")}>
                <Download size={16} />
                Tải TXT mẫu
              </button>
            </div>
          </div>
        )}

        {parseMessage && <div className="question-import-note">{parseMessage}</div>}
        {formError && <div className="modal-inline-error">{formError}</div>}

        <div className="question-import-summary">
          <span>Tổng: {rows.length}</span>
          <span>Hợp lệ: {validCount}</span>
          <span>Cần sửa: {invalidCount}</span>
        </div>

        <QuestionImportPreview
          rows={rows}
          subjects={normalizedSubjects}
          chapters={allPreviewChapters}
          skills={availableSkills}
          onChangeRow={handleChangeRow}
          onRemoveRow={handleRemoveRow}
          disabled={submitting}
        />

        {saveProgress && (
          <div className="question-import-progress">
            <div>
              <strong>
                Đã lưu {saveProgress.completed}/{saveProgress.total} câu
              </strong>
              <span>
                Thành công: {saveProgress.success} · Lỗi: {saveProgress.failed}
              </span>
            </div>
            <progress value={saveProgress.completed} max={saveProgress.total || 1} />
          </div>
        )}

        {saveResult && (
          <div className={saveResult.failureCount ? "question-import-result has-error" : "question-import-result"}>
            <strong>
              Đã lưu thành công {saveResult.successCount} câu, lỗi {saveResult.failureCount} câu.
            </strong>
            {saveResult.errors?.length > 0 && (
              <ul>
                {saveResult.errors.map((error) => (
                  <li key={`${error.clientId}-${error.index}`}>
                    Câu {error.index}: {error.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="question-modal-actions">
          <button className="cancel-btn" type="button" onClick={handleClose} disabled={submitting}>
            Đóng
          </button>
          <button className="add-btn" type="button" onClick={handleSubmit} disabled={submitting || !validCount}>
            {submitting ? "Đang lưu..." : "Lưu câu hỏi"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
