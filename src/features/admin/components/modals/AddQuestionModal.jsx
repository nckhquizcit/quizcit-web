import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";

import Modal from "../ui/Modal";
import { getChaptersBySubject, getSubjects } from "../../../../services/contentService";

const defaultAnswers = ["", "", "", ""];
const difficultyMap = {
  Easy: -1,
  Medium: 0,
  Hard: 1,
};

const normalizeDifficulty = (value) => {
  if (!value) return "Hard";
  if (value === "medium" || value === "Medium") return "Medium";
  if (value === "hard" || value === "Hard") return "Hard";
  return "Easy";
};

const normalizeId = (value) => (value === undefined || value === null ? "" : String(value));

const getSubjectId = (subject) => subject?.subjectId ?? subject?.id;

const getChapterId = (chapter) => chapter?.chapterId ?? chapter?.id;

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

const isOptionCorrect = (option) =>
  Boolean(option?.corrected ?? option?.isCorrect ?? option?.is_correct);

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
  const [explaination, setExplaination] = useState("");
  const [difficulty, setDifficulty] = useState("Hard");
  const [answers, setAnswers] = useState(defaultAnswers);
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
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;

    const nextAnswers =
      initialQuestion?.options?.map((option) => option.content).slice(0, 4) || defaultAnswers;
    const nextCorrectIndex = initialQuestion?.options?.findIndex((option) => isOptionCorrect(option));

    setQuestion(initialQuestion?.content || "");
    setExplaination(initialQuestion?.explaination || "");
    setDifficulty(normalizeDifficulty(initialQuestion?.difficulty));
    setAnswers(nextAnswers.length === 4 ? nextAnswers : [...nextAnswers, ...defaultAnswers].slice(0, 4));
    setCorrectIndex(nextCorrectIndex >= 0 ? nextCorrectIndex : null);
    setSelectedSubjectId(
      normalizeId(
        initialQuestion?.subjectId || getSubjectId(subject) || getSubjectId(subjects[0]),
      ),
    );
    setSelectedChapterId(
      normalizeId(initialQuestion?.chapterId || getChapterId(chapter) || getChapterId(chapters[0])),
    );
    setSubjectSearch("");
    setChapterSearch("");
    setPreview(false);
  }, [chapter, chapters, initialQuestion, open, subject, subjects]);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  const handleAnswerChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjectId(normalizeId(subjectId));
    setSelectedChapterId("");
    setChapterSearch("");
  };

  const handleSubmit = () => {
    onSubmit?.({
      content: question,
      explaination,
      difficulty,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      options: answers.map((answer, index) => ({
        content: answer,
        corrected: correctIndex === index,
        isCorrect: correctIndex === index,
      })),
    });
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
                  value={explaination}
                  onChange={(event) => setExplaination(event.target.value)}
                />
              </label>

              <div className="form-field full">
                <span>Các đáp án *</span>
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

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
          <button className="add-btn" onClick={handleSubmit}>
            {isEdit ? "Cập nhật" : "Thêm câu hỏi"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
