import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";

import Modal from "../ui/Modal";

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
  const [difficulty, setDifficulty] = useState("Hard");
  const [questionType, setQuestionType] = useState("Trắc nghiệm");
  const [status, setStatus] = useState("Bản nháp");
  const [answers, setAnswers] = useState(defaultAnswers);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subject?.subjectId || subjects[0]?.subjectId);
  const [selectedChapterId, setSelectedChapterId] = useState(chapter?.chapterId || chapters[0]?.chapterId);
  const [preview, setPreview] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;

    const nextAnswers =
      initialQuestion?.options?.map((option) => option.content).slice(0, 4) || defaultAnswers;
    const nextCorrectIndex = initialQuestion?.options?.findIndex((option) => option.isCorrect);

    setQuestion(initialQuestion?.content || "");
    setDifficulty(normalizeDifficulty(initialQuestion?.difficulty));
    setQuestionType(initialQuestion?.type || "Trắc nghiệm");
    setStatus(initialQuestion?.status || "Bản nháp");
    setAnswers(nextAnswers.length === 4 ? nextAnswers : [...nextAnswers, ...defaultAnswers].slice(0, 4));
    setCorrectIndex(nextCorrectIndex >= 0 ? nextCorrectIndex : null);
    setSelectedSubjectId(initialQuestion?.subjectId || subject?.subjectId || subjects[0]?.subjectId);
    setSelectedChapterId(initialQuestion?.chapterId || chapter?.chapterId || chapters[0]?.chapterId);
    setPreview(false);
  }, [chapter?.chapterId, chapters, initialQuestion, open, subject?.subjectId, subjects]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const availableChapters = useMemo(
    () => chapters.filter((item) => item.subjectId === selectedSubjectId),
    [chapters, selectedSubjectId],
  );

  const handleAnswerChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjectId(subjectId);
    const firstChapter = chapters.find((item) => item.subjectId === subjectId);
    setSelectedChapterId(firstChapter?.chapterId);
  };

  const handleSubmit = () => {
    onSubmit?.({
      content: question,
      difficulty,
      type: questionType === "Trắc nghiệm" ? "MCQ" : questionType,
      status,
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      options: answers.map((answer, index) => ({
        content: answer,
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
                ? "Chỉnh sửa nội dung, đáp án và trạng thái câu hỏi"
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
                    <input placeholder="Tìm môn học..." />
                  </div>
                  <div className="choice-list">
                    {subjects.map((item) => (
                      <button
                        className={selectedSubjectId === item.subjectId ? "selected" : ""}
                        onClick={() => handleSubjectToggle(item.subjectId)}
                        key={item.subjectId}
                      >
                        <span />
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <span>
                    Chương * <b>(Bắt buộc)</b>
                  </span>
                  <div className="mini-search">
                    <Search size={18} />
                    <input placeholder="Tìm chương..." />
                  </div>
                  <div className="choice-list">
                    {availableChapters.map((item) => (
                      <button
                        className={selectedChapterId === item.chapterId ? "selected" : ""}
                        onClick={() => setSelectedChapterId(item.chapterId)}
                        key={item.chapterId}
                      >
                        <span />
                        {item.name}
                      </button>
                    ))}
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
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </label>

              <div className="two-column compact">
                <label className="form-field">
                  <span>Loại câu hỏi</span>
                  <select
                    value={questionType}
                    onChange={(event) => setQuestionType(event.target.value)}
                  >
                    <option>Trắc nghiệm</option>
                    <option>Đúng/Sai</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Trạng thái</span>
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option>Bản nháp</option>
                    <option>Published</option>
                    <option>Unpublished</option>
                  </select>
                </label>
              </div>

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
                      >
                        {correctIndex === index ? "Đã đánh dấu" : "Đánh dấu"}
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
