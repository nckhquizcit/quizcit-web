import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Funnel,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import AddQuestionModal from "../components/modals/AddQuestionModal";
import AdminPageHeader from "../components/AdminPageHeader";
import Modal from "../components/ui/Modal";
import {
  createQuestion,
  deleteQuestion,
  getQuestionsByChapter,
  updateQuestion,
} from "../../../services/quizService";
import { getChaptersBySubject, getSubjects } from "../../../services/contentService";

const normalizeSubject = (subject) => ({
  ...subject,
  subjectId: subject?.subjectId ?? subject?.id,
});

const normalizeChapter = (chapter) => ({
  ...chapter,
  chapterId: chapter?.chapterId ?? chapter?.id,
  subjectId: chapter?.subjectId ?? chapter?.subject?.subjectId ?? chapter?.subject?.id,
});

const getQuestionChapterId = (question) => question?.chapterId ?? question?.chapter?.chapterId ?? question?.chapter?.id;

const getQuestionSubjectId = (question) =>
  question?.subjectId ??
  question?.subject?.subjectId ??
  question?.subject?.id ??
  question?.chapter?.subjectId ??
  question?.chapter?.subject?.subjectId ??
  question?.chapter?.subject?.id;

const enrichQuestion = (question, chapterMap, subjectMap) => {
  const chapterKey = getQuestionChapterId(question);
  const subjectKey = getQuestionSubjectId(question) ?? chapterMap.get(chapterKey)?.subjectId;

  return {
    ...question,
    chapterId: chapterKey,
    subjectId: subjectKey,
    chapter: question?.chapter ?? chapterMap.get(chapterKey),
    subject: question?.subject ?? subjectMap.get(subjectKey),
  };
};

const loadQuestionsFromChapters = async (chapterList, selectedSubjectId, selectedChapterId) => {
  const normalizedChapters = (chapterList || []).map(normalizeChapter);
  const chaptersToLoad = selectedChapterId
    ? normalizedChapters.filter((chapter) => chapter.chapterId === selectedChapterId)
    : selectedSubjectId
      ? normalizedChapters.filter((chapter) => chapter.subjectId === selectedSubjectId)
      : normalizedChapters;

  if (!chaptersToLoad.length) {
    return { chapters: normalizedChapters, questions: [] };
  }

  const questionGroups = await Promise.all(
    chaptersToLoad.map(async (chapter) => {
      const questions = (await getQuestionsByChapter(chapter.chapterId)) || [];
      return questions.map((question) => ({ ...question, chapterId: question.chapterId ?? chapter.chapterId }));
    }),
  );

  return {
    chapters: normalizedChapters,
    questions: questionGroups.flat(),
  };
};

function DeleteQuestionModal({ open, question, onCancel, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="question-modal delete-question-modal">
        <h2>Xóa câu hỏi</h2>
        <p>Bạn có muốn xóa câu hỏi này không?</p>

        {question && (
          <div className="delete-question-preview">
            <strong>{question.content}</strong>
            <span>
              {question.subject?.name} • {question.chapter?.name}
            </span>
          </div>
        )}

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Không
          </button>
          <button className="danger-btn" onClick={onConfirm}>
            Có
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminQuestions() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [questionRows, setQuestionRows] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [openAddQuestion, setOpenAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(null);

  useEffect(() => {
    const load = async () => {
      const subjectData = await getSubjects();
      const normalizedSubjects = (subjectData || []).map(normalizeSubject);
      const chapterGroups = await Promise.all(
        normalizedSubjects.map(async (subject) => ({
          subjectId: subject.subjectId,
          chapters: (await getChaptersBySubject(subject.subjectId)) || [],
        })),
      );
      const allChapters = chapterGroups.flatMap((group) => group.chapters || []);
      const { chapters: normalizedChapters, questions } = await loadQuestionsFromChapters(
        allChapters,
        subjectId,
        chapterId,
      );
      const chapterMap = new Map(normalizedChapters.map((chapter) => [chapter.chapterId, chapter]));
      const subjectMap = new Map(normalizedSubjects.map((subject) => [subject.subjectId, subject]));

      setSubjects(normalizedSubjects);
      setChapters(
        subjectId
          ? normalizedChapters.filter((chapter) => chapter.subjectId === subjectId)
          : normalizedChapters,
      );
      setQuestionRows(questions.map((question) => enrichQuestion(question, chapterMap, subjectMap)));
    };
    load();
  }, [chapterId, subjectId]);

  const filteredQuestions = useMemo(
    () =>
      questionRows.filter((question) =>
        question.content.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [questionRows, search],
  );

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / 10));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * 10;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + 10);
  const displayStart = filteredQuestions.length ? startIndex + 1 : 0;
  const displayEnd = startIndex + paginatedQuestions.length;

  const selectedSubject = subjects.find((subject) => subject.subjectId === subjectId);
  const selectedChapter = chapters.find((chapter) => chapter.chapterId === chapterId);
  const chapterMap = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.chapterId, chapter])),
    [chapters],
  );
  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.subjectId, subject])),
    [subjects],
  );

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleCreateQuestion = async (formValues) => {
    const created = await createQuestion({
      subjectId: formValues.subjectId,
      chapterId: formValues.chapterId,
      content: formValues.content,
      explanation: formValues.explaination,
      difficultyB: formValues.difficulty === "Easy" ? -1 : formValues.difficulty === "Medium" ? 0 : 1,
      options: formValues.options,
    });
    setQuestionRows((currentRows) => [enrichQuestion(created, chapterMap, subjectMap), ...currentRows]);
    setOpenAddQuestion(false);
    setPage(1);
  };

  const handleUpdateQuestion = async (formValues) => {
    await updateQuestion(editingQuestion.questionId, {
      content: formValues.content,
      explanation: formValues.explaination,
      difficultyB: formValues.difficulty === "Easy" ? -1 : formValues.difficulty === "Medium" ? 0 : 1,
      options: formValues.options,
    });
    const latest = await getQuestionsByChapter(editingQuestion.chapterId ?? chapterId);
    setQuestionRows((currentRows) => {
      const remainingRows = currentRows.filter((question) => question.questionId !== editingQuestion.questionId);
      const chapterRows = (latest || []).map((question) =>
        enrichQuestion(question, chapterMap, subjectMap),
      );

      return [...remainingRows, ...chapterRows];
    });
    setEditingQuestion(null);
  };

  const handleSoftDelete = () => {
    setDeletingQuestion(null);
  };

  const handleHardDelete = async () => {
    await deleteQuestion(deletingQuestion.questionId);
    setQuestionRows((currentRows) =>
      currentRows.filter((question) => question.questionId !== deletingQuestion.questionId),
    );
    setDeletingQuestion(null);
  };

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Ngân hàng câu hỏi"]}
        title="Ngân hàng câu hỏi"
        subtitle="Quản lý tập trung tất cả câu hỏi trong hệ thống"
        icon={<Database size={22} />}
        action={
          <div className="question-bank-actions">
            <button className="add-btn" onClick={() => setOpenAddQuestion(true)}>
              <Plus size={18} />
              Thêm câu hỏi
            </button>
          </div>
        }
      />

      <div className="question-bank-filter">
        <div className="bank-search">
          <Search size={24} />
          <input
            value={search}
            placeholder="Tìm kiếm câu hỏi theo nội dung..."
            onChange={handleSearchChange}
          />
        </div>
        <button className="filter-btn">
          <Funnel size={18} />
          Lọc
        </button>
      </div>

      <span className="question-count">
        Hiển thị {displayStart}-{displayEnd} / {filteredQuestions.length} câu hỏi
      </span>

      <div className="question-bank-table">
        <table>
          <thead>
            <tr>
              <th>Câu hỏi</th>
              <th>Độ khó</th>
              <th>Cập nhật</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuestions.map((question, index) => (
              <tr key={question.questionId}>
                <td>
                  <div className="bank-question-cell">
                    <span className="bank-question-index">{startIndex + index + 1}</span>
                    <div>
                      <strong>{question.content}</strong>
                      <div className="question-tags">
                        <span>Môn: {question.subject?.name || "-"}</span>
                        <span>Chương: {question.chapter?.name || "-"}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="difficulty-pill">
                    {question.difficultyB ?? 0}
                  </span>
                </td>
                <td>-</td>
                <td>
                  <div className="table-actions">
                    <button
                      aria-label="Chỉnh sửa câu hỏi"
                      onClick={() => setEditingQuestion(question)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button aria-label="Xóa câu hỏi" onClick={() => setDeletingQuestion(question)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="question-pagination">
        <button disabled={safePage === 1} onClick={() => setPage((value) => value - 1)}>
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            className={safePage === index + 1 ? "active" : ""}
            onClick={() => setPage(index + 1)}
            key={index + 1}
          >
            {index + 1}
          </button>
        ))}
        <button disabled={safePage === totalPages} onClick={() => setPage((value) => value + 1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      {chapterId && (
        <button
          className="back-to-chapters"
          onClick={() => navigate(`/admin/subjects/${subjectId}/chapters`)}
        >
          Quay lại danh sách chương
        </button>
      )}

      <AddQuestionModal
        open={openAddQuestion}
        onClose={() => setOpenAddQuestion(false)}
        subject={selectedSubject}
        chapter={selectedChapter}
        onSubmit={handleCreateQuestion}
        subjects={subjects}
        chapters={chapters}
      />
      <AddQuestionModal
        open={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        initialQuestion={editingQuestion}
        mode="edit"
        onSubmit={handleUpdateQuestion}
        subjects={subjects}
        chapters={chapters}
      />
      <DeleteQuestionModal
        open={Boolean(deletingQuestion)}
        question={deletingQuestion}
        onCancel={handleSoftDelete}
        onConfirm={handleHardDelete}
        onClose={() => setDeletingQuestion(null)}
      />
    </>
  );
}
