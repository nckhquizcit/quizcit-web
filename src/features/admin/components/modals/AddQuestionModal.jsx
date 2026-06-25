import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";

import Modal from "../ui/Modal";
import { getSkills } from "../../services/skillService";
import { getErrorMessage } from "../../../../services/apiClient";
import { getChaptersBySubject, getSubjects } from "../../../../services/contentService";

const MIN_ANSWER_COUNT = 2;
const MAX_ANSWER_COUNT = 10;
const createEmptyAnswers = (count = MIN_ANSWER_COUNT) => Array.from({ length: count }, () => "");
const difficultyMap = {
  Easy: -1,
  Medium: 0,
  Hard: 1,
};

const normalizeDifficulty = (value) => {
  if (value === -1 || value === "-1") return "Easy";
  if (value === 0 || value === "0") return "Medium";
  if (value === 1 || value === "1") return "Hard";
  if (!value) return "Hard";
  if (value === "medium" || value === "Medium") return "Medium";
  if (value === "hard" || value === "Hard") return "Hard";
  return "Easy";
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

const clampSkillWeight = (value) => {
  if (value === "" || value === null || value === undefined) return "";

  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) return value;

  return String(Math.max(-1, Math.min(1, parsedValue)));
};

const isOptionCorrect = (option) =>
  Boolean(option?.corrected ?? option?.isCorrect ?? option?.is_correct);

const normalizeAnswers = (options = []) => {
  const nextAnswers = options.map((option) => option.content).slice(0, MAX_ANSWER_COUNT);

  if (!nextAnswers.length) {
    return createEmptyAnswers();
  }

  if (nextAnswers.length < MIN_ANSWER_COUNT) {
    return [...nextAnswers, ...createEmptyAnswers(MIN_ANSWER_COUNT - nextAnswers.length)];
  }

  return nextAnswers;
};

export default function AddQuestionModal({
  open,
  onClose,
  subject,
  chapter,
  initialQuestion,
  mode = "create",
  onSubmit,
  subjects = [],
  chapters = [],
}) {
  const isEdit = mode === "edit";
  const [question, setQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("Hard");
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

  useEffect(() => {
    setAvailableSubjects(subjects.map(normalizeSubject));
  }, [subjects]);

  useEffect(() => {
    setAvailableChapters(
      chapters.map((item) => normalizeChapter(item, normalizeId(getSubjectId(subject)))),
    );
  }, [chapters, subject]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadSkills = async () => {
      setLoadingSkills(true);

      try {
        const skillData = await getSkills();
        if (cancelled) return;

        setAvailableSkills((skillData || []).map(normalizeSkill));
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
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadSubjects = async () => {
      setLoadingSubjects(true);

      try {
        const subjectData = await getSubjects();
        if (cancelled) return;

        const normalizedSubjects = (subjectData || []).map(normalizeSubject);
        setAvailableSubjects(normalizedSubjects);
        setSelectedSubjectId((currentSubjectId) => {
          const hasCurrent = normalizedSubjects.some(
            (item) => normalizeId(item.subjectId) === normalizeId(currentSubjectId),
          );

          if (hasCurrent) return currentSubjectId;

          return normalizeId(
            initialQuestion?.subjectId || getSubjectId(subject) || normalizedSubjects[0]?.subjectId,
          );
        });
      } catch {
        if (!cancelled) {
          setAvailableSubjects(subjects.map(normalizeSubject));
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

    const nextAnswers = normalizeAnswers(initialQuestion?.options);
    const nextCorrectIndex = initialQuestion?.options?.findIndex((option) => isOptionCorrect(option));

    setQuestion(initialQuestion?.content || "");
    setExplanation(initialQuestion?.explanation || initialQuestion?.explaination || "");
    setDifficulty(normalizeDifficulty(initialQuestion?.difficulty ?? initialQuestion?.difficultyB));
    setAnswers(nextAnswers);
    setCorrectIndex(nextCorrectIndex >= 0 && nextCorrectIndex < nextAnswers.length ? nextCorrectIndex : null);
    setSelectedSubjectId(
      normalizeId(
        initialQuestion?.subjectId || getSubjectId(subject) || getSubjectId(subjects[0]),
      ),
    );
    setSelectedChapterId(
      normalizeId(initialQuestion?.chapterId || getChapterId(chapter) || getChapterId(chapters[0])),
    );
    setSelectedSkills(normalizeQuestionSkills(initialQuestion?.skills || initialQuestion?.questionSkills));
    setSubjectSearch("");
    setChapterSearch("");
    setSkillSearch("");
    setPreview(false);
    setSubmitting(false);
    setSubmitError("");
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

  const filteredSkills = useMemo(() => {
    const keyword = skillSearch.trim().toLowerCase();

    if (!keyword) return availableSkills;

    return availableSkills.filter((item) => item.name?.toLowerCase().includes(keyword));
  }, [availableSkills, skillSearch]);

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
          weight: "0",
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
          ? { ...skill, weight: clampSkillWeight(value) }
          : skill,
      ),
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!question.trim()) {
      window.alert("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    if (!selectedSubjectId || !selectedChapterId) {
      window.alert("Vui lòng chọn môn học và chương cho câu hỏi.");
      return;
    }

    if (answers.some((answer) => !answer.trim())) {
      window.alert("Vui lòng nhập đầy đủ nội dung cho tất cả đáp án.");
      return;
    }

    if (correctIndex === null) {
      window.alert("Vui lòng chọn một đáp án đúng.");
      return;
    }

    const invalidSkill = selectedSkills.some((skill) => {
      const weight = Number(skill.weight);
      return skill.weight === "" || Number.isNaN(weight) || weight < -1 || weight > 1;
    });

    if (invalidSkill) {
      window.alert("Trọng số của mỗi kỹ năng phải nằm trong khoảng từ -1 đến 1.");
      return;
    }

    if (selectedSkills.length > 0 && selectedSkills.filter((skill) => skill.primary).length !== 1) {
      window.alert("Vui lòng chọn đúng một kỹ năng chính cho câu hỏi.");
      return;
    }

    const payload = {
      content: question.trim(),
      explanation: explanation.trim(),
      difficulty,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      skills: selectedSkills.map((skill) => ({
        skillId: skill.skillId,
        weight: Number(clampSkillWeight(skill.weight)),
        primary: Boolean(skill.primary),
      })),
      options: answers.map((answer, index) => ({
        content: answer.trim(),
        corrected: correctIndex === index,
        isCorrect: correctIndex === index,
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

  return (
    <Modal open={open} onClose={onClose}>
      <div className="question-form-modal">
        <div className="question-form-header">
          <div>
            <h2>{isEdit ? "Cập nhật câu hỏi" : "Thêm câu hỏi mới"}</h2>
            <p>
              {isEdit
                ? "Chỉnh sửa nội dung, đáp án và giải thích của câu hỏi"
                : "Tạo câu hỏi mới và gắn vào môn học/chương"}
            </p>
          </div>
          <button className="preview-toggle" onClick={() => setPreview((value) => !value)}>
            {preview ? <EyeOff size={18} /> : <Eye size={18} />}
            {preview ? "Ẩn xem trước" : "Xem trước"}
          </button>
        </div>

        <div className="question-form-body">
          {preview ? (
            <div className="question-preview-card">
              <div className="preview-card-head">
                <h3>Xem trước câu hỏi</h3>
                <span className={`preview-difficulty ${difficulty.toLowerCase()}`}>
                  {difficulty}
                </span>
              </div>
              <p>{question || "Nội dung câu hỏi..."}</p>
              <div className="preview-options">
                {answers.map((answer, index) => (
                  <div
                    className={correctIndex === index ? "preview-option correct" : "preview-option"}
                    key={index}
                  >
                    <strong>{String.fromCharCode(65 + index)}.</strong>
                    <span>{answer || `Đáp án ${String.fromCharCode(65 + index)}`}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <label className="form-field full">
                <span>Nội dung câu hỏi *</span>
                <textarea
                  className={!question ? "invalid" : ""}
                  placeholder="Nhập nội dung câu hỏi"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
                {!question && <small>Trường này là bắt buộc</small>}
              </label>

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

              <label className="form-field full">
                <span>Độ khó</span>
                <div className="difficulty-selector">
                  {Object.keys(difficultyMap).map((item) => (
                    <button
                      className={difficulty === item ? item.toLowerCase() : ""}
                      onClick={() => setDifficulty(item)}
                      key={item}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </label>

              <label className="form-field full">
                <span>Giải thích</span>
                <textarea
                  placeholder="Nhập giải thích cho câu hỏi"
                  value={explanation}
                  onChange={(event) => setExplanation(event.target.value)}
                />
              </label>

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
                          min="-1"
                          max="1"
                          step="0.1"
                          value={skill.weight}
                          onChange={(event) => handleSkillWeightChange(skill.skillId, event.target.value)}
                          placeholder="-1 đến 1"
                        />
                        <button type="button" onClick={() => handleSkillToggle(skill)}>
                          Bỏ chọn
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  {answers.map((answer, index) => (
                    <div className="answer-row" key={index}>
                      <input
                        placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                        value={answer}
                        onChange={(event) => handleAnswerChange(index, event.target.value)}
                      />
                      <button
                        className={correctIndex === index ? "marked" : ""}
                        onClick={() => setCorrectIndex(index)}
                        type="button"
                      >
                        {correctIndex === index ? "Đáp án đúng" : "Đáp án"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {submitError && <div className="modal-inline-error">{submitError}</div>}

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
          <button className="add-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm câu hỏi"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
