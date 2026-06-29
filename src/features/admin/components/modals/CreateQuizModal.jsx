import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Shuffle } from "lucide-react";
import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getChaptersBySubject } from "../../../../services/contentService";
import { getErrorMessage } from "../../../../services/apiClient";
import { createQuiz, getQuestionsByChapter } from "../../services/quizService";

const getSubjectId = (subject) => String(subject?.subjectId ?? subject?.id ?? "");
const getChapterId = (chapter) => String(chapter?.chapterId ?? chapter?.id ?? "");
const getQuestionId = (question) => String(question?.questionId ?? question?.id ?? "");

function pickRandomIds(questionIds, count) {
  const shuffled = [...questionIds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

export function CreateQuizForm({
  open = true,
  onClose,
  onCancel,
  subjects = [],
  defaultSubjectId = "",
  defaultChapterId = "",
  onCreated,
}) {
  const handleCancel = onCancel || onClose;
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [chapterId, setChapterId] = useState(defaultChapterId);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [quizName, setQuizName] = useState("");
  const [duration, setDuration] = useState(30);
  const [randomCount, setRandomCount] = useState("");
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubjectId(defaultSubjectId || getSubjectId(subjects[0]));
    setChapterId(defaultChapterId);
    setQuizName("");
    setDuration(30);
    setSelectedQuestionIds([]);
    setRandomCount("");
    setError("");
  }, [open, defaultSubjectId, defaultChapterId, subjects]);

  useEffect(() => {
    if (!open || !subjectId) {
      setChapters([]);
      return undefined;
    }
    let active = true;
    setIsLoadingChapters(true);
    getChaptersBySubject(subjectId)
      .then((rows) => {
        if (!active) return;
        const list = rows || [];
        setChapters(list);
        setChapterId((current) => {
          const has = list.some((chapter) => getChapterId(chapter) === current);
          return has ? current : getChapterId(list[0]);
        });
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError, "Không thể tải danh sách chương."));
      })
      .finally(() => {
        if (active) setIsLoadingChapters(false);
      });
    return () => {
      active = false;
    };
  }, [open, subjectId]);

  useEffect(() => {
    if (!open || !chapterId) {
      setQuestions([]);
      setSelectedQuestionIds([]);
      return undefined;
    }
    let active = true;
    setIsLoadingQuestions(true);
    getQuestionsByChapter(chapterId)
      .then((rows) => {
        if (!active) return;
        setQuestions(rows || []);
        setSelectedQuestionIds([]);
      })
      .catch(() => {
        if (active) setQuestions([]);
      })
      .finally(() => {
        if (active) setIsLoadingQuestions(false);
      });
    return () => {
      active = false;
    };
  }, [open, chapterId]);

  const allQuestionIds = useMemo(
    () => questions.map((question) => getQuestionId(question)).filter(Boolean),
    [questions],
  );

  const toggleQuestion = (questionId) => {
    setSelectedQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  };

  const handleRandomSelect = () => {
    const count = Number(randomCount);
    if (!count || count < 1) {
      setError("Vui lòng nhập số lượng câu hỏi ngẫu nhiên hợp lệ.");
      return;
    }
    if (count > allQuestionIds.length) {
      setError("Số lượng ngẫu nhiên vượt quá số câu hỏi hiện có.");
      return;
    }
    setError("");
    setSelectedQuestionIds(pickRandomIds(allQuestionIds, count));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!subjectId || !chapterId) {
      setError("Vui lòng chọn môn học và chương.");
      return;
    }
    if (!quizName.trim()) {
      setError("Vui lòng nhập tên đề thi.");
      return;
    }
    if (!selectedQuestionIds.length) {
      setError("Vui lòng chọn ít nhất một câu hỏi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const created = await createQuiz({
        subjectId,
        chapterId,
        name: quizName.trim(),
        duration: Number(duration),
        totalQuestion: selectedQuestionIds.length,
        type: "CHAPTER",
        questionIds: selectedQuestionIds,
      });
      onCreated?.(created, { subjectId, chapterId });
      onClose?.();
    } catch (createError) {
      setError(getErrorMessage(createError, "Không thể tạo đề thi."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModalLayout
        title="Tạo đề thi mới"
        subtitle="Chọn môn học, chương và các câu hỏi để tạo đề thi"
        actions={
          <>
            <button className="cancel-btn" onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </button>
            <button className="add-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Tạo đề thi"}
            </button>
          </>
        }
      >
        {error && <div className="modal-inline-error">{error}</div>}

        <div className="quiz-modal-grid">
          <label className="quiz-field">
            <span>Môn học</span>
            <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
              {subjects.map((subject) => (
                <option key={getSubjectId(subject)} value={getSubjectId(subject)}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label className="quiz-field">
            <span>Chương</span>
            <select
              value={chapterId}
              onChange={(event) => setChapterId(event.target.value)}
              disabled={isLoadingChapters || !chapters.length}
            >
              {chapters.map((chapter) => (
                <option key={getChapterId(chapter)} value={getChapterId(chapter)}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </label>

          <label className="quiz-field">
            <span>Tên đề thi</span>
            <input
              value={quizName}
              onChange={(event) => setQuizName(event.target.value)}
              placeholder="Ví dụ: Kiểm tra chương 1"
            />
          </label>

          <label className="quiz-field">
            <span>Thời gian (phút)</span>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </label>
        </div>

        <div className="quiz-picker">
          <div className="quiz-question-head">
            <strong>Chọn câu hỏi ({selectedQuestionIds.length}/{questions.length})</strong>
            <div className="quiz-picker-tools">
              <input
                type="number"
                min="1"
                value={randomCount}
                onChange={(event) => setRandomCount(event.target.value)}
                placeholder="Số câu ngẫu nhiên"
                className="quiz-random-input"
              />
              <button type="button" className="cancel-btn" onClick={handleRandomSelect}>
                <Shuffle size={16} /> Ngẫu nhiên
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setSelectedQuestionIds(allQuestionIds)}
                disabled={!allQuestionIds.length}
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setSelectedQuestionIds([])}
                disabled={!selectedQuestionIds.length}
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          {isLoadingQuestions ? (
            <div className="quiz-inline-empty">
              <LoaderCircle size={16} className="spin" /> Đang tải câu hỏi...
            </div>
          ) : (
            <div className="quiz-question-list quiz-question-list--scroll">
              {questions.map((question, index) => {
                const questionId = getQuestionId(question);
                const isSelected = selectedQuestionIds.includes(questionId);
                return (
                  <button
                    key={questionId}
                    type="button"
                    className={`quiz-question-item ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleQuestion(questionId)}
                  >
                    <span className="quiz-checkmark">✓</span>
                    <span className="quiz-question-content">
                      <strong>Câu {index + 1}</strong>
                      <span>{question.content}</span>
                    </span>
                  </button>
                );
              })}
              {!questions.length && (
                <div className="quiz-inline-empty">Chưa có câu hỏi nào trong chương này.</div>
              )}
            </div>
          )}
        </div>
    </FormModalLayout>
  );
}

export default function CreateQuizModal({ open, onClose, ...props }) {
  return (
    <Modal open={open} onClose={onClose} containerClassName="quiz-modal">
      <CreateQuizForm open={open} onClose={onClose} onCancel={onClose} {...props} />
    </Modal>
  );
}
