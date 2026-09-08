import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  FileUp,
  Info,
  ListChecks,
  PackageCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from "lucide-react";

import QuestionImportPreview from "../QuestionImportPreview";
import Modal from "../ui/Modal";
import { getErrorMessage } from "../../../../services/apiClient";
import { getChaptersBySubject } from "../../../../services/contentService";
import {
  compactImportKey,
  normalizeImportDifficultyB,
  parseQuestionImport,
  validateQuestionImportRow,
} from "../../utils/questionImportParser";
import { detectMoodleXml, parseQuestionsFromMoodleXml } from "../../utils/moodleXmlParser";
import { detectAiken, detectGift, parseQuestionsFromAiken, parseQuestionsFromGift } from "../../utils/moodleTextParser";
import { isImportReferenceDataReady } from "../../utils/questionImportMapping";
import { getImportSkillsForChapter } from "../../utils/questionImportPreviewLogic";
import {
  createQuestionImportTemplate,
  downloadImportZipPackage,
} from "../../utils/questionImportTemplate";
import { getSkills } from "../../../../services/skillService";
import {
  CUSTOM_DIFFICULTY_KEY,
  matchDifficultyPresetKey,
  parseDifficultyArray,
  resolveDifficultyB,
} from "../../utils/difficultyLevels";
import { parseSkillArray } from "../../utils/skillMappingParser";

const FORMAT_OPTIONS = [
  { key: "csv", label: "CSV (.csv)", ext: ".csv", icon: FileSpreadsheet },
  { key: "moodle", label: "Moodle XML (.xml)", ext: ".xml", icon: FileCode2 },
  { key: "gift", label: "Moodle GIFT (.gift)", ext: ".gift", icon: FileText },
  { key: "aiken", label: "Moodle Aiken (.aiken)", ext: ".aiken", icon: FileText },
];

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
  const lowerRef = normalizedRef.toLowerCase();
  const compactRef = compactImportKey(normalizedRef);

  if (!normalizedRef) return null;

  return (
    items.find((item) => {
      const name = (item?.name ?? item?.skillName ?? "").trim().toLowerCase();
      return name === lowerRef || compactImportKey(name) === compactRef;
    }) ||
    items.find((item) => normalizeId(item[idKey]) === normalizedRef || normalizeId(item.id) === normalizedRef) ||
    null
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

  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [activeTab, setActiveTab] = useState("text");
  const [sourceText, setSourceText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [difficultyText, setDifficultyText] = useState("");
  const [difficultyFileName, setDifficultyFileName] = useState("");
  const [difficultyFileLoading, setDifficultyFileLoading] = useState(false);
  const [skillText, setSkillText] = useState("");
  const [skillFileName, setSkillFileName] = useState("");
  const [skillFileLoading, setSkillFileLoading] = useState(false);

  const [targetSubjectId, setTargetSubjectId] = useState("");
  const [targetChapterId, setTargetChapterId] = useState("");
  const [availableChapters, setAvailableChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const [rows, setRows] = useState([]);
  const [parseMessage, setParseMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveProgress, setSaveProgress] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [allowPartialSave, setAllowPartialSave] = useState(false);

  const [skillCatalog, setSkillCatalog] = useState([]);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    getSkills()
      .then((data) => {
        if (isMounted) setSkillCatalog(data || []);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [open]);

  const skillCatalogMap = useMemo(() => {
    const map = new Map();
    (skillCatalog || []).forEach((item) => {
      const id = String(item?.skillId ?? item?.id ?? "").trim();
      const name = String(item?.name ?? item?.skillName ?? "").trim().toLowerCase();
      if (id) map.set(id, item);
      if (name) map.set(name, item);
    });
    return map;
  }, [skillCatalog]);

  const allPreviewChapters = useMemo(() => {
    const byId = new Map();
    [...normalizedInitialChapters, ...availableChapters].forEach((item) => {
      if (item?.chapterId) {
        byId.set(item.chapterId, item);
      }
    });
    return [...byId.values()];
  }, [availableChapters, normalizedInitialChapters]);

  const selectedSubject = useMemo(() => {
    return normalizedSubjects.find((s) => String(s.subjectId) === String(targetSubjectId)) || null;
  }, [normalizedSubjects, targetSubjectId]);

  const selectedChapter = useMemo(() => {
    return allPreviewChapters.find((c) => String(c.chapterId) === String(targetChapterId)) || null;
  }, [allPreviewChapters, targetChapterId]);

  const currentChapterSkills = useMemo(() => {
    if (!targetChapterId || targetSubjectId === "QUESTION_BANK") return [];
    const rawSkills = getImportSkillsForChapter(allPreviewChapters, targetChapterId);
    return rawSkills.map((s) => {
      const id = String(s?.skillId ?? s?.id ?? "").trim();
      const name = String(s?.name ?? s?.skillName ?? "").trim().toLowerCase();
      const catalogItem = (id ? skillCatalogMap.get(id) : null) || (name ? skillCatalogMap.get(name) : null);
      return {
        ...s,
        chapterName: selectedChapter?.name || s?.chapterName || "Chương",
        chapterId: targetChapterId,
        description: s?.description || catalogItem?.description || "",
      };
    });
  }, [allPreviewChapters, selectedChapter?.name, skillCatalogMap, targetChapterId, targetSubjectId]);

  const allSubjectSkills = useMemo(() => {
    if (!targetSubjectId || targetSubjectId === "QUESTION_BANK") return [];
    const subjectChapters = allPreviewChapters.filter(
      (c) => String(c.subjectId) === String(targetSubjectId),
    );
    const bySkillId = new Map();
    subjectChapters.forEach((chap) => {
      (chap.skills || []).forEach((skill) => {
        const id = String(skill?.skillId ?? skill?.id ?? "").trim();
        const name = String(skill?.name ?? skill?.skillName ?? "").trim().toLowerCase();
        const catalogItem = (id ? skillCatalogMap.get(id) : null) || (name ? skillCatalogMap.get(name) : null);
        const dedupeKey = id || name;
        if (dedupeKey && !bySkillId.has(dedupeKey)) {
          bySkillId.set(dedupeKey, {
            skillId: skill.skillId || catalogItem?.skillId || "",
            name: skill.name || catalogItem?.name || "",
            chapterName: chap.name,
            chapterId: chap.chapterId,
            description: skill.description || catalogItem?.description || "",
          });
        }
      });
    });
    return [...bySkillId.values()];
  }, [allPreviewChapters, skillCatalogMap, targetSubjectId]);

  const parsedDifficultyInfo = useMemo(() => {
    if (!difficultyText.trim()) return null;
    return parseDifficultyArray(difficultyText);
  }, [difficultyText]);

  const parsedSkillInfo = useMemo(() => {
    if (!skillText.trim()) return null;
    return parseSkillArray(skillText, currentChapterSkills.length ? currentChapterSkills : allSubjectSkills);
  }, [allSubjectSkills, currentChapterSkills, skillText]);

  const questionPlaceholder = useMemo(() => {
    if (selectedFormat === "csv") {
      return `Câu hỏi,A,B,C,D,Đáp án,Giải thích,Độ khó
"HTML là viết tắt của gì?","Hyper Text Markup Language","High Text Machine Language","Hyper Tool Multi Language","Home Tool Markup Language","A","HTML là ngôn ngữ đánh dấu siêu văn bản.","0.6"
"CSS dùng để làm gì?","Tạo cơ sở dữ liệu","Định dạng và thiết kế giao diện trang web","Xử lý logic backend","Quản trị hệ điều hành","B","CSS là ngôn ngữ định dạng kiểu dáng cho trang web.","0.2"`;
    }
    if (selectedFormat === "aiken") {
      return `HTML là viết tắt của gì?
A. Hyper Text Markup Language
B. High Text Machine Language
C. Hyper Tool Multi Language
D. Home Tool Markup Language
ANSWER: A

CSS dùng để làm gì?
A. Tạo database
B. Định dạng và thiết kế giao diện trang web
C. Chạy server
D. Quản trị hệ thống
ANSWER: B`;
    }
    if (selectedFormat === "gift") {
      return `// Câu hỏi 1
::Câu hỏi HTML mẫu::[html]<p>HTML là viết tắt của gì?</p> {
=<p>Hyper Text Markup Language</p>
~<p>High Text Machine Language</p>
~<p>Hyper Tool Multi Language</p>
~<p>Home Tool Markup Language</p>
####<p>HTML là ngôn ngữ đánh dấu siêu văn bản.</p>
}

// Câu hỏi 2
::Câu hỏi CSS mẫu::CSS dùng để làm gì? {
=Định dạng và thiết kế giao diện trang web
~Tạo cơ sở dữ liệu
~Xử lý logic backend
~Quản trị hệ điều hành
####CSS là ngôn ngữ định dạng kiểu dáng cho trang web.
}`;
    }
    if (selectedFormat === "moodle") {
      return `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="multichoice">
    <name><text>Câu hỏi HTML mẫu</text></name>
    <questiontext format="html"><text><![CDATA[<p>HTML là viết tắt của gì?</p>]]></text></questiontext>
    <generalfeedback format="html"><text><![CDATA[<p>HTML là ngôn ngữ đánh dấu siêu văn bản.</p>]]></text></generalfeedback>
    <single>true</single>
    <answer fraction="100" format="html"><text><![CDATA[<p>Hyper Text Markup Language</p>]]></text></answer>
    <answer fraction="0" format="html"><text><![CDATA[<p>High Text Machine Language</p>]]></text></answer>
    <answer fraction="0" format="html"><text><![CDATA[<p>Hyper Tool Multi Language</p>]]></text></answer>
    <answer fraction="0" format="html"><text><![CDATA[<p>Home Tool Markup Language</p>]]></text></answer>
  </question>
</quiz>`;
    }
    return createQuestionImportTemplate(selectedFormat);
  }, [selectedFormat]);

  const difficultyPlaceholder = `1, 1.05, 2, 3, -2, 0.6, -1.8, -0.6
(hoặc mỗi dòng một số:
1.05
-0.6
2.0)`;

  const skillPlaceholder = useMemo(() => {
    const s1 = currentChapterSkills[0]?.name || allSubjectSkills[0]?.name || "Kỹ năng chính 1";
    const s2 = currentChapterSkills[1]?.name || allSubjectSkills[1]?.name || "Kỹ năng phụ 2";
    return `${s1}: 1.0\n${s1}: 0.6: primary, ${s2}: 0.4\n(Mỗi dòng tương ứng một câu hỏi theo thứ tự)`;
  }, [allSubjectSkills, currentChapterSkills]);

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



  const validateRows = useCallback((nextRows) =>
    nextRows.map((row) => {
      const validation = validateQuestionImportRow(row, {
        requireSubject: true,
        requireChapter: true,
        requireDifficulty: true,
        requireSkills: true,
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

    setSelectedFormat("csv");
    setActiveTab("text");
    setSourceText("");
    setSourceName("");
    setDifficultyText("");
    setDifficultyFileName("");
    setDifficultyFileLoading(false);
    setSkillText("");
    setSkillFileName("");
    setSkillFileLoading(false);
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

    if (extension === ".xml") setSelectedFormat("moodle");
    else if (extension === ".gift") setSelectedFormat("gift");
    else if (extension === ".aiken") setSelectedFormat("aiken");
    else if (extension === ".csv") setSelectedFormat("csv");

    reader.onload = () => {
      const content = String(reader.result || "");
      if (extension === ".txt") {
        if (detectMoodleXml(content)) setSelectedFormat("moodle");
        else if (detectAiken(content)) setSelectedFormat("aiken");
        else if (detectGift(content)) setSelectedFormat("gift");
      }
      setSourceText(content);
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
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setFormError("File mảng độ khó phải có định dạng .txt.");
      event.target.value = "";
      return;
    }
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

  const handleSkillFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormError("");
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setFormError("File mảng kỹ năng phải có định dạng .txt.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    setSkillFileLoading(true);
    setSkillFileName(file.name);

    reader.onload = () => {
      const content = String(reader.result || "");
      setSkillText(content);
      const parsed = parseSkillArray(content, currentChapterSkills.length ? currentChapterSkills : allSubjectSkills);
      if (parsed.mappings.length > 0) {
        setParseMessage(`Đã đọc file mảng kỹ năng (${parsed.mappings.length} câu).`);
      }
      setSkillFileLoading(false);
      event.target.value = "";
    };

    reader.onerror = () => {
      setSkillText("");
      setFormError("Không thể đọc file kỹ năng. Vui lòng thử lại.");
      setSkillFileLoading(false);
      event.target.value = "";
    };

    reader.readAsText(file, "utf-8");
  };

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      const selSub = selectedSubject || { name: "MonHoc" };
      const selChap = selectedChapter || { name: "Chuong" };

      await downloadImportZipPackage({
        format: selectedFormat,
        subject: selSub,
        chapter: selChap,
        allSubjectSkills,
        chapterSkills: currentChapterSkills,
      });
    } catch {
      setFormError("Không thể tạo file zip mẫu. Vui lòng thử lại.");
    } finally {
      setDownloadingZip(false);
    }
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

    const effectiveSourceType = selectedFormat || (detectMoodleXml(text) ? "moodle" : detectAiken(text) ? "aiken" : detectGift(text) ? "gift" : "csv");

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

    let skillMappings = [];
    if (skillText.trim()) {
      const skillResult = parseSkillArray(skillText, currentChapterSkills.length ? currentChapterSkills : allSubjectSkills);
      skillMappings = skillResult.mappings;
      if (skillResult.invalidTokens.length > 0) {
        setFormError(`Phát hiện kỹ năng không hợp lệ: ${skillResult.invalidTokens.join(", ")}`);
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

      if (index < skillMappings.length && skillMappings[index].length > 0) {
        nextRow.skills = skillMappings[index];
      }

      return resolveImportedRow(nextRow);
    });

    setRows(validateRows(rowsWithDefaults));

    let msg = `${parsedRows.length} câu được nhận diện (${effectiveSourceType.toUpperCase()}).`;
    if (diffValues.length > 0) {
      msg += ` Gán ${Math.min(diffValues.length, parsedRows.length)} độ khó.`;
    }
    if (skillMappings.length > 0) {
      msg += ` Gán ${Math.min(skillMappings.length, parsedRows.length)} mảng kỹ năng.`;
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
      setFormError("Không có câu hỏi hợp lệ để lưu. Vui lòng bổ sung độ khó, kỹ năng và sửa lỗi trong preview.");
      return;
    }

    if (invalidCount > 0 && !allowPartialSave) {
      setFormError("Hãy nhập đủ độ khó/kỹ năng và sửa hết lỗi, hoặc tích chọn chỉ lưu các câu hợp lệ.");
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
            <p>Quy trình chuẩn hóa câu hỏi, mảng độ khó và phân bổ kỹ năng (Theta &amp; Skills).</p>
          </div>
          <div className="question-import-header__meta" aria-label="Định dạng hỗ trợ">
            <span>CSV</span>
            <span>Moodle XML</span>
            <span>Moodle GIFT</span>
            <span>Moodle Aiken</span>
          </div>
        </div>
      )}

      <div className="question-import-workspace">
        {/* BƯỚC 1: CHỌN FORMAT */}
        <div className="admin-section-card adm2-card-pad question-import-step-card">
          <div className="adm2-section-heading">
            <div className="question-import-step-badge">1</div>
            <div>
              <h3>Chọn định dạng câu hỏi *</h3>
              <p>Chọn chuẩn định dạng câu hỏi bạn muốn sử dụng để import.</p>
            </div>
          </div>

          <div className="question-import-format-selector" role="radiogroup" aria-label="Định dạng câu hỏi">
            {FORMAT_OPTIONS.map((fmt) => {
              const Icon = fmt.icon;
              const active = selectedFormat === fmt.key;
              return (
                <button
                  type="button"
                  key={fmt.key}
                  className={active ? "question-import-format-btn active" : "question-import-format-btn"}
                  onClick={() => setSelectedFormat(fmt.key)}
                >
                  <Icon size={18} />
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BƯỚC 2: CHỌN MÔN HỌC & CHƯƠNG */}
        <div className="admin-section-card adm2-card-pad question-import-step-card">
          <div className="adm2-section-heading">
            <div className="question-import-step-badge">2</div>
            <div>
              <h3>Chọn phạm vi lưu (Môn học &amp; Chương) *</h3>
              <p>Mỗi câu hỏi bắt buộc thuộc một môn học và chương (hoặc Ngân hàng câu hỏi chưa phân loại).</p>
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

        {/* BƯỚC 3: NÚT LẤY MẪU ZIP (Chỉ hiển thị sau khi đã chọn môn & chương) */}
        {isScopeReady && (
          <div className="admin-section-card adm2-card-pad question-import-step-card question-import-skill-scope-card">
            <div className="adm2-section-heading">
              <div className="question-import-step-badge">3</div>
              <div className="question-import-step-heading-main">
                <div>
                  <h3>Bộ file mẫu (.zip)</h3>
                  <p>
                    {selectedFormat === "csv"
                      ? "File CSV mẫu đã bao gồm cột độ khó. Kỹ năng được gán qua file mảng kỹ năng riêng."
                      : "Chuẩn Moodle gốc kèm 2 file bổ sung: mảng độ khó (.txt) và mảng kỹ năng (.txt)."}
                  </p>
                </div>
                <button
                  type="button"
                  className="add-btn question-import-zip-download-btn"
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                >
                  <Archive size={16} />
                  {downloadingZip ? "Đang tạo ZIP..." : `Tải bộ file mẫu ${selectedFormat.toUpperCase()} (.zip)`}
                </button>
              </div>
            </div>

            <div className="question-import-skill-setup">
              <div className="question-import-zip-info-box">
                <PackageCheck size={18} />
                <div>
                  <strong>Gói ZIP mẫu bao gồm:</strong>
                  {selectedFormat === "csv" ? (
                    <span>
                      1. File câu hỏi CSV (câu hỏi, các đáp án, đáp án đúng, giải thích &amp; độ khó) · 2. File mảng kỹ năng mẫu (.txt) · 3. Danh sách Skills của {selectedChapter?.name ? `chương "${selectedChapter.name}"` : `môn "${selectedSubject?.name || "học"}"`} ({currentChapterSkills.length || allSubjectSkills.length} kỹ năng kèm mô tả) · 4. Hướng dẫn chi tiết.
                    </span>
                  ) : (
                    <span>
                      1. File câu hỏi chuẩn Moodle ({selectedFormat.toUpperCase()}) · 2. File mảng độ khó mẫu (.txt) · 3. File mảng kỹ năng mẫu (.txt) · 4. Danh sách Skills của {selectedChapter?.name ? `chương "${selectedChapter.name}"` : `môn "${selectedSubject?.name || "học"}"`} ({currentChapterSkills.length || allSubjectSkills.length} kỹ năng kèm mô tả) · 5. Hướng dẫn chi tiết.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 4: NGUỒN DỮ LIỆU */}
        <div className="admin-section-card adm2-card-pad question-import-source-section">
          <div className="adm2-section-heading">
            <div className="question-import-step-badge">{isScopeReady ? "4" : "3"}</div>
            <div>
              <h3>
                {selectedFormat === "csv"
                  ? "Nguồn dữ liệu câu hỏi (kèm độ khó) & mảng kỹ năng"
                  : "Nguồn dữ liệu câu hỏi Moodle, mảng độ khó & mảng kỹ năng"}
              </h3>
              <p>
                {selectedFormat === "csv"
                  ? "Tải lên hoặc dán nội dung câu hỏi CSV và mảng kỹ năng (.txt) rồi bấm Phân tích nội dung."
                  : "Chuẩn Moodle gốc không có độ khó và kỹ năng. Hãy tải lên hoặc dán câu hỏi Moodle, file mảng độ khó (.txt) và file mảng kỹ năng (.txt)."}
              </p>
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
                {selectedFormat === "csv" ? "Upload file (2 file)" : "Upload file (3 file)"}
              </button>
            </div>
          </div>

          {activeTab === "text" && (
            <div className="question-import-triple-grid">
              {/* Cột 1: Câu hỏi */}
              <div className="question-import-triple-col">
                <div className="question-import-col-head">
                  <span className="form-field-label">
                    {selectedFormat === "csv"
                      ? "1. Nội dung câu hỏi (CSV kèm độ khó) *"
                      : `1. Nội dung câu hỏi (${selectedFormat.toUpperCase()}) *`}
                  </span>
                  <button
                    type="button"
                    className="adm2-link-arrow sample-btn"
                    onClick={() => {
                      setSourceText(questionPlaceholder);
                      setSourceName("");
                    }}
                  >
                    Dán mẫu
                  </button>
                </div>
                <textarea
                  className="adm2-mono-textarea question-import-textarea"
                  value={sourceText}
                  placeholder={questionPlaceholder}
                  onChange={(event) => {
                    setSourceText(event.target.value);
                    setSourceName("");
                  }}
                />
              </div>

              {/* Cột 2: Mảng độ khó - CHỈ HIỂN THỊ KHI ĐỊNH DẠNG KHÔNG PHẢI CSV */}
              {selectedFormat !== "csv" && (
                <div className="question-import-triple-col">
                  <div className="question-import-col-head">
                    <span className="form-field-label">2. Mảng độ khó / Theta (.txt) *</span>
                    <button
                      type="button"
                      className="adm2-link-arrow sample-btn"
                      onClick={() => setDifficultyText("1, 1.05, 2, 3, -2, 0.6, -1.8, -0.6")}
                    >
                      Dán mẫu
                    </button>
                  </div>
                  <textarea
                    className="adm2-mono-textarea question-import-textarea difficulty-textarea"
                    value={difficultyText}
                    placeholder={difficultyPlaceholder}
                    onChange={(event) => {
                      setDifficultyText(event.target.value);
                      setDifficultyFileName("");
                    }}
                  />
                  {parsedDifficultyInfo && (
                    <div className={parsedDifficultyInfo.isValid ? "question-import-diff-badge ok" : "question-import-diff-badge warn"}>
                      <Info size={13} />
                      <span>
                        {parsedDifficultyInfo.values.length} giá trị độ khó
                        {parsedDifficultyInfo.invalidTokens.length > 0 && ` (Lỗi: ${parsedDifficultyInfo.invalidTokens.join(", ")})`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Cột Mảng kỹ năng */}
              <div className="question-import-triple-col">
                <div className="question-import-col-head">
                  <span className="form-field-label">
                    {selectedFormat === "csv" ? "2. Mảng kỹ năng & Trọng số (.txt) *" : "3. Mảng kỹ năng & Trọng số (.txt) *"}
                  </span>
                  <button
                    type="button"
                    className="adm2-link-arrow sample-btn"
                    onClick={() => {
                      const s1 = currentChapterSkills[0]?.name || allSubjectSkills[0]?.name || "Kỹ năng chính 1";
                      const s2 = currentChapterSkills[1]?.name || allSubjectSkills[1]?.name || "Kỹ năng phụ 2";
                      setSkillText(`${s1}: 1.0\n${s1}: 0.6: primary, ${s2}: 0.4`);
                    }}
                  >
                    Dán mẫu
                  </button>
                </div>
                <textarea
                  className="adm2-mono-textarea question-import-textarea skill-textarea"
                  value={skillText}
                  placeholder={skillPlaceholder}
                  onChange={(event) => {
                    setSkillText(event.target.value);
                    setSkillFileName("");
                  }}
                />
                {parsedSkillInfo && (
                  <div className={parsedSkillInfo.isValid ? "question-import-diff-badge ok" : "question-import-diff-badge warn"}>
                    <Info size={13} />
                    <span>
                      {parsedSkillInfo.mappings.length} câu có kỹ năng
                      {parsedSkillInfo.invalidTokens.length > 0 && ` (Lỗi: ${parsedSkillInfo.invalidTokens.join(", ")})`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "file" && (
            <div className="question-import-triple-grid">
              {/* File câu hỏi */}
              <div className="quiz-import-zone question-import-file-zone">
                <Upload size={30} />
                <strong>
                  {selectedFormat === "csv"
                    ? "1. File câu hỏi CSV (kèm độ khó) *"
                    : `1. File câu hỏi (${selectedFormat.toUpperCase()}) *`}
                </strong>
                <span>
                  {selectedFormat === "csv"
                    ? "File .csv gồm câu hỏi, 4 đáp án, đáp án đúng, giải thích & độ khó"
                    : `Chuẩn ${selectedFormat.toUpperCase()} (${SUPPORTED_FILE_EXTENSIONS.join(", ")})`}
                </span>
                <label>
                  <FileUp size={16} />
                  Chọn file câu hỏi
                  <input
                    type="file"
                    accept={selectedFormat === "csv" ? ".csv" : ".txt,.csv,.xml,.gift,.aiken"}
                    onChange={handleQuestionFileChange}
                  />
                </label>
                {sourceName && <em>Đã chọn: {sourceName}</em>}
                {fileLoading && <em>Đang đọc file câu hỏi...</em>}
              </div>

              {/* File mảng độ khó - CHỈ HIỂN THỊ KHI KHÔNG PHẢI CSV */}
              {selectedFormat !== "csv" && (
                <div className="quiz-import-zone question-import-file-zone">
                  <SlidersHorizontal size={30} />
                  <strong>2. File mảng độ khó (.txt) *</strong>
                  <span>File .txt chứa danh sách số độ khó cho câu hỏi Moodle</span>
                  <label>
                    <FileUp size={16} />
                    Chọn file độ khó (.txt)
                    <input type="file" accept=".txt" onChange={handleDifficultyFileChange} />
                  </label>
                  {difficultyFileName && <em>Đã chọn: {difficultyFileName}</em>}
                  {difficultyFileLoading && <em>Đang đọc file độ khó...</em>}
                  {parsedDifficultyInfo && (
                    <span className="file-diff-count">
                      ({parsedDifficultyInfo.values.length} giá trị)
                    </span>
                  )}
                </div>
              )}

              {/* File mảng kỹ năng */}
              <div className="quiz-import-zone question-import-file-zone">
                <Sparkles size={30} />
                <strong>
                  {selectedFormat === "csv"
                    ? "2. File mảng kỹ năng (.txt) *"
                    : "3. File mảng kỹ năng (.txt) *"}
                </strong>
                <span>File .txt chứa tên kỹ năng và trọng số theo từng dòng</span>
                <label>
                  <FileUp size={16} />
                  Chọn file kỹ năng (.txt)
                  <input type="file" accept=".txt" onChange={handleSkillFileChange} />
                </label>
                {skillFileName && <em>Đã chọn: {skillFileName}</em>}
                {skillFileLoading && <em>Đang đọc file kỹ năng...</em>}
                {parsedSkillInfo && (
                  <span className="file-diff-count">
                    ({parsedSkillInfo.mappings.length} câu)
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
                Vui lòng chọn môn học và chương ở Bước 2 trước khi phân tích.
              </span>
            )}
          </div>

          {parseMessage && <div className="question-import-note">{parseMessage}</div>}
          {formError && <div className="modal-inline-error">{formError}</div>}
        </div>

        {/* BƯỚC 5: XEM TRƯỚC VÀ CHỈNH SỬA TRƯỚC KHI LƯU */}
        <div className="admin-section-card adm2-card-pad question-import-preview-section">
          <div className="question-import-preview-head">
            <div className="adm2-section-heading">
              <h3>Xem trước import ({rows.length} câu)</h3>
              <p>Kiểm tra nội dung, đáp án, độ khó và kỹ năng trước khi lưu.</p>
            </div>
            <div className="question-import-preview-badges">
              <span className="adm2-chip adm2-chip--emerald">{validCount} HỢP LỆ</span>
              <span className="adm2-chip adm2-chip--amber">{invalidCount} CẦN SỬA</span>
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
                Chỉ lưu <strong>{validCount} câu hợp lệ</strong>, giữ lại {invalidCount} câu lỗi/chưa có độ khó/kỹ năng để sửa sau.
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
            Mỗi câu hỏi bắt buộc phải có độ khó (Theta) và ít nhất một kỹ năng chính với tổng trọng số = 1.0.
          </div>
        </div>
      </div>

      <div className="question-modal-actions question-import-footer">
        <button className="cancel-btn" type="button" onClick={handleClose} disabled={submitting}>
          {variant === "page" ? "Quay lại" : "Đóng"}
        </button>
      </div>


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
