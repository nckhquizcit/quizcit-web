import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Plus, Search, X } from "lucide-react";

import Modal from "../ui/Modal";
import RichTextEditor from "../../../../components/richtext/RichTextEditor";
import RichTextView from "../../../../components/richtext/RichTextView";
import {
  deserializeRichTextContent,
  FORMAT_BLOCKNOTE,
  FORMAT_PLAIN,
  isRichTextEmpty,
  normalizeContentFormat,
  serializeRichTextContent,
} from "../../../../components/richtext/richTextUtils";
import { getErrorMessage } from "../../../../services/apiClient";
import { getChapterById, getChaptersBySubject, getSubjects } from "../../../../services/contentService";
import {
  CUSTOM_DIFFICULTY_KEY,
  DEFAULT_DIFFICULTY_B,
  DEFAULT_DIFFICULTY_KEY,
  DIFFICULTY_PRESETS,
  getDifficultyLabelVi,
  getDifficultyTone,
  matchDifficultyPresetKey,
  resolveDifficultyB,
} from "../../utils/difficultyLevels";

const MIN_ANSWER_COUNT = 2;
const MAX_ANSWER_COUNT = 10;
const SKILL_WEIGHT_SUM_TOLERANCE = 0.000001;
const EMPTY_LIST = Object.freeze([]);
const BANK_SUBJECT_STUB = { subjectId: "QUESTION_BANK", courseCode: "QUESTION_BANK", name: "Ngân hàng câu hỏi" };
const BANK_CHAPTER_STUB = { chapterId: "QUESTION_BANK", name: "Chưa phân loại" };
const createEmptyAnswers = (count = MIN_ANSWER_COUNT) => Array.from({ length: count }, () => "");

/**
 * Form luôn làm việc ở định dạng BlockNote. Nội dung cũ dạng plain được nâng
 * cấp ngay khi mở form, nhờ vậy không tồn tại trạng thái nửa vời kiểu câu hỏi
 * đã là JSON còn giải thích vẫn là chữ thuần.
 */
const toRichTextValue = (value, sourceFormat) => {
  const text = value ?? "";
  if (!text) return "";
  if (normalizeContentFormat(sourceFormat) === FORMAT_BLOCKNOTE) return String(text);
  return serializeRichTextContent(deserializeRichTextContent(text, FORMAT_PLAIN));
};

const isAnswerFilled = (answer) => !isRichTextEmpty(answer, FORMAT_BLOCKNOTE);

const normalizeDifficultyState = (value) => {
  if (value && typeof value === "object") {
    const key = value.key || matchDifficultyPresetKey(value.value ?? value.difficultyB);
    const customValue = value.customValue ?? value.value ?? value.difficultyB ?? DEFAULT_DIFFICULTY_B;
    return {
      key: key || DEFAULT_DIFFICULTY_KEY,
      customValue: Number.isFinite(Number(customValue)) ? Number(customValue) : DEFAULT_DIFFICULTY_B,
    };
  }

  if (typeof value === "string") {
    const legacyMap = {
      Easy: "EASY",
      Medium: "MEDIUM",
      Hard: "HARD",
      easy: "EASY",
      medium: "MEDIUM",
      hard: "HARD",
    };
    if (legacyMap[value]) {
      return { key: legacyMap[value], customValue: DEFAULT_DIFFICULTY_B };
    }
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const key = matchDifficultyPresetKey(numeric);
    return {
      key,
      customValue: key === CUSTOM_DIFFICULTY_KEY ? numeric : DEFAULT_DIFFICULTY_B,
    };
  }

  return { key: DEFAULT_DIFFICULTY_KEY, customValue: DEFAULT_DIFFICULTY_B };
};

const normalizeId = (value) => (value === undefined || value === null ? "" : String(value));

const getSubjectId = (subject) => subject?.subjectId ?? subject?.id;

const getChapterId = (chapter) => chapter?.chapterId ?? chapter?.id;

const getSkillId = (skill) =>
  skill?.skillId ?? skill?.id ?? skill?.skill?.skillId ?? skill?.skill?.id;

const getSkillName = (skill) =>
  skill?.name ?? skill?.skillName ?? skill?.skill?.name ?? "Kỹ năng chưa đặt tên";

const getSkillWeight = (skill) => skill?.weight ?? skill?.skillWeight ?? skill?.questionWeight ?? 0;

const getSkillPrimary = (skill) =>
  Boolean(skill?.primary ?? skill?.isPrimary ?? skill?.is_primary ?? skill?.questionSkill?.primary);

const normalizeSubject = (subject) => ({
  ...subject,
  subjectId: getSubjectId(subject),
});

const normalizeChapter = (chapter, fallbackSubjectId = "") => ({
  ...chapter,
  chapterId: getChapterId(chapter),
  subjectId:
    chapter?.subjectId ?? chapter?.subject?.subjectId ?? chapter?.subject?.id ?? fallbackSubjectId,
});

const normalizeSkill = (skill) => ({
  ...skill,
  skillId: normalizeId(getSkillId(skill)),
  name: getSkillName(skill),
});

const normalizeQuestionSkills = (skills = []) =>
  skills
    .map((skill, index) => ({
      skillId: normalizeId(getSkillId(skill)),
      name: getSkillName(skill),
      weight: String(getSkillWeight(skill)),
      primary: getSkillPrimary(skill) || (index === 0 && !skills.some(getSkillPrimary)),
    }))
    .filter((skill) => skill.skillId);

const ensureSinglePrimarySkill = (skills = []) => {
  if (!skills.length) return [];

  const primaryIndex = skills.findIndex((skill) => skill.primary);
  const safePrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return skills.map((skill, index) => ({
    ...skill,
    primary: index === safePrimaryIndex,
  }));
};

const normalizeSkillWeightInput = (value) => {
  if (value === "" || value === null || value === undefined) return "";

  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) return value;

  return String(Math.max(0, parsedValue));
};

const validateSkillWeights = (skills = []) => {
  if (!skills.length) return "";

  const primaryCount = skills.filter((skill) => skill.primary).length;
  if (primaryCount !== 1) {
    return "Vui lòng chọn đúng một kỹ năng chính cho câu hỏi.";
  }

  let weightSum = 0;

  for (const skill of skills) {
    const weight = Number(skill.weight);
    if (skill.weight === "" || !Number.isFinite(weight) || weight < 0) {
      return "Trọng số của mỗi kỹ năng phải là số không âm.";
    }

    weightSum += weight;
  }

  if (Math.abs(weightSum - 1) > SKILL_WEIGHT_SUM_TOLERANCE) {
    return "Tổng trọng số kỹ năng của câu hỏi phải bằng 1.";
  }

  return "";
};

const isOptionCorrect = (option) =>
  Boolean(option?.corrected ?? option?.isCorrect ?? option?.is_correct);

const normalizeAnswers = (options = [], sourceFormat) => {
  const nextAnswers = options
    .map((option) => toRichTextValue(option.content, option.contentFormat ?? sourceFormat))
    .slice(0, MAX_ANSWER_COUNT);

  if (!nextAnswers.length) {
    return createEmptyAnswers();
  }

  if (nextAnswers.length < MIN_ANSWER_COUNT) {
    return [...nextAnswers, ...createEmptyAnswers(MIN_ANSWER_COUNT - nextAnswers.length)];
  }

  return nextAnswers;
};

export function QuestionForm({
  open = true,
  onClose,
  onCancel,
  subject,
  chapter,
  initialQuestion,
  mode = "create",
  onSubmit,
  subjects = EMPTY_LIST,
  chapters = EMPTY_LIST,
  variant = "modal",
  titleId: titleIdProp,
}) {
  const generatedTitleId = useId();
  const titleId = titleIdProp || generatedTitleId;

  const isEdit = mode === "edit";
  const isPageVariant = variant === "page";
  const handleCancel = onCancel || onClose;
  const [question, setQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficultyKey, setDifficultyKey] = useState(DEFAULT_DIFFICULTY_KEY);
  const [customDifficultyB, setCustomDifficultyB] = useState(String(DEFAULT_DIFFICULTY_B));
  const [answers, setAnswers] = useState(() => createEmptyAnswers());
  const [correctIndex, setCorrectIndex] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    normalizeId(getSubjectId(subject) || getSubjectId(subjects[0])),
  );
  const [selectedChapterId, setSelectedChapterId] = useState(
    normalizeId(getChapterId(chapter) || getChapterId(chapters[0])),
  );
  const [subjectSearch, setSubjectSearch] = useState("");
  const [chapterSearch, setChapterSearch] = useState("");
  const [preview, setPreview] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState(() => subjects.map(normalizeSubject));
  const [availableChapters, setAvailableChapters] = useState(() =>
    chapters.map((item) => normalizeChapter(item, normalizeId(getSubjectId(subject)))),
  );
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formError, setFormError] = useState("");
  const skillSearchRef = useRef(null);
  const formErrorRef = useRef(null);

const resolveInitialSubjectId = (question, routeSubject, fallbackSubject) => {
  if (question?.subject?.courseCode === "QUESTION_BANK" || question?.subject?.name === "Ngân hàng câu hỏi") {
    return "QUESTION_BANK";
  }
  return normalizeId(question?.subjectId || getSubjectId(routeSubject) || getSubjectId(fallbackSubject));
};

const resolveInitialChapterId = (question, routeChapter, fallbackChapter) => {
  if (question?.chapter?.name === "Chưa phân loại" || question?.chapter?.chapterId === "QUESTION_BANK" || question?.subject?.courseCode === "QUESTION_BANK") {
    return "QUESTION_BANK";
  }
  return normalizeId(question?.chapterId || getChapterId(routeChapter) || getChapterId(fallbackChapter));
};

  useEffect(() => {
    if (formError) {
      formErrorRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [formError]);

  useEffect(() => {
    setAvailableSubjects(subjects.map(normalizeSubject));
  }, [subjects]);

  useEffect(() => {
    setAvailableChapters(
      chapters.map((item) => normalizeChapter(item, normalizeId(getSubjectId(subject)))),
    );
  }, [chapters, subject]);

  useEffect(() => {
    if (!open || !selectedChapterId) { setAvailableSkills([]); return; }

    let cancelled = false;

    const loadSkills = async () => {
      setLoadingSkills(true);

      try {
        if (selectedChapterId === "QUESTION_BANK") {
          if (cancelled) return;
          setAvailableSkills([]);
          setSelectedSkills((current) => []);
          return;
        }

        const selectedChapter = await getChapterById(selectedChapterId);
        if (cancelled) return;

        const skillData = selectedChapter?.skills || [];
        setAvailableSkills(skillData.map(normalizeSkill));
        setSelectedSkills((current) => current.filter((item) => skillData.some((available) => normalizeId(getSkillId(available)) === item.skillId)));
      } catch {
        if (!cancelled) {
          setAvailableSkills([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSkills(false);
        }
      }
    };

    loadSkills();

    return () => {
      cancelled = true;
    };
  }, [open, selectedChapterId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadSubjects = async () => {
      setLoadingSubjects(true);

      try {
        const subjectData = await getSubjects();
        if (cancelled) return;

        const normalizedSubjects = [BANK_SUBJECT_STUB, ...(subjectData || []).map(normalizeSubject)];
        setAvailableSubjects(normalizedSubjects);
        setSelectedSubjectId((currentSubjectId) => {
          const hasCurrent = normalizedSubjects.some(
            (item) => normalizeId(item.subjectId) === normalizeId(currentSubjectId),
          );

          if (hasCurrent) return currentSubjectId;

          return resolveInitialSubjectId(initialQuestion, subject, normalizedSubjects[0]);
        });
      } catch {
        if (!cancelled) {
          setAvailableSubjects([BANK_SUBJECT_STUB, ...subjects.map(normalizeSubject)]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSubjects(false);
        }
      }
    };

    loadSubjects();

    return () => {
      cancelled = true;
    };
  }, [initialQuestion?.subjectId, open, subject, subjects]);

  useEffect(() => {
    if (!open) return;

    const sourceFormat = initialQuestion?.contentFormat;
    const nextAnswers = normalizeAnswers(initialQuestion?.options, sourceFormat);
    const nextCorrectIndex = initialQuestion?.options?.findIndex((option) => isOptionCorrect(option));

    setQuestion(toRichTextValue(initialQuestion?.content, sourceFormat));
    setExplanation(
      toRichTextValue(
        initialQuestion?.explanation || initialQuestion?.explaination,
        sourceFormat,
      ),
    );
    const nextDifficulty = normalizeDifficultyState(
      initialQuestion?.difficultyB ?? initialQuestion?.difficulty,
    );
    setDifficultyKey(nextDifficulty.key);
    setCustomDifficultyB(String(nextDifficulty.customValue));
    setAnswers(nextAnswers);
    setCorrectIndex(nextCorrectIndex >= 0 && nextCorrectIndex < nextAnswers.length ? nextCorrectIndex : null);
    setSelectedSubjectId(resolveInitialSubjectId(initialQuestion, subject, subjects[0]));
    setSelectedChapterId(resolveInitialChapterId(initialQuestion, chapter, chapters[0]));
    setSelectedSkills(normalizeQuestionSkills(initialQuestion?.skills || initialQuestion?.questionSkills));
    setSubjectSearch("");
    setChapterSearch("");
    setSkillSearch("");
    setPreview(false);
    setSubmitting(false);
    setSubmitError("");
    setFormError("");
  }, [chapter, chapters, initialQuestion, open, subject, subjects]);

  useEffect(() => {
    if (!open) return;

    const hasSelectedSubject = availableSubjects.some(
      (item) => normalizeId(item.subjectId) === normalizeId(selectedSubjectId),
    );

    if (!hasSelectedSubject) {
      setSelectedSubjectId(normalizeId(getSubjectId(subject) || availableSubjects[0]?.subjectId));
    }
  }, [availableSubjects, open, selectedSubjectId, subject]);

  useEffect(() => {
    if (!open || !selectedSubjectId) {
      if (open) {
        setAvailableChapters([]);
        setSelectedChapterId("");
      }
      return;
    }

    let cancelled = false;

    const loadChapters = async () => {
      setLoadingChapters(true);

      try {
        if (selectedSubjectId === "QUESTION_BANK") {
          if (cancelled) return;
          setAvailableChapters([BANK_CHAPTER_STUB]);
          setSelectedChapterId("QUESTION_BANK");
          return;
        }

        const chapterData = await getChaptersBySubject(selectedSubjectId);
        if (cancelled) return;

        const normalizedChapters = (chapterData || []).map((item) =>
          normalizeChapter(item, selectedSubjectId),
        );

        setAvailableChapters(normalizedChapters);
        setSelectedChapterId((currentChapterId) => {
          const hasCurrent = normalizedChapters.some(
            (item) => normalizeId(item.chapterId) === normalizeId(currentChapterId),
          );

          if (hasCurrent) return currentChapterId;

          return normalizeId(
            initialQuestion?.chapterId ||
              (normalizeId(getSubjectId(subject)) === normalizeId(selectedSubjectId)
                ? getChapterId(chapter)
                : undefined) ||
              normalizedChapters[0]?.chapterId,
          );
        });
      } catch {
        if (cancelled) return;

        const fallbackChapters = chapters
          .map((item) => normalizeChapter(item, selectedSubjectId))
          .filter((item) => normalizeId(item.subjectId) === normalizeId(selectedSubjectId));

        setAvailableChapters(fallbackChapters);
        setSelectedChapterId((currentChapterId) => {
          const hasCurrent = fallbackChapters.some(
            (item) => normalizeId(item.chapterId) === normalizeId(currentChapterId),
          );

          if (hasCurrent) return currentChapterId;

          return normalizeId(fallbackChapters[0]?.chapterId);
        });
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
  }, [chapter, chapters, initialQuestion?.chapterId, open, selectedSubjectId, subject]);

  useEffect(() => {
    if (!open) return;

    const hasSelectedChapter = availableChapters.some(
      (item) => normalizeId(item.chapterId) === normalizeId(selectedChapterId),
    );

    if (!hasSelectedChapter) {
      setSelectedChapterId(normalizeId(availableChapters[0]?.chapterId));
    }
  }, [availableChapters, open, selectedChapterId]);

  const filteredSubjects = useMemo(() => {
    const keyword = subjectSearch.trim().toLowerCase();

    if (!keyword) return availableSubjects;

    return availableSubjects.filter((item) => item.name?.toLowerCase().includes(keyword));
  }, [availableSubjects, subjectSearch]);

  const filteredChapters = useMemo(() => {
    const keyword = chapterSearch.trim().toLowerCase();

    if (!keyword) return availableChapters;

    return availableChapters.filter((item) => item.name?.toLowerCase().includes(keyword));
  }, [availableChapters, chapterSearch]);

  const skillWeightSum = useMemo(
    () =>
      selectedSkills.reduce((sum, skill) => {
        const weight = Number(skill.weight);
        return Number.isFinite(weight) ? sum + weight : sum;
      }, 0),
    [selectedSkills],
  );

  const isSkillWeightSumValid =
    !selectedSkills.length || Math.abs(skillWeightSum - 1) <= SKILL_WEIGHT_SUM_TOLERANCE;

  const filteredSkills = useMemo(() => {
    const keyword = skillSearch.trim().toLowerCase();

    if (!keyword) return availableSkills;

    return availableSkills.filter((item) => item.name?.toLowerCase().includes(keyword));
  }, [availableSkills, skillSearch]);

  const selectedSubject = useMemo(
    () =>
      availableSubjects.find(
        (item) => normalizeId(item.subjectId) === normalizeId(selectedSubjectId),
      ),
    [availableSubjects, selectedSubjectId],
  );

  const selectedChapter = useMemo(
    () =>
      availableChapters.find(
        (item) => normalizeId(item.chapterId) === normalizeId(selectedChapterId),
      ),
    [availableChapters, selectedChapterId],
  );

  const completedAnswerCount = useMemo(
    () => answers.filter(isAnswerFilled).length,
    [answers],
  );

  const isQuestionFilled = !isRichTextEmpty(question, FORMAT_BLOCKNOTE);

  // RichTextEditor chỉ đọc `value` một lần lúc mount, nên phải remount khi form
  // chuyển sang câu hỏi khác thì nội dung mới hiện đúng.
  const editorKey = `${open ? "open" : "closed"}-${initialQuestion?.questionId ?? "new"}`;

  const isReadyToSubmit =
    isQuestionFilled &&
    Boolean(selectedSubjectId) &&
    Boolean(selectedChapterId) &&
    completedAnswerCount === answers.length &&
    correctIndex !== null &&
    isSkillWeightSumValid;

  const correctAnswerLabel =
    correctIndex === null ? "Chưa chọn" : `Đáp án ${String.fromCharCode(65 + correctIndex)}`;

  useEffect(() => {
    if (!availableSkills.length || !selectedSkills.length) return;

    setSelectedSkills((currentSkills) =>
      currentSkills.map((skill) => {
        const matchedSkill = availableSkills.find(
          (item) => normalizeId(item.skillId) === normalizeId(skill.skillId),
        );

        return matchedSkill ? { ...skill, name: matchedSkill.name } : skill;
      }),
    );
  }, [availableSkills, selectedSkills.length]);

  const resolvedDifficultyB = resolveDifficultyB(difficultyKey, customDifficultyB);
  const difficultyLabel = getDifficultyLabelVi(resolvedDifficultyB);
  const difficultyTone = getDifficultyTone(resolvedDifficultyB);

  const handleAnswerChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleAnswerCountChange = (event) => {
    const nextCount = Number(event.target.value);

    setAnswers((currentAnswers) => {
      if (nextCount > currentAnswers.length) {
        return [...currentAnswers, ...createEmptyAnswers(nextCount - currentAnswers.length)];
      }

      return currentAnswers.slice(0, nextCount);
    });

    setCorrectIndex((currentCorrectIndex) =>
      currentCorrectIndex !== null && currentCorrectIndex >= nextCount ? null : currentCorrectIndex,
    );
  };

  const handleAddAnswer = () => {
    setAnswers((currentAnswers) =>
      currentAnswers.length >= MAX_ANSWER_COUNT
        ? currentAnswers
        : [...currentAnswers, ...createEmptyAnswers(1)],
    );
  };

  const handleRemoveAnswer = (index) => {
    if (answers.length <= MIN_ANSWER_COUNT) return;

    setAnswers((currentAnswers) => currentAnswers.filter((_, itemIndex) => itemIndex !== index));
    setCorrectIndex((currentCorrectIndex) => {
      if (currentCorrectIndex === null) return null;
      if (currentCorrectIndex === index) return null;
      return currentCorrectIndex > index ? currentCorrectIndex - 1 : currentCorrectIndex;
    });
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjectId(normalizeId(subjectId));
    setSelectedChapterId("");
    setChapterSearch("");
  };

  const handleSkillToggle = (skill) => {
    const normalizedSkill = normalizeSkill(skill);

    setSelectedSkills((currentSkills) => {
      const exists = currentSkills.some(
        (item) => normalizeId(item.skillId) === normalizeId(normalizedSkill.skillId),
      );

      if (exists) {
        return ensureSinglePrimarySkill(currentSkills.filter(
          (item) => normalizeId(item.skillId) !== normalizeId(normalizedSkill.skillId),
        ));
      }

      return ensureSinglePrimarySkill([
        ...currentSkills,
        {
          skillId: normalizedSkill.skillId,
          name: normalizedSkill.name,
          weight: currentSkills.length === 0 ? "1" : "0",
          primary: currentSkills.length === 0,
        },
      ]);
    });
  };

  const handlePrimarySkillChange = (skillId) => {
    setSelectedSkills((currentSkills) =>
      currentSkills.map((skill) => ({
        ...skill,
        primary: normalizeId(skill.skillId) === normalizeId(skillId),
      })),
    );
  };

  const handleSkillWeightChange = (skillId, value) => {
    setSelectedSkills((currentSkills) =>
      currentSkills.map((skill) =>
        normalizeId(skill.skillId) === normalizeId(skillId)
          ? { ...skill, weight: normalizeSkillWeightInput(value) }
          : skill,
      ),
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setFormError("");

    if (!isQuestionFilled) {
      setFormError("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    if (!selectedSubjectId || !selectedChapterId) {
      setFormError("Vui lòng chọn môn học và chương cho câu hỏi.");
      return;
    }

    if (!answers.every(isAnswerFilled)) {
      setFormError("Vui lòng nhập đầy đủ nội dung cho tất cả đáp án.");
      return;
    }

    if (correctIndex === null) {
      setFormError("Vui lòng chọn một đáp án đúng.");
      return;
    }

    const skillError = validateSkillWeights(selectedSkills);
    if (skillError) {
      setFormError(skillError);
      return;
    }

    if (difficultyKey === CUSTOM_DIFFICULTY_KEY) {
      const customValue = Number(String(customDifficultyB).replace(",", "."));
      if (!Number.isFinite(customValue)) {
        setFormError("Vui lòng nhập độ khó tùy chỉnh hợp lệ (ví dụ: -1.2).");
        return;
      }
    }

    const difficultyB = resolveDifficultyB(difficultyKey, customDifficultyB);

    const payload = {
      content: question,
      explanation: isRichTextEmpty(explanation, FORMAT_BLOCKNOTE) ? "" : explanation,
      contentFormat: FORMAT_BLOCKNOTE,
      difficulty: difficultyKey,
      difficultyB,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      skills: selectedSkills.map((skill) => ({
        skillId: skill.skillId,
        weight: Number(normalizeSkillWeightInput(skill.weight)),
        primary: Boolean(skill.primary),
      })),
      options: answers.map((answer, index) => ({
        content: answer,
        corrected: correctIndex === index,
      })),
    };

    try {
      setSubmitting(true);
      setSubmitError("");
      await onSubmit?.(payload);
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Không thể lưu câu hỏi. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  const subjectChapterFields = (
    <div className="two-column">
      <div className="form-field">
        <span>
          Môn học * <b>(Bắt buộc)</b>
        </span>
        <div className="mini-search">
          <Search size={18} />
          <input
            placeholder="Tìm môn học..."
            value={subjectSearch}
            onChange={(event) => setSubjectSearch(event.target.value)}
          />
        </div>
        <div className="choice-list">
          {loadingSubjects && <span>Đang tải danh sách môn học...</span>}
          {!loadingSubjects &&
            filteredSubjects.map((item) => (
              <button
                className={selectedSubjectId === normalizeId(item.subjectId) ? "selected" : ""}
                onClick={() => handleSubjectToggle(item.subjectId)}
                key={item.subjectId}
                type="button"
              >
                <span />
                {item.name}
              </button>
            ))}
          {!loadingSubjects && !filteredSubjects.length && <span>Không có môn học phù hợp</span>}
        </div>
      </div>

      <div className="form-field">
        <span>
          Chương * <b>(Bắt buộc)</b>
        </span>
        <div className="mini-search">
          <Search size={18} />
          <input
            placeholder="Tìm chương..."
            value={chapterSearch}
            onChange={(event) => setChapterSearch(event.target.value)}
          />
        </div>
        <div className="choice-list">
          {loadingChapters && <span>Đang tải danh sách chương...</span>}
          {!loadingChapters && !selectedSubjectId && <span>Vui lòng chọn môn học trước</span>}
          {!loadingChapters &&
            selectedSubjectId &&
            filteredChapters.map((item) => (
              <button
                className={selectedChapterId === normalizeId(item.chapterId) ? "selected" : ""}
                onClick={() => setSelectedChapterId(normalizeId(item.chapterId))}
                key={item.chapterId}
                type="button"
              >
                <span />
                {item.name}
              </button>
            ))}
          {!loadingChapters && selectedSubjectId && !filteredChapters.length && (
            <span>Không có chương phù hợp</span>
          )}
        </div>
      </div>
    </div>
  );

  const difficultyField = (
    <label className="form-field full">
      <span>Độ khó</span>
      <div className="difficulty-selector difficulty-selector--six">
        {DIFFICULTY_PRESETS.map((item) => (
          <button
            className={difficultyKey === item.key ? getDifficultyTone(item.value) : ""}
            onClick={() => setDifficultyKey(item.key)}
            key={item.key}
            type="button"
          >
            <strong>{item.label}</strong>
            <small>{item.value > 0 ? `+${item.value.toFixed(1)}` : item.value.toFixed(1)}</small>
          </button>
        ))}
        <button
          className={difficultyKey === CUSTOM_DIFFICULTY_KEY ? "custom" : ""}
          onClick={() => setDifficultyKey(CUSTOM_DIFFICULTY_KEY)}
          type="button"
        >
          <strong>Tùy chỉnh</strong>
          <small>Nhập giá trị</small>
        </button>
      </div>
      {difficultyKey === CUSTOM_DIFFICULTY_KEY && (
        <input
          className="difficulty-custom-input"
          type="number"
          step="0.1"
          value={customDifficultyB}
          onChange={(event) => setCustomDifficultyB(event.target.value)}
          placeholder="Ví dụ: -1.2"
          aria-label="Độ khó tùy chỉnh"
        />
      )}
    </label>
  );

  const skillsField = (
    <div className="form-field full">
      <div className="field-inline-header">
        <span>Kỹ năng</span>
        <span className="skill-hint">
          Nếu chọn kỹ năng, cần đúng 1 kỹ năng chính; các kỹ năng còn lại là kỹ năng phụ
        </span>
      </div>
      <div className="mini-search">
        <Search size={18} />
        <input
          ref={skillSearchRef}
          placeholder="Tìm kỹ năng..."
          value={skillSearch}
          onChange={(event) => setSkillSearch(event.target.value)}
        />
      </div>
      <div className="choice-list skill-choice-list">
        {loadingSkills && <span>Đang tải danh sách kỹ năng...</span>}
        {!loadingSkills &&
          filteredSkills.map((item) => {
            const isSelected = selectedSkills.some(
              (skill) => normalizeId(skill.skillId) === normalizeId(item.skillId),
            );

            return (
              <button
                className={isSelected ? "selected" : ""}
                onClick={() => handleSkillToggle(item)}
                key={item.skillId}
                type="button"
              >
                <span />
                {item.name}
              </button>
            );
          })}
        {!loadingSkills && !filteredSkills.length && <span>Không có kỹ năng phù hợp</span>}
      </div>

      {selectedSkills.length > 0 && (
        <div className="selected-skill-list">
          {selectedSkills.map((skill) => (
            <div className="selected-skill-row" key={skill.skillId}>
              <strong>{skill.name}</strong>
              <button
                className={skill.primary ? "primary-skill-btn active" : "primary-skill-btn"}
                type="button"
                onClick={() => handlePrimarySkillChange(skill.skillId)}
              >
                {skill.primary ? "Kỹ năng chính" : "Đặt làm chính"}
              </button>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={skill.weight}
                onChange={(event) => handleSkillWeightChange(skill.skillId, event.target.value)}
                placeholder="0 đến 1"
              />
              <button type="button" onClick={() => handleSkillToggle(skill)}>
                Bỏ chọn
              </button>
            </div>
          ))}
          <div
            className={
              isSkillWeightSumValid
                ? "skill-weight-sum"
                : "skill-weight-sum invalid"
            }
          >
            <span>Tổng trọng số</span>
            <strong>{skillWeightSum.toFixed(2)} / 1.00</strong>
            {!isSkillWeightSumValid && <small>Tổng trọng số phải bằng 1.</small>}
          </div>
        </div>
      )}
    </div>
  );

  if (isPageVariant) {
    return (
      <QuestionFormPage
        submitting={submitting}
        submitError={submitError}
        formError={formError}
        formErrorRef={formErrorRef}
        question={question}
        setQuestion={setQuestion}
        explanation={explanation}
        setExplanation={setExplanation}
        editorKey={editorKey}
        isQuestionFilled={isQuestionFilled}
        subjectChapterFields={subjectChapterFields}
        difficultyField={difficultyField}
        skillsField={skillsField}
        answers={answers}
        correctIndex={correctIndex}
        setCorrectIndex={setCorrectIndex}
        handleAnswerChange={handleAnswerChange}
        handleAddAnswer={handleAddAnswer}
        handleRemoveAnswer={handleRemoveAnswer}
        skillSearchRef={skillSearchRef}
        selectedSkills={selectedSkills}
        skillWeightSum={skillWeightSum}
        isSkillWeightSumValid={isSkillWeightSumValid}
        isReadyToSubmit={isReadyToSubmit}
        selectedSubject={selectedSubject}
        selectedChapter={selectedChapter}
        completedAnswerCount={completedAnswerCount}
        correctAnswerLabel={correctAnswerLabel}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className="question-form-modal question-builder question-builder-modal">
        <div className="question-form-header question-builder-header">
          <div>
            <span className="question-builder-kicker">
              {isEdit ? "Chỉnh sửa câu hỏi" : "Câu hỏi mới"}
            </span>
            <h2 id={titleId}>{isEdit ? "Cập nhật câu hỏi" : "Thêm câu hỏi mới"}</h2>
            <p>
              {isEdit
                ? "Chỉnh sửa nội dung, đáp án và giải thích của câu hỏi"
                : "Tạo câu hỏi mới và gắn vào môn học/chương"}
            </p>
          </div>
          <button className="preview-toggle" onClick={() => setPreview((value) => !value)} type="button">
            {preview ? <EyeOff size={18} /> : <Eye size={18} />}
            {preview ? "Ẩn xem trước" : "Xem trước"}
          </button>
        </div>

        <div className="question-builder-layout">
          <div className="question-builder-main">
            <div className="question-form-body">
              {preview ? (
                <div className="question-preview-card">
                  <div className="preview-card-head">
                    <h3>Xem trước câu hỏi</h3>
                    <span className={`preview-difficulty ${difficultyTone}`}>
                      {difficultyLabel}
                    </span>
                  </div>
                  {isQuestionFilled ? (
                    <RichTextView content={question} contentFormat={FORMAT_BLOCKNOTE} />
                  ) : (
                    <p>Nội dung câu hỏi...</p>
                  )}
                  <div className="preview-options">
                    {answers.map((answer, index) => (
                      <div
                        className={correctIndex === index ? "preview-option correct" : "preview-option"}
                        key={index}
                      >
                        <strong>{String.fromCharCode(65 + index)}.</strong>
                        <span>
                          {isAnswerFilled(answer) ? (
                            <RichTextView
                              content={answer}
                              contentFormat={FORMAT_BLOCKNOTE}
                              variant="inline"
                            />
                          ) : (
                            `Đáp án ${String.fromCharCode(65 + index)}`
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <section className="question-section question-section-primary">
                    <div className="question-section-head">
                      <span>01</span>
                      <div>
                        <h3>Nội dung</h3>
                        <p>Câu hỏi và giải thích</p>
                      </div>
                    </div>
                    <div className="form-field full">
                      <span>Nội dung câu hỏi *</span>
                      <RichTextEditor
                        key={`${editorKey}-question`}
                        value={question}
                        disabled={submitting}
                        onChange={({ content }) => setQuestion(content)}
                      />
                      {!isQuestionFilled && <small>Trường này là bắt buộc</small>}
                    </div>

                    <div className="form-field full">
                      <span>Giải thích</span>
                      <RichTextEditor
                        key={`${editorKey}-explanation`}
                        value={explanation}
                        disabled={submitting}
                        onChange={({ content }) => setExplanation(content)}
                      />
                    </div>
                  </section>

                  <section className="question-section">
                    <div className="question-section-head">
                      <span>02</span>
                      <div>
                        <h3>Phân loại</h3>
                        <p>Môn học, chương và độ khó</p>
                      </div>
                    </div>
                    {subjectChapterFields}
                    {difficultyField}
                  </section>

                  <section className="question-section">
                    <div className="question-section-head">
                      <span>03</span>
                      <div>
                        <h3>Kỹ năng</h3>
                        <p>Gắn kỹ năng IRT nếu cần</p>
                      </div>
                    </div>
                    {skillsField}
                  </section>

                  <section className="question-section">
                    <div className="question-section-head">
                      <span>04</span>
                      <div>
                        <h3>Đáp án</h3>
                        <p>Nhập đáp án và đánh dấu đáp án đúng</p>
                      </div>
                    </div>
                    <div className="form-field full">
                      <div className="field-inline-header">
                        <span>Các đáp án *</span>
                        <label className="answer-count-control">
                          <span>Số đáp án</span>
                          <select value={answers.length} onChange={handleAnswerCountChange}>
                            {Array.from(
                              { length: MAX_ANSWER_COUNT - MIN_ANSWER_COUNT + 1 },
                              (_, index) => MIN_ANSWER_COUNT + index,
                            ).map((count) => (
                              <option key={count} value={count}>
                                {count}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="answer-editor">
                        {answers.map((answer, index) => {
                          const answerLabel = String.fromCharCode(65 + index);

                          return (
                            <div
                              className={correctIndex === index ? "answer-row marked-row" : "answer-row"}
                              key={index}
                            >
                              <span className="answer-letter">{answerLabel}</span>
                              {/* key gồm answers.length: editor chỉ đọc value lúc mount, cần remount khi thêm/xóa đáp án */}
                              <RichTextEditor
                                key={`${editorKey}-answer-${answers.length}-${index}`}
                                className="answer-rich-text"
                                variant="inline"
                                value={answer}
                                disabled={submitting}
                                onChange={({ content }) => handleAnswerChange(index, content)}
                              />
                              <button
                                className={correctIndex === index ? "marked" : ""}
                                onClick={() => setCorrectIndex(index)}
                                type="button"
                              >
                                {correctIndex === index ? "Đúng" : "Chọn đúng"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

            {formError && (
              <div className="modal-inline-error" role="alert" ref={formErrorRef}>
                {formError}
              </div>
            )}
            {submitError && <div className="modal-inline-error">{submitError}</div>}

            <div className="question-modal-actions">
              <button className="cancel-btn" onClick={handleCancel} type="button">
                Hủy
              </button>
              <button className="add-btn" onClick={handleSubmit} disabled={submitting} type="button">
                {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm câu hỏi"}
              </button>
            </div>
          </div>

          <aside className="question-builder-side" aria-label="Tóm tắt câu hỏi">
            <div className="question-summary-card">
              <div className="question-summary-head">
                <span className={isReadyToSubmit ? "summary-status ready" : "summary-status"}>
                  {isReadyToSubmit ? "Sẵn sàng lưu" : "Đang soạn"}
                </span>
                <strong>{difficultyLabel}</strong>
              </div>
              <div className="question-summary-rows">
                <div>
                  <span>Môn học</span>
                  <strong>{selectedSubject?.name || "Chưa chọn"}</strong>
                </div>
                <div>
                  <span>Chương</span>
                  <strong>{selectedChapter?.name || "Chưa chọn"}</strong>
                </div>
                <div>
                  <span>Đáp án</span>
                  <strong>{completedAnswerCount}/{answers.length}</strong>
                </div>
                <div>
                  <span>Đáp án đúng</span>
                  <strong>{correctAnswerLabel}</strong>
                </div>
                <div>
                  <span>Kỹ năng</span>
                  <strong>{selectedSkills.length ? `${selectedSkills.length} kỹ năng` : "Không bắt buộc"}</strong>
                </div>
                <div>
                  <span>Trọng số</span>
                  <strong>{selectedSkills.length ? `${skillWeightSum.toFixed(2)} / 1.00` : "Không áp dụng"}</strong>
                </div>
              </div>
            </div>

            <div className="question-side-preview">
              <span className="side-preview-label">Xem nhanh</span>
              {isQuestionFilled ? (
                <RichTextView content={question} contentFormat={FORMAT_BLOCKNOTE} />
              ) : (
                <p>Nội dung câu hỏi sẽ hiển thị tại đây.</p>
              )}
              <div className="side-preview-answers">
                {answers.map((answer, index) => (
                  <span
                    className={correctIndex === index ? "side-preview-answer correct" : "side-preview-answer"}
                    key={index}
                  >
                    {String.fromCharCode(65 + index)}.{" "}
                    {isAnswerFilled(answer) ? (
                      <RichTextView
                        content={answer}
                        contentFormat={FORMAT_BLOCKNOTE}
                        variant="inline"
                      />
                    ) : (
                      "Chưa nhập"
                    )}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
    </div>
  );
}

function QuestionFormPage({
  submitting,
  submitError,
  formError,
  formErrorRef,
  question,
  setQuestion,
  explanation,
  setExplanation,
  editorKey,
  isQuestionFilled,
  subjectChapterFields,
  difficultyField,
  skillsField,
  answers,
  correctIndex,
  setCorrectIndex,
  handleAnswerChange,
  handleAddAnswer,
  handleRemoveAnswer,
  skillSearchRef,
  selectedSkills,
  skillWeightSum,
  isSkillWeightSumValid,
  isReadyToSubmit,
  selectedSubject,
  selectedChapter,
  completedAnswerCount,
  correctAnswerLabel,
  handleCancel,
  handleSubmit,
}) {
  return (
    <div className="adm2-form-grid">
      <div className="admin-section-card adm2-card-pad">
        <div className="adm2-section-heading">
          <h3>Phạm vi</h3>
          <p>Chọn môn học và chương chứa câu hỏi này</p>
        </div>
        {subjectChapterFields}

        <div className="adm2-divider" />

        <div className="form-field full">
          <span>Nội dung câu hỏi *</span>
          <RichTextEditor
            key={`${editorKey}-question`}
            value={question}
            disabled={submitting}
            onChange={({ content }) => setQuestion(content)}
          />
          {!isQuestionFilled && <small>Trường này là bắt buộc</small>}
        </div>

        <div className="adm2-divider" />

        <div className="form-field full">
          <div className="field-inline-header">
            <span>Đáp án · chọn đúng 1</span>
          </div>
          <div className="adm2-answer-options">
            {answers.map((answer, index) => (
              <div className="adm2-answer-option" key={index}>
                <input
                  type="radio"
                  name="correct-answer"
                  className="adm2-answer-radio"
                  checked={correctIndex === index}
                  onChange={() => setCorrectIndex(index)}
                  aria-label={`Đáp án đúng ${String.fromCharCode(65 + index)}`}
                />
                {/* key gồm answers.length: editor chỉ đọc value lúc mount, cần remount khi thêm/xóa đáp án */}
                <RichTextEditor
                  key={`${editorKey}-answer-${answers.length}-${index}`}
                  className="answer-rich-text"
                  variant="inline"
                  value={answer}
                  disabled={submitting}
                  onChange={({ content }) => handleAnswerChange(index, content)}
                />
                <button
                  type="button"
                  className="adm2-answer-remove"
                  onClick={() => handleRemoveAnswer(index)}
                  disabled={answers.length <= MIN_ANSWER_COUNT}
                  aria-label="Xóa đáp án"
                  title="Xóa đáp án"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          {answers.length < MAX_ANSWER_COUNT && (
            <button type="button" className="adm2-text-btn" onClick={handleAddAnswer}>
              <Plus size={14} />
              <span>Thêm đáp án</span>
            </button>
          )}
        </div>

        <div className="adm2-divider" />

        <div className="form-field full">
          <span>Giải thích</span>
          <RichTextEditor
            key={`${editorKey}-explanation`}
            value={explanation}
            disabled={submitting}
            onChange={({ content }) => setExplanation(content)}
          />
        </div>

        {formError && (
          <div className="modal-inline-error" role="alert" ref={formErrorRef}>
            {formError}
          </div>
        )}
        {submitError && <div className="modal-inline-error">{submitError}</div>}

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={handleCancel} type="button">
            Hủy
          </button>
          <button className="add-btn" onClick={handleSubmit} disabled={submitting} type="button">
            {submitting ? "Đang lưu..." : "Lưu câu hỏi"}
          </button>
        </div>
      </div>

      <div className="adm2-aside-stack">
        <div className="adm2-card adm2-aside-card">
          <div className="adm2-section-heading">
            <h3>Thiết lập</h3>
          </div>

          <div className="adm2-setup-block">
            <span className="adm2-setup-label">Độ khó IRT</span>
            {difficultyField}
          </div>

          <div className="adm2-divider" />

          <div className="adm2-setup-block">
            <div className="adm2-setup-label-row">
              <span className="adm2-setup-label">Kỹ năng &amp; trọng số</span>
              <button
                type="button"
                className="adm2-text-btn"
                onClick={() => skillSearchRef.current?.focus()}
              >
                <Plus size={14} />
                <span>Thêm kỹ năng</span>
              </button>
            </div>
            {skillsField}
          </div>

          <div className="adm2-divider" />

          <div className={`adm2-ready-box${isReadyToSubmit ? " is-ready" : ""}${!isSkillWeightSumValid ? " is-invalid" : ""}`}>
            <strong>{isReadyToSubmit ? "✓ Sẵn sàng lưu" : "Đang soạn"}</strong>
            <div className="adm2-ready-rows">
              <div>
                <span>Môn học</span>
                <span>{selectedSubject?.name || "Chưa chọn"}</span>
              </div>
              <div>
                <span>Chương</span>
                <span>{selectedChapter?.name || "Chưa chọn"}</span>
              </div>
              <div>
                <span>Đáp án</span>
                <span>{completedAnswerCount}/{answers.length}</span>
              </div>
              <div>
                <span>Đáp án đúng</span>
                <span>{correctAnswerLabel}</span>
              </div>
              <div>
                <span>Kỹ năng</span>
                <span>{selectedSkills.length ? `${selectedSkills.length} kỹ năng` : "Không bắt buộc"}</span>
              </div>
              <div>
                <span>Trọng số</span>
                <span>{selectedSkills.length ? `${skillWeightSum.toFixed(2)} / 1.00` : "Không áp dụng"}</span>
              </div>
            </div>
          </div>

          <div className="adm2-constraint-box">
            <span className="adm2-constraint-title">Ràng buộc</span>
            <ul>
              <li>2–10 đáp án</li>
              <li>Tổng trọng số kỹ năng = 1</li>
              <li>Đúng 1 kỹ năng chính</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddQuestionModal({ open, onClose, ...props }) {
  const titleId = useId();
  return (
    <Modal open={open} onClose={onClose} labelledById={titleId}>
      <QuestionForm open={open} onClose={onClose} onCancel={onClose} titleId={titleId} {...props} />
    </Modal>
  );
}
