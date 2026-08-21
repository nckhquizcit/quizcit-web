import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  FileUp,
  Info,
  ListChecks,
  SlidersHorizontal,
  Upload,
} from "lucide-react";

import QuestionImportPreview from "../QuestionImportPreview";
import ImportDifficultyArrayModal from "./ImportDifficultyArrayModal";
import Modal from "../ui/Modal";
import { getErrorMessage } from "../../../../services/apiClient";
import { getChaptersBySubject } from "../../../../services/contentService";
import {
  compactImportKey,
  detectCsvImport,
  normalizeImportDifficultyB,
  parseQuestionImport,
  validateQuestionImportRow,
} from "../../utils/questionImportParser";
import { detectMoodleXml, parseQuestionsFromMoodleXml } from "../../utils/moodleXmlParser";
import { detectAiken, detectGift, parseQuestionsFromAiken, parseQuestionsFromGift } from "../../utils/moodleTextParser";
import { isImportReferenceDataReady } from "../../utils/questionImportMapping";
import { getImportSkillsForChapter } from "../../utils/questionImportPreviewLogic";
import { downloadQuestionImportTemplate } from "../../utils/questionImportTemplate";
import {
  CUSTOM_DIFFICULTY_KEY,
  matchDifficultyPresetKey,
  parseDifficultyArray,
  resolveDifficultyB,
} from "../../utils/difficultyLevels";

const SUPPORTED_FILE_EXTENSIONS = [".txt", ".csv", ".xml", ".gift", ".aiken"];

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

const getSupportedExtension = (filename = "") => {
  const lowerFilename = filename.toLowerCase();
  return SUPPORTED_FILE_EXTENSIONS.find((extension) => lowerFilename.endsWith(extension)) || "";
};

const toImportPayload = (row) => ({
  subjectId: row.subjectId,
  chapterId: row.chapterId,
  content: row.content.trim(),
  explanation: row.explanation?.trim() || "",
  contentFormat: row.contentFormat || "plain",
  difficultyB: row.difficultyB === null || row.difficultyB === "" || !Number.isFinite(Number(row.difficultyB))
    ? null
    : Number(row.difficultyB),
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
  const titleId = useId();
  const normalizedSubjects = useMemo(() => subjects.map(normalizeSubject), [subjects]);
  const normalizedInitialChapters = useMemo(
    () => chapters.map((item) => normalizeChapter(item, normalizeId(getSubjectId(subject)))),
    [chapters, subject],
  );

  const [activeTab, setActiveTab] = useState("text");
  const [sourceText, setSourceText] = useState("");
  const [sourceType, setSourceType] = useState("auto");
  const [sourceName, setSourceName] = useState("");
  const [difficultyText, setDifficultyText] = useState("");
  const [difficultyFileName, setDifficultyFileName] = useState("");
  const [difficultyFileLoading, setDifficultyFileLoading] = useState(false);

  const [targetSubjectId, setTargetSubjectId] = useState("");
  const [targetChapterId, setTargetChapterId] = useState("");
  const [availableChapters, setAvailableChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  const [rows, setRows] = useState([]);
  const [parseMessage, setParseMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [allowPartialSave, setAllowPartialSave] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);

  const allPreviewChapters = useMemo(() => {
    const byId = new Map();
    [...normalizedInitialChapters, ...availableChapters].forEach((item) => {
      if (item?.chapterId) {
        byId.set(item.chapterId, item);
      }
    });
    return [...byId.values()];
  }, [availableChapters, normalizedInitialChapters]);

  const parsedDifficultyInfo = useMemo(() => {
    if (!difficultyText.trim()) return null;
    return parseDifficultyArray(difficultyText);
  }, [difficultyText]);

  const resolveImportedRow = useCallback((row) => {
    const isBank = targetSubjectId === "QUESTION_BANK";
    const subjectId = isBank ? "QUESTION_BANK" : (row.manualSubjectId || targetSubjectId || "");
    const chapterId = isBank ? "QUESTION_BANK" : (row.manualChapterId || targetChapterId || "");
    const mappingErrors = [...(row.sourceErrors || [])];

    const difficultyB = (() => {
      if (row.manualDifficultyB !== undefined && row.manualDifficultyB !== null && row.manualDifficultyB !== "") {
        const num = Number(row.manualDifficultyB);
        return Number.isFinite(num) ? num : null;
      }
      if (row.manualDifficulty) {
        return resolveDifficultyB(row.manualDifficulty, null);
      }
      if (row.difficultyB !== undefined && row.difficultyB !== null && row.difficultyB !== "") {
        const num = Number(row.difficultyB);
        return Number.isFinite(num) ? num : null;
      }
      if (row.importedDifficulty) {
        return normalizeImportDifficultyB(row.importedDifficulty, null);
      }
      return null;
    })();

    const difficulty = difficultyB !== null && Number.isFinite(difficultyB)
      ? matchDifficultyPresetKey(difficultyB) || CUSTOM_DIFFICULTY_KEY
      : (row.manualDifficulty || row.difficulty || "");

    const sourceSkills = row.skills || [];
    const chapterSkills = isBank ? [] : getImportSkillsForChapter(allPreviewChapters, chapterId);
    const equalWeight = equalSkillWeight(sourceSkills.length);
    const hasPrimary = sourceSkills.some((skill) => skill.primary);
    const resolvedSkills = sourceSkills.map((skill, index) => {
      if (isBank) {
        return {
          skillId: skill.skillId || "",
          name: skill.name || skill.skillId || "Kỹ năng",
          weight: skill.weight === "" || skill.weight === undefined ? equalWeight : String(skill.weight),
          primary: hasPrimary ? Boolean(skill.primary) : index === 0,
        };
      }
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
      difficultyB: difficultyB !== null && Number.isFinite(difficultyB) ? Number(difficultyB) : null,
      skills: ensureSinglePrimarySkill(resolvedSkills),
      mappingErrors,
      serverError: "",
    };
  }, [allPreviewChapters, targetChapterId, targetSubjectId]);

  const handleApplyDifficultyArray = (difficultyValues = []) => {
    setSaveResult(null);
    setAllowPartialSave(false);
    setRows((currentRows) => {
      const updatedRows = currentRows.map((row, index) => {
        if (index >= difficultyValues.length) return row;
        const val = difficultyValues[index];
        const nextRow = {
          ...row,
          manualDifficultyB: val,
          difficultyB: val,
          difficulty: matchDifficultyPresetKey(val) || CUSTOM_DIFFICULTY_KEY,
          manualDifficulty: matchDifficultyPresetKey(val) || CUSTOM_DIFFICULTY_KEY,
          serverError: "",
        };
        return nextRow;
      });
      return validateRows(updatedRows);
    });
  };

  const validateRows = useCallback((nextRows) =>
    nextRows.map((row) => {
      const validation = validateQuestionImportRow(row, {
        requireSubject: true,
        requireChapter: true,
        requireDifficulty: true,
      });

      return {
        ...row,
        errors: row.serverError ? [...validation.errors, row.serverError] : validation.errors,
        warnings: [...new Set([...(row.sourceWarnings || []), ...validation.warnings])],
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
    setDifficultyText("");
    setDifficultyFileName("");
    setDifficultyFileLoading(false);
    setRows([]);
    setParseMessage("");
    setFormError("");
    setFileLoading(false);
    setSubmitting(false);
    setSaveProgress(null);
    setSaveResult(null);
    setAllowPartialSave(false);

    if (routeSubjectId) {
      setTargetSubjectId(routeSubjectId);
      setTargetChapterId(routeChapterId || (routeSubjectId === "QUESTION_BANK" ? "QUESTION_BANK" : ""));
      setLoadingChapters(routeSubjectId !== "QUESTION_BANK");
    } else {
      setTargetSubjectId("");
      setTargetChapterId("");
      setLoadingChapters(false);
    }
  }, [chapter, open, subject]);

  useEffect(() => {
    if (!open || !targetSubjectId || targetSubjectId === "QUESTION_BANK") {
      setAvailableChapters([]);
      if (targetSubjectId === "QUESTION_BANK") {
        setTargetChapterId("QUESTION_BANK");
      }
      setLoadingChapters(false);
      return;
    }

    let cancelled = false;
    const fallbackChapters = normalizedInitialChapters.filter(
      (item) => String(item.subjectId) === String(targetSubjectId),
    );

    const loadChapters = async () => {
      setLoadingChapters(true);
      try {
        const chapterData = await getChaptersBySubject(targetSubjectId);
        if (cancelled) return;

        const normalizedChapters = (chapterData || []).map((item) =>
          normalizeChapter(item, targetSubjectId),
        );
        const nextChapters = normalizedChapters.length ? normalizedChapters : fallbackChapters;

        setAvailableChapters(nextChapters);
        setTargetChapterId((currentChapterId) => {
          if (currentChapterId === "QUESTION_BANK") return "";
          const hasCurrent = nextChapters.some(
            (item) => String(item.chapterId) === String(currentChapterId),
          );
          return hasCurrent ? currentChapterId : "";
        });
      } catch {
        if (!cancelled) {
          setAvailableChapters(fallbackChapters);
          setTargetChapterId((currentChapterId) => {
            if (currentChapterId === "QUESTION_BANK") return "";
            const hasCurrent = fallbackChapters.some(
              (item) => String(item.chapterId) === String(currentChapterId),
            );
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
  }, [normalizedInitialChapters, open, targetSubjectId]);

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
  }, [resolveImportedRow, rows.length, targetChapterId, targetSubjectId, validateRows]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleSubjectChange = (nextSubjectId) => {
    setTargetSubjectId(nextSubjectId);
    setFormError("");
    if (nextSubjectId === "QUESTION_BANK") {
      setTargetChapterId("QUESTION_BANK");
      setAvailableChapters([]);
      setLoadingChapters(false);
    } else {
      setTargetChapterId("");
      setLoadingChapters(Boolean(nextSubjectId));
    }
  };

  const handleChapterChange = (nextChapterId) => {
    setTargetChapterId(nextChapterId);
    setFormError("");
  };

  const handleQuestionFileChange = (event) => {
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
      setFormError("File câu hỏi hiện chỉ hỗ trợ .txt, .csv, Moodle XML, GIFT và Aiken.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    setFileLoading(true);
    setSourceName(file.name);
    setSourceType(
      extension === ".xml"
        ? "moodle"
        : extension === ".gift"
          ? "gift"
          : extension === ".aiken"
            ? "aiken"
            : extension === ".csv"
              ? "csv"
              : "auto",
    );

    reader.onload = () => {
      setSourceText(String(reader.result || ""));
      setParseMessage(`Đã đọc file câu hỏi: ${file.name}.`);
      setFileLoading(false);
      event.target.value = "";
    };

    reader.onerror = () => {
      setSourceText("");
      setFormError("Không thể đọc file câu hỏi. Vui lòng thử lại.");
      setFileLoading(false);
      event.target.value = "";
    };

    reader.readAsText(file, "utf-8");
  };

  const handleDifficultyFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormError("");
    const reader = new FileReader();
    setDifficultyFileLoading(true);
    setDifficultyFileName(file.name);

    reader.onload = () => {
      const content = String(reader.result || "");
      setDifficultyText(content);
      const parsed = parseDifficultyArray(content);
      if (parsed.values.length > 0) {
        setParseMessage(`Đã đọc file mảng độ khó (${parsed.values.length} giá trị).`);
      }
      setDifficultyFileLoading(false);
      event.target.value = "";
    };

    reader.onerror = () => {
      setDifficultyText("");
      setFormError("Không thể đọc file mảng độ khó. Vui lòng thử lại.");
      setDifficultyFileLoading(false);
      event.target.value = "";
    };

    reader.readAsText(file, "utf-8");
  };

  const handleParse = () => {
    const text = sourceText.trim();

    setFormError("");
    setSaveResult(null);
    setSaveProgress(null);
    setAllowPartialSave(false);

    if (!targetSubjectId) {
      setFormError("Vui lòng chọn môn học trước khi phân tích nội dung.");
      return;
    }

    if (targetSubjectId !== "QUESTION_BANK" && !targetChapterId) {
      setFormError("Vui lòng chọn chương học trước khi phân tích nội dung.");
      return;
    }

    if (!isImportReferenceDataReady({ loadingChapters })) {
      setFormError("Đang tải dữ liệu môn học và chương. Vui lòng đợi trong giây lát.");
      return;
    }

    if (!text) {
      setRows([]);
      setParseMessage("");
      setFormError("Vui lòng dán nội dung hoặc tải file câu hỏi trước khi phân tích.");
      return;
    }

    const effectiveSourceType = sourceType === "auto"
      ? (detectMoodleXml(text) ? "moodle" : detectAiken(text) ? "aiken" : detectGift(text) ? "gift" : detectCsvImport(text) ? "csv" : "text")
      : sourceType;

    let parsedRows;
    try {
      parsedRows = effectiveSourceType === "moodle" ? parseQuestionsFromMoodleXml(text)
        : effectiveSourceType === "gift" ? parseQuestionsFromGift(text)
        : effectiveSourceType === "aiken" ? parseQuestionsFromAiken(text)
        : parseQuestionImport(text, effectiveSourceType);
    } catch (error) {
      setRows([]);
      setParseMessage("");
      setFormError(error.message || "Không thể đọc dữ liệu câu hỏi.");
      return;
    }

    if (!parsedRows || !parsedRows.length) {
      setRows([]);
      setParseMessage("Không tìm thấy câu hỏi nào theo format hỗ trợ.");
      return;
    }

    let diffValues = [];
    if (difficultyText.trim()) {
      const diffResult = parseDifficultyArray(difficultyText);
      diffValues = diffResult.values;
      if (diffResult.invalidTokens.length > 0) {
        setFormError(`Phát hiện giá trị không hợp lệ trong mảng độ khó: ${diffResult.invalidTokens.join(", ")}`);
        return;
      }
    }

    const rowsWithDefaults = parsedRows.map((row, index) => {
      let nextRow = { ...row };
      if (index < diffValues.length) {
        const val = diffValues[index];
        nextRow.difficultyB = val;
        nextRow.difficulty = matchDifficultyPresetKey(val) || CUSTOM_DIFFICULTY_KEY;
        nextRow.manualDifficultyB = val;
        nextRow.manualDifficulty = matchDifficultyPresetKey(val) || CUSTOM_DIFFICULTY_KEY;
      }
      return resolveImportedRow(nextRow);
    });

    setRows(validateRows(rowsWithDefaults));

    let msg = `${parsedRows.length} câu được nhận diện (dạng ${effectiveSourceType.toUpperCase()}).`;
    if (diffValues.length > 0) {
      msg += ` Đã gán độ khó cho ${Math.min(diffValues.length, parsedRows.length)}/${parsedRows.length} câu từ mảng.`;
      if (diffValues.length < parsedRows.length) {
        msg += ` (${parsedRows.length - diffValues.length} câu còn lại cần nhập độ khó).`;
      }
    }
    setParseMessage(msg);
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
            ...(Object.hasOwn(partial, "difficultyB") && { manualDifficultyB: partial.difficultyB }),
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
      setFormError("Không có câu hỏi hợp lệ để lưu. Vui lòng bổ sung độ khó hoặc sửa lỗi trong preview.");
      return;
    }

    if (invalidCount > 0 && !allowPartialSave) {
      setFormError("Hãy nhập đủ độ khó và sửa hết lỗi, hoặc tích chọn chỉ lưu các câu hợp lệ.");
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
  const selectedSubject = normalizedSubjects.find(
    (item) => String(item.subjectId) === String(targetSubjectId),
  );
  const selectedChapter = allPreviewChapters.find(
    (item) => String(item.chapterId) === String(targetChapterId),
  );
  const templateContext = {
    subjectName: targetSubjectId === "QUESTION_BANK" ? "Ngân hàng câu hỏi" : selectedSubject?.name,
    chapterName: targetSubjectId === "QUESTION_BANK" ? "Chưa phân loại" : selectedChapter?.name,
  };

  const isScopeReady = Boolean(
    targetSubjectId && (targetSubjectId === "QUESTION_BANK" || targetChapterId),
  );

  const content = (
    <div className="question-import-modal">
      {variant !== "page" && (
        <div className="question-import-header">
          <span className="question-import-header__icon">
            <Upload size={20} />
          </span>
          <div>
            <h2 id={titleId}>Import câu hỏi</h2>
            <p>Chọn môn học/chương, tải câu hỏi và mảng độ khó trước khi phân tích.</p>
          </div>
          <div className="question-import-header__meta" aria-label="Định dạng hỗ trợ">
            <span>.txt</span>
            <span>.csv</span>
            <span>.xml</span>
            <span>.gift</span>
            <span>.aiken</span>
          </div>
        </div>
      )}

      <div className="question-import-workspace">
        {/* BƯỚC 1: CHỌN MÔN HỌC VÀ CHƯƠNG */}
        <div className="admin-section-card adm2-card-pad question-import-scope-section">
          <div className="adm2-section-heading">
            <div className="question-import-step-badge">1</div>
            <div>
              <h3>Chọn phạm vi lưu câu hỏi *</h3>
              <p>Bắt buộc chọn môn học và chương trước khi phân tích nội dung.</p>
            </div>
          </div>

          <div className="question-import-scope-grid">
            <label className="form-field">
              <span>Môn học *</span>
              <select
                value={targetSubjectId}
                onChange={(event) => handleSubjectChange(event.target.value)}
                disabled={submitting}
                className={!targetSubjectId ? "invalid" : ""}
              >
                <option value="">-- Chọn môn học * --</option>
                <option value="QUESTION_BANK" style={{ fontWeight: "bold", color: "var(--admin-primary, #047857)" }}>
                  📁 Ngân hàng câu hỏi (Chưa phân loại)
                </option>
                <optgroup label="Danh sách môn học">
                  {normalizedSubjects
                    .filter((s) => s.courseCode !== "QUESTION_BANK" && s.name !== "Ngân hàng câu hỏi")
                    .map((s) => (
                      <option value={s.subjectId} key={s.subjectId}>
                        {s.name} {s.courseCode ? `(${s.courseCode})` : ""}
                      </option>
                    ))}
                </optgroup>
              </select>
            </label>

            <label className="form-field">
              <span>Chương *</span>
              <select
                value={targetChapterId}
                onChange={(event) => handleChapterChange(event.target.value)}
                disabled={submitting || !targetSubjectId || targetSubjectId === "QUESTION_BANK" || loadingChapters}
                className={targetSubjectId && targetSubjectId !== "QUESTION_BANK" && !targetChapterId ? "invalid" : ""}
              >
                {targetSubjectId === "QUESTION_BANK" ? (
                  <option value="QUESTION_BANK">Chưa phân loại</option>
                ) : (
                  <>
                    <option value="">{loadingChapters ? "Đang tải chương..." : "-- Chọn chương * --"}</option>
                    {availableChapters.map((item) => (
                      <option value={item.chapterId} key={item.chapterId}>
                        {item.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </label>
          </div>

          {targetSubjectId === "QUESTION_BANK" && (
            <div className="adm2-note adm2-note--muted question-import-bank-note">
              <Info size={15} />
              Câu hỏi sẽ được lưu vào <strong>Ngân hàng câu hỏi chung (Chưa phân loại)</strong>. Bạn có thể gắn vào môn/chương cụ thể sau.
            </div>
          )}
        </div>

        {/* BƯỚC 2: NGUỒN DỮ LIỆU CÂU HỎI & MẢNG ĐỘ KHÓ */}
        <div className="admin-section-card adm2-card-pad question-import-source-section">
          <div className="adm2-section-heading">
            <div className="question-import-step-badge">2</div>
            <div>
              <h3>Nội dung câu hỏi &amp; Mảng độ khó</h3>
              <p>Dán hoặc tải file câu hỏi kèm mảng độ khó (Theta) cùng lúc rồi bấm Phân tích.</p>
            </div>
          </div>

          <div className="question-import-tabstrip">
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
            <div className="question-import-template-links">
              <button type="button" className="adm2-link-arrow" onClick={() => downloadQuestionImportTemplate("txt")}>
                <Download size={14} />
                Tải mẫu TXT
              </button>
              <button
                type="button"
                className="adm2-link-arrow"
                onClick={() => downloadQuestionImportTemplate("csv", templateContext)}
              >
                <Download size={14} />
                Tải mẫu CSV
              </button>
              <button type="button" className="adm2-link-arrow" onClick={() => downloadQuestionImportTemplate("moodle")}>
                <Download size={14} />
                Mẫu Moodle XML
              </button>
              <button type="button" className="adm2-link-arrow" onClick={() => downloadQuestionImportTemplate("gift")}>
                <Download size={14} />
                Mẫu GIFT
              </button>
              <button type="button" className="adm2-link-arrow" onClick={() => downloadQuestionImportTemplate("aiken")}>
                <Download size={14} />
                Mẫu Aiken
              </button>
            </div>
          </div>

          {activeTab === "text" && (
            <div className="question-import-dual-grid">
              {/* Cột trái: Nội dung câu hỏi */}
              <div className="question-import-dual-col">
                <label className="form-field">
                  <span>Kiểu nội dung câu hỏi</span>
                  <select value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
                    <option value="auto">Tự nhận diện TXT/CSV/Moodle/GIFT/Aiken</option>
                    <option value="text">Văn bản thường (TXT)</option>
                    <option value="csv">Bảng CSV</option>
                    <option value="moodle">Moodle XML</option>
                    <option value="gift">GIFT format</option>
                    <option value="aiken">Aiken format</option>
                  </select>
                </label>
                <label className="form-field full">
                  <span>Nội dung câu hỏi *</span>
                  <textarea
                    className="adm2-mono-textarea question-import-textarea"
                    value={sourceText}
                    placeholder="Dán nội dung câu hỏi theo chuẩn TXT, CSV, Moodle XML, GIFT hoặc Aiken tại đây..."
                    onChange={(event) => {
                      setSourceText(event.target.value);
                      setSourceName("");
                    }}
                  />
                </label>
              </div>

              {/* Cột phải: Mảng độ khó */}
              <div className="question-import-dual-col">
                <div className="question-import-col-head">
                  <span className="form-field-label">Mảng độ khó / Theta (Tùy chọn)</span>
                  <button
                    type="button"
                    className="adm2-link-arrow sample-btn"
                    onClick={() => setDifficultyText("[1, 1.05, 2, 3, -2]")}
                  >
                    Dán mẫu [1, 1.05, 2, 3, -2]
                  </button>
                </div>
                <label className="form-field full">
                  <textarea
                    className="adm2-mono-textarea question-import-textarea difficulty-textarea"
                    value={difficultyText}
                    placeholder="Dán mảng độ khó theo thứ tự câu hỏi:&#10;Ví dụ: [1, 1.05, 2, 3, -2]&#10;Hoặc danh sách: 1, 1.05, 2, 3, -2&#10;Hoặc mỗi dòng 1 số."
                    onChange={(event) => {
                      setDifficultyText(event.target.value);
                      setDifficultyFileName("");
                    }}
                  />
                </label>
                {parsedDifficultyInfo && (
                  <div className={parsedDifficultyInfo.isValid ? "question-import-diff-badge ok" : "question-import-diff-badge warn"}>
                    <Info size={14} />
                    <span>
                      Đã nhận diện: <strong>{parsedDifficultyInfo.values.length}</strong> giá trị độ khó
                      {parsedDifficultyInfo.invalidTokens.length > 0 && ` (Lỗi: ${parsedDifficultyInfo.invalidTokens.join(", ")})`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "file" && (
            <div className="question-import-dual-grid">
              {/* File câu hỏi */}
              <div className="quiz-import-zone question-import-file-zone">
                <Upload size={32} />
                <strong>1. File câu hỏi *</strong>
                <span>Hỗ trợ .txt, .csv, Moodle XML (.xml), GIFT (.gift), Aiken (.aiken)</span>
                <label>
                  <FileUp size={16} />
                  Chọn file câu hỏi
                  <input type="file" accept=".txt,.csv,.xml,.gift,.aiken" onChange={handleQuestionFileChange} />
                </label>
                {sourceName && <em>Đã chọn: {sourceName}</em>}
                {fileLoading && <em>Đang đọc file câu hỏi...</em>}
              </div>

              {/* File mảng độ khó */}
              <div className="quiz-import-zone question-import-file-zone">
                <SlidersHorizontal size={32} />
                <strong>2. File mảng độ khó (Tùy chọn)</strong>
                <span>Hỗ trợ file .json, .txt, .csv chứa mảng hoặc danh sách số độ khó</span>
                <label>
                  <FileUp size={16} />
                  Chọn file độ khó
                  <input type="file" accept=".txt,.json,.csv" onChange={handleDifficultyFileChange} />
                </label>
                {difficultyFileName && <em>Đã chọn: {difficultyFileName}</em>}
                {difficultyFileLoading && <em>Đang đọc file độ khó...</em>}
                {parsedDifficultyInfo && (
                  <span className="file-diff-count">
                    ({parsedDifficultyInfo.values.length} giá trị độ khó)
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="question-import-parse-row">
            <button
              type="button"
              className="add-btn question-import-parse-btn"
              onClick={handleParse}
              disabled={
                !isScopeReady ||
                (activeTab === "text" ? !sourceText.trim() : fileLoading || !sourceText) ||
                !isImportReferenceDataReady({ loadingChapters })
              }
            >
              <ListChecks size={16} />
              Phân tích nội dung
            </button>

            {!isScopeReady && (
              <span className="question-import-scope-warn">
                <AlertCircle size={15} />
                Vui lòng chọn môn học và chương ở Bước 1 trước khi phân tích.
              </span>
            )}
          </div>

          {parseMessage && <div className="question-import-note">{parseMessage}</div>}
          {formError && <div className="modal-inline-error">{formError}</div>}
        </div>

        {/* BƯỚC 3: XEM TRƯỚC VÀ CHỈNH SỬA TRƯỚC KHI LƯU */}
        <div className="admin-section-card adm2-card-pad question-import-preview-section">
          <div className="question-import-preview-head">
            <div className="adm2-section-heading">
              <h3>Xem trước import</h3>
              <p>{rows.length} câu trong bản xem trước</p>
            </div>
            <div className="question-import-preview-badges">
              <span className="adm2-chip adm2-chip--emerald">{validCount} HỢP LỆ</span>
              <span className="adm2-chip adm2-chip--amber">{invalidCount} CẦN SỬA</span>
              {rows.length > 0 && (
                <button
                  type="button"
                  className="cancel-btn question-import-array-btn"
                  onClick={() => setShowDifficultyModal(true)}
                  disabled={submitting}
                >
                  <SlidersHorizontal size={16} />
                  Nhập mảng độ khó
                </button>
              )}
              <button
                className="add-btn"
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !validCount || (invalidCount > 0 && !allowPartialSave)}
              >
                {!submitting && <CheckCircle2 size={16} />}
                {submitting ? "Đang lưu..." : `Import ${validCount} câu`}
              </button>
            </div>
          </div>

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
                Chỉ lưu <strong>{validCount} câu hợp lệ</strong>, giữ lại {invalidCount} câu lỗi/chưa có độ khó để sửa sau.
              </span>
            </label>
          )}

          <QuestionImportPreview
            rows={rows}
            subjects={normalizedSubjects}
            chapters={allPreviewChapters}
            onChangeRow={handleChangeRow}
            onRemoveRow={handleRemoveRow}
            disabled={submitting}
            allowPlacementEdit={false}
          />

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

          <div className="adm2-note adm2-note--muted question-import-footnote">
            Mỗi câu hỏi bắt buộc phải có độ khó (Theta). Độ khó có thể nhập từ mảng, file hoặc chỉnh sửa trực tiếp từng câu.
          </div>
        </div>
      </div>

      <div className="question-modal-actions question-import-footer">
        <button className="cancel-btn" type="button" onClick={handleClose} disabled={submitting}>
          {variant === "page" ? "Quay lại" : "Đóng"}
        </button>
      </div>

      <ImportDifficultyArrayModal
        open={showDifficultyModal}
        onClose={() => setShowDifficultyModal(false)}
        onApply={handleApplyDifficultyArray}
        questionCount={rows.length}
      />
    </div>
  );

  if (variant === "page") {
    return <div className="import-questions-modal-shell question-import-page-shell">{content}</div>;
  }

  return (
    <Modal open={open} onClose={handleClose} containerClassName="import-questions-modal-shell" labelledById={titleId}>
      {content}
    </Modal>
  );
}
