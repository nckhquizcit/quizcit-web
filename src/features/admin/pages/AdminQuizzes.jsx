import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";

import "../Admin.css";
import AddQuizModal from "../components/modals/AddQuizModal";
import AdminPageHeader from "../components/AdminPageHeader";
import { getChaptersBySubject, getSubjects } from "../../../services/contentService";
import { createQuiz, deleteQuiz, getQuizzesByChapter, updateQuiz } from "../../../services/quizService";

export default function AdminQuizzes() {
  const [quizRows, setQuizRows] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [openAddQuiz, setOpenAddQuiz] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  useEffect(() => {
    const load = async () => {
      const subjectData = (await getSubjects()) || [];
      setSubjects(subjectData);
      const chapterList = (await Promise.all(
        subjectData.map((subject) => getChaptersBySubject(subject.subjectId)),
      )).flat();
      setChapters(chapterList);
      const quizzes = (
        await Promise.all(chapterList.map((chapter) => getQuizzesByChapter(chapter.chapterId)))
      ).flat();
      setQuizRows(quizzes || []);
    };
    load();
  }, []);

  const chapterMap = useMemo(
    () => Object.fromEntries(chapters.map((chapter) => [chapter.chapterId, chapter])),
    [chapters],
  );
  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [subject.subjectId, subject])),
    [subjects],
  );

  const handleCreateQuiz = async (formValues) => {
    const created = await createQuiz({
      name: formValues.name,
      subjectId: formValues.subjectId,
      chapterId: formValues.chapterId,
      type: formValues.type,
      duration: Number(formValues.duration),
      totalQuestion: Number(formValues.questionIds?.length || 0),
    });
    setQuizRows((currentRows) => [created, ...currentRows]);
    setOpenAddQuiz(false);
  };

  const handleUpdateQuiz = async (formValues) => {
    await updateQuiz(editingQuiz.quizId, {
      name: formValues.name,
      duration: Number(formValues.duration),
      chapterId: formValues.chapterId,
    });
    const refreshed = await getQuizzesByChapter(formValues.chapterId);
    setQuizRows((currentRows) =>
      [...(currentRows.filter((q) => q.quizId !== editingQuiz.quizId) || []), ...(refreshed || [])],
    );
    setEditingQuiz(null);
  };

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Quản lý đề thi"]}
        title="Quản lý đề thi"
        subtitle="Quản lý các đề thi và bài kiểm tra"
        icon={<ClipboardList size={22} />}
        action={
          <button className="add-btn" onClick={() => setOpenAddQuiz(true)}>
            <Plus size={18} />
            Thêm đề thi
          </button>
        }
      />

      <section className="quiz-table-card">
        <h3>Danh sách đề thi</h3>

        <div className="quiz-table-wrap">
          <table className="quiz-table">
            <thead>
              <tr>
                <th>Tên đề</th>
                <th>Môn học</th>
                <th>Chương</th>
                <th>Loại đề</th>
                <th>Số câu hỏi</th>
                <th>Thời gian</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {quizRows.map((quiz) => (
                <tr key={quiz.quizId}>
                  <td>
                    <strong>{quiz.name}</strong>
                  </td>
                  <td>{subjectMap[quiz.subjectId]?.name || "-"}</td>
                  <td>{chapterMap[quiz.chapterId]?.name || "-"}</td>
                  <td>
                    <span className={quiz.type === "FIXED" ? "quiz-type fixed" : "quiz-type generated"}>
                      {quiz.type}
                    </span>
                  </td>
                  <td>{quiz.totalQuestion}</td>
                  <td>{quiz.duration} phút</td>
                  <td>
                    <div className="quiz-actions">
                      <button className="quiz-edit-btn" onClick={() => setEditingQuiz(quiz)}>
                        <Pencil size={18} />
                        Sửa
                      </button>
                      <button
                        className="quiz-delete-btn"
                        type="button"
                        onClick={async () => {
                          await deleteQuiz(quiz.quizId);
                          setQuizRows((currentRows) =>
                            currentRows.filter((row) => row.quizId !== quiz.quizId),
                          );
                        }}
                      >
                        <Trash2 size={18} />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AddQuizModal
        open={openAddQuiz}
        onClose={() => setOpenAddQuiz(false)}
        onSubmit={handleCreateQuiz}
        subjects={subjects}
        chapters={chapters}
      />
      <AddQuizModal
        open={Boolean(editingQuiz)}
        onClose={() => setEditingQuiz(null)}
        initialQuiz={editingQuiz}
        mode="edit"
        onSubmit={handleUpdateQuiz}
        subjects={subjects}
        chapters={chapters}
      />
    </>
  );
}
