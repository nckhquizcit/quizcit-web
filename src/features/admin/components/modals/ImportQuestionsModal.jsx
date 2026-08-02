import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, FileUp, ListChecks, Upload } from "lucide-react";

import QuestionImportPreview from "../QuestionImportPreview";
import Modal from "../ui/Modal";
import { getErrorMessage } from "../../../../services/apiClient";
import { getChaptersBySubject } from "../../../../services/contentService";
import {
  compactImportKey,
  detectCsvImport,
  normalizeImportDifficulty,
  parseQuestionImport,
  validateQuestionImportRow,
} from "../../utils/questionImportParser";
import {
  isImportReferenceDataReady,
  selectImportValue,
} from "../../utils/questionImportMapping";
import { getImportSkillsForChapter } from "../../utils/questionImportPreviewLogic";
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

const normalizeSkill = (skill) => ({
  ...skill,
  skillId: normalizeId(getSkillId(skill)),
  name: getSkillName(skill),
});

const normalizeChapter = (chapter, fallbackSubjectId = "") => ({
  ...chapter,
  chapterId: normalizeId(getChapterId(chapter)),
  subjectId: normalizeId(getChapterSubjectId(chapter) || fallbackSubjectId),
  skills: (chapter?.skills || []).map(normalizeSkill),
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
  variant = "modal",
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
  const [placementMode, setPlacementMode] = useState("per-row");
  const [allowPartialSave, setAllowPartialSave] = useState(false);
  const [availableChapters, setAvailableChapters] = useState([]);
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
    const subjectRef = selectImportValue({
      mode: placementMode,
      importedValue: row.importedSubjectId,
      defaultValue: defaultSubjectId,
      manualValue: row.manualSubjectId,
    });
    const chapterRef = selectImportValue({
      mode: placementMode,
      importedValue: row.importedChapterId,
      defaultValue: defaultChapterId,
      manualValue: row.manualChapterId,
    });
    const difficulty = selectImportValue({
      mode: placementMode,
      importedValue: row.importedDifficulty
        ? normalizeImportDifficulty(row.importedDifficulty, defaultDifficulty)
        : "",
      defaultValue: defaultDifficulty,
      manualValue: row.manualDifficulty,
    });
    let subjectId = "";
    let chapterId = "";

    if (subjectRef) {
      const matchedSubject = findByIdOrName(normalizedSubjects, subjectRef, "subjectId");
      if (matchedSubject) {
        subjectId = matchedSubject.subjectId;
      } else {
        mappingErrors.push(`Không map được môn học "${subjectRef}".`);
      }
    }

    if (chapterRef) {
      const chapterCandidates = subjectId
        ? allPreviewChapters.filter((item) => item.subjectId === subjectId)
        : allPreviewChapters;
      const matchedChapter =
        findByIdOrName(chapterCandidates, chapterRef, "chapterId") ||
        findByIdOrName(allPreviewChapters, chapterRef, "chapterId");

      if (matchedChapter && (!subjectId || matchedChapter.subjectId === subjectId)) {
        chapterId = matchedChapter.chapterId;
        subjectId ||= matchedChapter.subjectId;
      } else {
        mappingErrors.push(`Không map được chương "${chapterRef}".`);
      }
    }

    const selectedChapter = allPreviewChapters.find((item) => item.chapterId === chapterId);
    if (subjectId && selectedChapter && selectedChapter.subjectId !== subjectId) {
      mappingErrors.push("Chương đã chọn không thuộc môn học của dòng này.");
    }

    const sourceSkills = row.skills || [];
    const chapterSkills = getImportSkillsForChapter(allPreviewChapters, chapterId);
    const equalWeight = equalSkillWeight(sourceSkills.length);
    const hasPrimary = sourceSkills.some((skill) => skill.primary);
    const resolvedSkills = sourceSkills.map((skill, index) => {
      const matchedSkill = findByIdOrName(chapterSkills, skill.skillId || skill.name, "skillId");

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
      difficulty,
      skills: ensureSinglePrimarySkill(resolvedSkills),
      mappingErrors,
      serverError: "",
    };
  }, [
    allPreviewChapters,
    defaultChapterId,
    defaultDifficulty,
    defaultSubjectId,
    normalizedSubjects,
    placementMode,
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

  useEffect(() => {
    if (!open) return;

    const routeSubjectId = normalizeId(getSubjectId(subject));
    const routeChapterId = normalizeId(getChapterId(chapter));

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
    setDefaultSubjectId(routeSubjectId);
    setDefaultChapterId(routeChapterId);
    setDefaultDifficulty("Medium");
    setLoadingChapters(Boolean(routeSubjectId));
    setPlacementMode(routeSubjectId && routeChapterId ? "single-chapter" : "per-row");
    setAllowPartialSave(false);
  }, [chapter, open, subject]);

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
          return hasCurrent ? currentChapterId : "";
        });
      } catch {
        if (!cancelled) {
          setAvailableChapters(fallbackChapters);
          setDefaultChapterId((currentChapterId) => {
            const hasCurrent = fallbackChapters.some((item) => item.chapterId === currentChapterId);
            return hasCurrent ? currentChapterId : "";
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

    setRows((currentRows) =>
      validateRows(
        currentRows.map((row) =>
          resolveImportedRow({
            ...row,
            mappingErrors: [],
            serverError: "",
          }),
        ),
      ),
    );
  }, [defaultChapterId, defaultDifficulty, defaultSubjectId, placementMode, resolveImportedRow, rows.length, validateRows]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleParse = () => {
    const text = sourceText.trim();

    setFormError("");
    setSaveResult(null);
    setSaveProgress(null);
    setAllowPartialSave(false);

    if (!isImportReferenceDataReady({ loadingChapters })) {
      setFormError("Đang tải dữ liệu môn học và chương. Vui lòng đợi trong giây lát.");
      return;
    }

    if (!text) {
      setRows([]);
      setParseMessage("");
      setFormError("Vui lòng dán nội dung hoặc tải file trước khi kiểm tra.");
      return;
    }

    const effectiveSourceType = sourceType === "auto" ? (detectCsvImport(text) ? "csv" : "text") : sourceType;
    const parsedRows = parseQuestionImport(text, sourceType);
    const rowsWithDefaults = parsedRows.map((row) => resolveImportedRow(row));

    setRows(validateRows(rowsWithDefaults));
    setParseMessage(
      parsedRows.length
        ? `Đã kiểm tra ${parsedRows.length} câu hỏi dạng ${effectiveSourceType.toUpperCase()} từ ${sourceName || "nội dung đã nhập"}.`
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
      setParseMessage(`Đã đọc file ${file.name}. Bấm Kiểm tra dữ liệu để xem trước.`);
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
    setLoadingChapters(Boolean(nextSubjectId));
    setDefaultSubjectId(nextSubjectId);
    setDefaultChapterId("");
  };

  const handleChapterChange = (nextChapterId) => {
    setDefaultChapterId(nextChapterId);
  };

  const handleDifficultyChange = (nextDifficulty) => {
    setDefaultDifficulty(nextDifficulty);
  };

  const handleChangeRow = (rowId, partial) => {
    setSaveResult(null);
    setAllowPartialSave(false);
    setRows((currentRows) =>
      validateRows(
        currentRows.map((row) => {
          if (row.id !== rowId) return row;

          const nextRow = {
            ...row,
            ...partial,
            ...(Object.hasOwn(partial, "subjectId") && {
              manualSubjectId: partial.subjectId,
              manualChapterId: Object.hasOwn(partial, "chapterId") ? partial.chapterId : "",
            }),
            ...(Object.hasOwn(partial, "chapterId") && { manualChapterId: partial.chapterId }),
            ...(Object.hasOwn(partial, "difficulty") && { manualDifficulty: partial.difficulty }),
            mappingErrors: partial.skills ? [] : row.mappingErrors,
            serverError: "",
          };

          return Object.hasOwn(partial, "subjectId") || Object.hasOwn(partial, "chapterId")
            ? resolveImportedRow(nextRow)
            : nextRow;
        }),
      ),
    );
  };

  const handleRemoveRow = (rowId) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
    setSaveResult(null);
    setAllowPartialSave(false);
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

    if (invalidCount > 0 && !allowPartialSave) {
      setFormError("Hãy sửa hết lỗi hoặc xác nhận chỉ lưu các câu hợp lệ.");
      return;
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
  const selectedSubject = normalizedSubjects.find((item) => item.subjectId === defaultSubjectId);
  const selectedChapter = allPreviewChapters.find((item) => item.chapterId === defaultChapterId);
  const templateContext = {
    subjectName: selectedSubject?.name,
    chapterName: selectedChapter?.name,
  };

  const content = (
    <div className="question-import-modal">
        {variant !== "page" && <div className="question-import-header">
          <span className="question-import-header__icon">
            <Upload size={20} />
          </span>
          <div>
            <h2>Import câu hỏi</h2>
            <p>Chuẩn hóa dữ liệu trước khi lưu vào ngân hàng câu hỏi.</p>
          </div>
          <div className="question-import-header__meta" aria-label="Định dạng hỗ trợ">
            <span>.txt</span>
            <span>.csv</span>
          </div>
        </div>}

        <div className="question-import-workspace">
          <div className="question-import-tabs two-columns" aria-label="Nguồn import">
            <button
              type="button"
              className={activeTab === "text" ? "active" : ""}
              onClick={() => setActiveTab("text")}
            >
              <FileText size={16} />
              Dán nội dung
            </button>
            <button
              type="button"
              className={activeTab === "file" ? "active" : ""}
              onClick={() => setActiveTab("file")}
            >
              <FileUp size={16} />
              Upload file
            </button>
          </div>

          {activeTab === "text" && (
            <section className="question-import-source">
              <div className="question-import-section-head compact">
                <div>
                  <strong>Nguồn dữ liệu</strong>
                  <span>Dán nội dung, sau đó kiểm tra trước khi lưu.</span>
                </div>
              </div>

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
              <button
                type="button"
                className="add-btn question-import-parse-btn"
                onClick={handleParse}
                disabled={
                  !sourceText.trim() ||
                  !isImportReferenceDataReady({ loadingChapters })
                }
              >
                <ListChecks size={16} />
                Kiểm tra dữ liệu
              </button>
            </section>
          )}

          {activeTab === "file" && (
            <section className="question-import-source">
              <div className="quiz-import-zone question-import-file-zone">
                <Upload size={38} />
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
              <button
                type="button"
                className="add-btn question-import-parse-btn"
                onClick={handleParse}
                disabled={
                  fileLoading ||
                  !sourceText ||
                  !isImportReferenceDataReady({ loadingChapters })
                }
              >
                <ListChecks size={16} />
                Kiểm tra dữ liệu
              </button>
            </section>
          )}

          <section className="question-import-template">
              <div>
                <strong>Tải file mẫu</strong>
                <span>
                  CSV có dòng mẫu khi đã chọn môn và chương. TXT luôn dùng môn/chương bên dưới.
                </span>
              </div>
              <div className="question-import-template-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => downloadQuestionImportTemplate("csv", templateContext)}
                >
                  <Download size={16} />
                  Tải CSV mẫu
                </button>
                <button type="button" className="cancel-btn" onClick={() => downloadQuestionImportTemplate("txt")}>
                  <Download size={16} />
                  Tải TXT mẫu
                </button>
              </div>
          </section>

          <section className="question-import-section" aria-label="Cách gán môn và chương">
            <div className="question-import-section-head">
              <div>
                <strong>Cách gán môn và chương</strong>
                <span>Mỗi câu bắt buộc thuộc một chương.</span>
              </div>
            </div>

            <div className="question-import-placement-modes">
              <label className={placementMode === "single-chapter" ? "active" : ""}>
                <input
                  type="radio"
                  name="question-import-placement"
                  value="single-chapter"
                  checked={placementMode === "single-chapter"}
                  onChange={(event) => {
                    setPlacementMode(event.target.value);
                    setAllowPartialSave(false);
                    setFormError("");
                  }}
                />
                <span>
                  <strong>Một chương cho tất cả</strong>
                  Bỏ qua cột môn/chương trong file.
                </span>
              </label>
              <label className={placementMode === "per-row" ? "active" : ""}>
                <input
                  type="radio"
                  name="question-import-placement"
                  value="per-row"
                  checked={placementMode === "per-row"}
                  onChange={(event) => {
                    setPlacementMode(event.target.value);
                    setAllowPartialSave(false);
                    setFormError("");
                  }}
                />
                <span>
                  <strong>Theo từng dòng CSV</strong>
                  Giá trị bên dưới chỉ bù cho dòng bị thiếu.
                </span>
              </label>
            </div>

            <div className="question-import-defaults">
              <label className="form-field">
                <span>{placementMode === "single-chapter" ? "Môn học dùng chung *" : "Môn học bù"}</span>
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
                <span>{placementMode === "single-chapter" ? "Chương dùng chung *" : "Chương bù"}</span>
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
                <span>{placementMode === "single-chapter" ? "Độ khó dùng chung" : "Độ khó bù"}</span>
                <select value={defaultDifficulty} onChange={(event) => handleDifficultyChange(event.target.value)}>
                  <option value="Easy">Dễ</option>
                  <option value="Medium">Trung bình</option>
                  <option value="Hard">Khó</option>
                </select>
              </label>
            </div>
          </section>

          {parseMessage && <div className="question-import-note">{parseMessage}</div>}
          {formError && <div className="modal-inline-error">{formError}</div>}

          <div className="question-import-summary" aria-live="polite">
            <span>
              <strong>{rows.length}</strong>
              Tổng
            </span>
            <span className="ok">
              <strong>{validCount}</strong>
              Hợp lệ
            </span>
            <span className={invalidCount ? "error" : ""}>
              <strong>{invalidCount}</strong>
              Cần sửa
            </span>
          </div>

          <QuestionImportPreview
            rows={rows}
            subjects={normalizedSubjects}
            chapters={allPreviewChapters}
            onChangeRow={handleChangeRow}
            onRemoveRow={handleRemoveRow}
            disabled={submitting}
            allowPlacementEdit={placementMode === "per-row"}
          />

          {invalidCount > 0 && validCount > 0 && (
            <label className="question-import-partial-save">
              <input
                type="checkbox"
                checked={allowPartialSave}
                onChange={(event) => {
                  setAllowPartialSave(event.target.checked);
                  setFormError("");
                }}
              />
              <span>
                Chỉ lưu <strong>{validCount} câu hợp lệ</strong>, giữ lại {invalidCount} câu lỗi để sửa sau.
              </span>
            </label>
          )}

          {saveProgress && (
            <div className="question-import-progress">
              <div>
                <strong>
                  Đã lưu {saveProgress.completed}/{saveProgress.total} câu
                </strong>
                <div className="question-import-progress__counts">
                  <span>Thành công: {saveProgress.success}</span>
                  <span>Lỗi: {saveProgress.failed}</span>
                </div>
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
        </div>

        <div className="question-modal-actions question-import-footer">
          <button className="cancel-btn" type="button" onClick={handleClose} disabled={submitting}>
            {variant === "page" ? "Quay lại" : "Đóng"}
          </button>
          <button
            className="add-btn"
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !validCount || (invalidCount > 0 && !allowPartialSave)}
          >
            {!submitting && <CheckCircle2 size={16} />}
            {submitting ? "Đang lưu..." : `Lưu ${validCount} câu${invalidCount ? " hợp lệ" : ""}`}
          </button>
        </div>
      </div>
  );

  if (variant === "page") {
    return <div className="import-questions-modal-shell question-import-page-shell">{content}</div>;
  }

  return (
    <Modal open={open} onClose={handleClose} containerClassName="import-questions-modal-shell">
      {content}
    </Modal>
  );
}
