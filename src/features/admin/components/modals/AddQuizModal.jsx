import { useEffect, useMemo, useState } from "react";
import { FileUp, Upload } from "lucide-react";

import { adminQuizService } from "../../services/quizService";
import Modal from "../ui/Modal";

const quizTypeOptions = [
  { label: "Cố định", value: "FIXED" },
  { label: "Tự động", value: "GENERATED" },
];

export default function AddQuizModal({ open, onClose, mode = "create", initialQuiz, onSubmit }) {
  const isEdit = mode === "edit";
  const subjects = useMemo(() => adminQuizService.getSubjects(), []);
  const allQuestions = useMemo(() => adminQuizService.getQuestions(), []);
  const [activeTab, setActiveTab] = useState("manual");
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id);
  const [chapterId, setChapterId] = useState("");
  const [type, setType] = useState("FIXED");
  const [duration, setDuration] = useState("");
  const [questionFilterChapterId, setQuestionFilterChapterId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  const availableChapters = useMemo(
    () => adminQuizService.getChaptersBySubject(subjectId),
    [subjectId],
  );

  const visibleQuestions = useMemo(
    () =>
      allQuestions.filter((question) => {
        const matchSubject = question.subject?.id === subjectId;
        const matchChapter =
          !questionFilterChapterId || question.chapterId === questionFilterChapterId;

        return matchSubject && matchChapter;
      }),
    [allQuestions, questionFilterChapterId, subjectId],
  );

  useEffect(() => {
    if (!open) return;

    const fallbackSubjectId = initialQuiz?.subjectId || initialQuiz?.subject?.id || subjects[0]?.id;
    const fallbackChapters = adminQuizService.getChaptersBySubject(fallbackSubjectId);
    const fallbackChapterId =
      initialQuiz?.chapterId || initialQuiz?.chapter?.id || fallbackChapters[0]?.id || "";

    setActiveTab("manual");
    setName(initialQuiz?.name || "");
    setSubjectId(fallbackSubjectId);
    setChapterId(fallbackChapterId);
    setType(initialQuiz?.type || "FIXED");
    setDuration(initialQuiz?.duration || "");
    setQuestionFilterChapterId("");
    setSelectedQuestionIds(initialQuiz?.questionIds || allQuestions.slice(0, 10).map((item) => item.id));
  }, [allQuestions, initialQuiz, open, subjects]);

  const handleSubjectChange = (nextSubjectId) => {
    const nextChapters = adminQuizService.getChaptersBySubject(nextSubjectId);
    setSubjectId(nextSubjectId);
    setChapterId(nextChapters[0]?.id || "");
    setQuestionFilterChapterId("");
    setSelectedQuestionIds([]);
  };

  const handleToggleQuestion = (questionId) => {
    setSelectedQuestionIds((currentIds) =>
      currentIds.includes(questionId)
        ? currentIds.filter((id) => id !== questionId)
        : [...currentIds, questionId],
    );
  };

  const handleSelectAll = () => {
    setSelectedQuestionIds(visibleQuestions.map((question) => question.id));
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds([]);
  };

  const handleSubmit = () => {
    onSubmit?.({
      name,
      subjectId,
      chapterId,
      type,
      duration,
      questionIds: selectedQuestionIds,
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="quiz-form-modal">
        <div className="quiz-form-header">
          <h2>{isEdit ? "Sửa đề thi" : "Thêm đề thi mới"}</h2>
        </div>

        <div className="quiz-tabs">
          <button
            className={activeTab === "manual" ? "active" : ""}
            onClick={() => setActiveTab("manual")}
          >
            Tạo thủ công
          </button>
          <button
            className={activeTab === "import" ? "active" : ""}
            onClick={() => setActiveTab("import")}
          >
            Import từ file
          </button>
        </div>

        <div className="quiz-form-body">
          {activeTab === "manual" ? (
            <>
              <label className="quiz-field full">
                <span>Tên đề thi *</span>
                <input
                  value={name}
                  placeholder="Nhập tên đề thi..."
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <div className="quiz-two-column">
                <label className="quiz-field">
                  <span>Môn học *</span>
                  <select
                    value={subjectId}
                    onChange={(event) => handleSubjectChange(event.target.value)}
                  >
                    {subjects.map((subject) => (
                      <option value={subject.id} key={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="quiz-field">
                  <span>Chương *</span>
                  <select value={chapterId} onChange={(event) => setChapterId(event.target.value)}>
                    {availableChapters.map((chapter) => (
                      <option value={chapter.id} key={chapter.id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="quiz-two-column">
                <label className="quiz-field">
                  <span>Loại đề thi *</span>
                  <select value={type} onChange={(event) => setType(event.target.value)}>
                    {quizTypeOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="quiz-field">
                  <span>Thời gian (phút) *</span>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    placeholder="Nhập thời gian làm bài..."
                    onChange={(event) => setDuration(event.target.value)}
                  />
                </label>
              </div>

              <div className="quiz-question-head">
                <strong>Chọn câu hỏi * ({selectedQuestionIds.length} câu đã chọn)</strong>
                <div>
                  <button onClick={handleSelectAll}>Chọn tất cả</button>
                  <button onClick={handleClearSelection}>Bỏ chọn</button>
                </div>
              </div>

              <label className="quiz-field full">
                <span>Lọc theo chương</span>
                <select
                  value={questionFilterChapterId}
                  onChange={(event) => setQuestionFilterChapterId(event.target.value)}
                >
                  <option value="">Tất cả chương</option>
                  {availableChapters.map((chapter) => (
                    <option value={chapter.id} key={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="quiz-question-list">
                {visibleQuestions.map((question) => (
                  <button
                    className={
                      selectedQuestionIds.includes(question.id)
                        ? "quiz-question-item selected"
                        : "quiz-question-item"
                    }
                    onClick={() => handleToggleQuestion(question.id)}
                    key={question.id}
                  >
                    <span className="quiz-checkmark">
                      {selectedQuestionIds.includes(question.id) && "✓"}
                    </span>
                    <span className="quiz-question-content">
                      <strong>{question.content}</strong>
                      <span>
                        <em>{question.difficultyLabel}</em>
                        {question.options?.length || 0} đáp án
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="quiz-import-zone">
                <FileUp size={58} />
                <strong>Import đề thi từ file JSON</strong>
                <span>Tải lên file JSON chứa thông tin đề thi và danh sách câu hỏi</span>
                <label>
                  <Upload size={18} />
                  Chọn file
                  <input type="file" accept=".json" />
                </label>
              </div>

              <div className="quiz-json-sample">
                <strong>Định dạng file JSON mẫu:</strong>
                <pre>{`{
  "name": "Kiểm tra Chương 2",
  "subject_id": "s1",
  "chapter_id": "c2",
  "type": "FIXED",
  "duration": 1200,
  "questions": ["q1", "q2", "q3"]
}`}</pre>
              </div>
            </>
          )}
        </div>

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
          <button className="add-btn" onClick={handleSubmit}>
            {isEdit ? "Lưu thay đổi" : "Thêm đề thi"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
