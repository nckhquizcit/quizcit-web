import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, Shuffle } from "lucide-react";
import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";
import { getChaptersBySubject } from "../../../../services/contentService";
import { getErrorMessage } from "../../../../services/apiClient";
import { toPreviewText } from "../../../../components/richtext/richTextUtils";
import { getDifficultyLabelVi, getDifficultyTone } from "../../utils/difficultyLevels";
import { createQuiz, getQuestionsByChapter, updateQuiz } from "../../services/quizService";
import "../../pages/AdminQuizzes.css";

const getSubjectId = (subject) => String(subject?.subjectId ?? subject?.id ?? "");
const getChapterId = (chapter) => String(chapter?.chapterId ?? chapter?.id ?? "");
const getQuestionId = (question) => String(question?.questionId ?? question?.id ?? "");
const EMPTY_LIST = [];

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
  initialQuiz = null,
  initialQuestionIds = EMPTY_LIST,
  onUpdated,
  showQuestions = true,
  variant = "modal",
}) {
  const isEdit = Boolean(initialQuiz);
  const handleCancel = onCancel || onClose;
  const [subjectId, setSubjectId] = useState(defaultSubjectId);
  const [chapterId, setChapterId] = useState(defaultChapterId);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [quizName, setQuizName] = useState("");
  const [duration, setDuration] = useState(30);
  const [displayOrder, setDisplayOrder] = useState("");
  const [randomCount, setRandomCount] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubjectId(initialQuiz?.subjectId || defaultSubjectId || getSubjectId(subjects[0]));
    setChapterId(initialQuiz?.chapterId || defaultChapterId);
    setQuizName(initialQuiz?.name || "");
    setDuration(initialQuiz?.durationMinutes || initialQuiz?.duration || 30);
    setDisplayOrder(initialQuiz?.displayOrder || "");
    setSelectedQuestionIds(initialQuestionIds);
    setRandomCount("");
    setError("");
  }, [open, defaultSubjectId, defaultChapterId, subjects, initialQuiz, initialQuestionIds]);

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
    if (!open || !chapterId || !showQuestions) {
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
        const availableIds = new Set((rows || []).map((question) => getQuestionId(question)));
        setSelectedQuestionIds(
          initialQuiz?.chapterId === chapterId
            ? initialQuestionIds.filter((id) => availableIds.has(id))
            : [],
        );
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
  }, [open, chapterId, initialQuiz, initialQuestionIds, showQuestions]);

  const allQuestionIds = useMemo(
    () => questions.map((question) => getQuestionId(question)).filter(Boolean),
    [questions],
  );

  const filteredQuestions = useMemo(() => {
    const keyword = questionSearch.trim().toLowerCase();
    if (!keyword) return questions;
    return questions.filter((question) => toPreviewText(question.content, question.contentFormat)?.toLowerCase().includes(keyword));
  }, [questions, questionSearch]);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => getSubjectId(subject) === subjectId),
    [subjects, subjectId],
  );
  const selectedChapter = useMemo(
    () => chapters.find((chapter) => getChapterId(chapter) === chapterId),
    [chapters, chapterId],
  );
  const isReadyToCreate = Boolean(
    subjectId && chapterId && quizName.trim() && (!showQuestions || selectedQuestionIds.length),
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
    if (showQuestions && !selectedQuestionIds.length) {
      setError("Vui lòng chọn ít nhất một câu hỏi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const payload = {
        subjectId,
        chapterId,
        name: quizName.trim(),
        duration: Number(duration),
        totalQuestion: showQuestions ? selectedQuestionIds.length : initialQuiz?.totalQuestion,
        type: "CHAPTER",
        questionIds: showQuestions ? selectedQuestionIds : undefined,
        displayOrder: displayOrder ? Number(displayOrder) : null,
      };
      if (isEdit) {
        const updated = await updateQuiz(initialQuiz.quizId, payload);
        onUpdated?.(updated, { subjectId, chapterId });
      } else {
        const created = await createQuiz(payload);
        onCreated?.(created, { subjectId, chapterId });
      }
      onClose?.();
    } catch (createError) {
      setError(getErrorMessage(createError, "Không thể tạo đề thi."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjectField = isEdit ? (
    <label className="quiz-field">
      <span>Môn học</span>
      <input value={`${selectedSubject?.name || "—"} · Đã khóa`} disabled readOnly />
    </label>
  ) : (
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
  );

  const chapterField = (
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
  );

  const nameField = (
    <label className="quiz-field">
      <span>Tên đề</span>
      <input
        value={quizName}
        onChange={(event) => setQuizName(event.target.value)}
        placeholder="Ví dụ: Kiểm tra chương 1"
      />
    </label>
  );

  const durationField = (
    <label className="quiz-field">
      <span>Thời gian (phút)</span>
      <input
        type="number"
        min="1"
        value={duration}
        onChange={(event) => setDuration(event.target.value)}
      />
    </label>
  );

  const orderField = (
    <label className="quiz-field">
      <span>Thứ tự hiển thị</span>
      <input type="number" min="1" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} placeholder="Để trống để xếp cuối" />
    </label>
  );

  if (variant === "edit") {
    return (
      <>
        <div className="adm2-section-heading">
          <h3>Thông tin đề thi</h3>
        </div>

        {error && <div className="modal-inline-error">{error}</div>}

        <div className="adm2-field-row">
          {nameField}
          {subjectField}
        </div>
        <div className="adm2-field-row">
          {chapterField}
          {durationField}
        </div>
        {orderField}

        <div className="adm2-note">
          Môn học không thể đổi sau khi tạo đề. Muốn đổi phạm vi, hãy tạo đề mới.
        </div>

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={handleCancel} disabled={isSubmitting} type="button">
            Hủy
          </button>
          <button className="add-btn" onClick={handleSubmit} disabled={isSubmitting} type="button">
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </>
    );
  }

  if (variant === "page") {
    return (
      <CreateQuizFormPage
        error={error}
        isSubmitting={isSubmitting}
        handleCancel={handleCancel}
        handleSubmit={handleSubmit}
        subjectField={subjectField}
        chapterField={chapterField}
        nameField={nameField}
        durationField={durationField}
        orderField={orderField}
        showQuestions={showQuestions}
        isLoadingQuestions={isLoadingQuestions}
        questions={questions}
        filteredQuestions={filteredQuestions}
        selectedQuestionIds={selectedQuestionIds}
        toggleQuestion={toggleQuestion}
        setSelectedQuestionIds={setSelectedQuestionIds}
        questionSearch={questionSearch}
        setQuestionSearch={setQuestionSearch}
        allQuestionIds={allQuestionIds}
        randomCount={randomCount}
        setRandomCount={setRandomCount}
        handleRandomSelect={handleRandomSelect}
        quizName={quizName}
        duration={duration}
        selectedChapter={selectedChapter}
        selectedSubject={selectedSubject}
        isReadyToCreate={isReadyToCreate}
      />
    );
  }

  return (
    <FormModalLayout
        title={isEdit ? "Chỉnh sửa đề thi" : "Tạo đề thi mới"}
        subtitle={isEdit ? "Cập nhật thông tin và danh sách câu hỏi" : "Chọn môn học, chương và các câu hỏi để tạo đề thi"}
        actions={
          <>
            <button className="cancel-btn" onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </button>
            <button className="add-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo đề thi"}
            </button>
          </>
        }
      >
        {error && <div className="modal-inline-error">{error}</div>}

        <div className="quiz-modal-grid">
          <label className="quiz-field">
            <span>Môn học</span>
            <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={isEdit}>
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
          <label className="quiz-field">
            <span>Thứ tự hiển thị</span>
            <input type="number" min="1" value={displayOrder} onChange={(event) => setDisplayOrder(event.target.value)} placeholder="Để trống để xếp cuối" />
          </label>
        </div>

        {showQuestions && <div className="quiz-picker">
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
                      <span>{toPreviewText(question.content, question.contentFormat)}</span>
                    </span>
                  </button>
                );
              })}
              {!questions.length && (
                <div className="quiz-inline-empty">Chưa có câu hỏi nào trong chương này.</div>
              )}
            </div>
          )}
        </div>}
    </FormModalLayout>
  );
}

function CreateQuizFormPage({
  error,
  isSubmitting,
  handleCancel,
  handleSubmit,
  subjectField,
  chapterField,
  nameField,
  durationField,
  orderField,
  showQuestions,
  isLoadingQuestions,
  questions,
  filteredQuestions,
  selectedQuestionIds,
  toggleQuestion,
  setSelectedQuestionIds,
  questionSearch,
  setQuestionSearch,
  allQuestionIds,
  randomCount,
  setRandomCount,
  handleRandomSelect,
  quizName,
  duration,
  selectedChapter,
  selectedSubject,
  isReadyToCreate,
}) {
  return (
    <div className="adm2-form-grid">
      <div className="admin-section-card adm2-card-pad">
        <div className="adm2-section-heading">
          <h3>Thông tin đề</h3>
        </div>

        <div className="adm2-field-row">
          {subjectField}
          {chapterField}
        </div>
        <div className="adm2-field-row">
          {nameField}
          {durationField}
        </div>
        {orderField}

        {showQuestions && (
          <>
            <div className="adm2-divider" />

            <div className="quiz-question-head">
              <h3>Chọn câu hỏi</h3>
              <span className="quiz-picker-count">
                Đã chọn {selectedQuestionIds.length} / {questions.length}
              </span>
            </div>

            <div className="mini-search">
              <Search size={17} />
              <input
                value={questionSearch}
                onChange={(event) => setQuestionSearch(event.target.value)}
                placeholder="Tìm nội dung câu hỏi..."
              />
            </div>

            {isLoadingQuestions ? (
              <div className="quiz-inline-empty">
                <LoaderCircle size={16} className="spin" /> Đang tải câu hỏi...
              </div>
            ) : (
              <div className="quiz-question-list quiz-question-list--scroll">
                {filteredQuestions.map((question) => {
                  const questionId = getQuestionId(question);
                  const isSelected = selectedQuestionIds.includes(questionId);
                  return (
                    <label
                      key={questionId}
                      className={`quiz-question-checkbox-row ${isSelected ? "selected" : ""}`}
                    >
                      <input type="checkbox" checked={isSelected} onChange={() => toggleQuestion(questionId)} />
                      <span className="quiz-question-content">
                        <span>{toPreviewText(question.content, question.contentFormat)}</span>
                      </span>
                      <span className={`difficulty-pill ${getDifficultyTone(question.difficultyB)}`}>
                        {getDifficultyLabelVi(question.difficultyB)}
                      </span>
                    </label>
                  );
                })}
                {!filteredQuestions.length && (
                  <div className="quiz-inline-empty">
                    {questions.length ? "Không tìm thấy câu hỏi phù hợp." : "Chưa có câu hỏi nào trong chương này."}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && <div className="modal-inline-error">{error}</div>}

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={handleCancel} disabled={isSubmitting} type="button">
            Hủy
          </button>
          <button className="add-btn" onClick={handleSubmit} disabled={isSubmitting} type="button">
            {isSubmitting ? "Đang lưu..." : "Tạo đề thi"}
          </button>
        </div>
      </div>

      <div className="adm2-aside-stack">
        <div className="adm2-card adm2-aside-card">
          <span className="adm2-chip">Tóm tắt</span>
          <h4>{quizName.trim() || "Đề thi chưa đặt tên"}</h4>
          <p>Loại: CHAPTER</p>
          <p>{selectedQuestionIds.length} câu hỏi</p>
          <p>{Number(duration) || 0} phút</p>
          <p>
            {selectedChapter?.name || "Chưa chọn chương"} · {selectedSubject?.name || "Chưa chọn môn"}
          </p>

          <div className={`adm2-ready-box${isReadyToCreate ? " is-ready" : ""}`}>
            <strong>{isReadyToCreate ? "✓ Đủ điều kiện tạo" : "Thiếu thông tin bắt buộc"}</strong>
          </div>
        </div>

        {showQuestions && (
          <div className="adm2-card adm2-aside-card">
            <span className="adm2-chip">Chọn nhanh</span>
            <div className="quiz-quickpick-actions">
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

            <div className="adm2-divider" />

            <span className="adm2-setup-label">
              Random {Number(randomCount) || 0} câu · Lấy ngẫu nhiên từ {allQuestionIds.length} câu
            </span>
            <div className="quiz-quickpick-random-row">
              <input
                type="number"
                min="1"
                value={randomCount}
                onChange={(event) => setRandomCount(event.target.value)}
                placeholder="Số câu"
                className="quiz-random-input"
              />
              <button type="button" className="cancel-btn" onClick={handleRandomSelect} disabled={!allQuestionIds.length}>
                <Shuffle size={15} /> Random
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateQuizModal({ open, onClose, ...props }) {
  return (
    <Modal open={open} onClose={onClose} containerClassName="quiz-modal">
      <CreateQuizForm open={open} onClose={onClose} onCancel={onClose} {...props} />
    </Modal>
  );
}
