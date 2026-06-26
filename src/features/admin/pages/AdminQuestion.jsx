import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Database, Pencil, Plus, Trash2, Upload } from "lucide-react";

import AddQuestionModal from "../components/modals/AddQuestionModal";
import ImportQuestionsModal from "../components/modals/ImportQuestionsModal";
import AdminPageHeader from "../components/AdminPageHeader";
import Modal from "../components/ui/Modal";
import DataTable from "../components/ui/DataTable";
import RowActions from "../components/ui/RowActions";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import { useToast } from "../../../components/ui/Toast/Toast";
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  getQuestionsByChapter,
  updateQuestion,
} from "../../../services/quizService";
import { getErrorMessage } from "../../../services/apiClient";
import { getChaptersBySubject, getSubjects } from "../../../services/contentService";

const getSkillId = (skill) =>
  skill?.skillId ?? skill?.id ?? skill?.skill?.skillId ?? skill?.skill?.id;

const getSkillName = (skill) =>
  skill?.name ?? skill?.skillName ?? skill?.skill?.name ?? "Kỹ năng chưa đặt tên";

const getSkillWeight = (skill) => skill?.weight ?? skill?.skillWeight ?? skill?.questionWeight ?? 0;

const getSkillPrimary = (skill) =>
  Boolean(skill?.primary ?? skill?.isPrimary ?? skill?.is_primary ?? skill?.questionSkill?.primary);

const normalizeQuestionSkills = (skills = []) =>
  skills
    .map((skill, index) => ({
      skillId: getSkillId(skill),
      name: getSkillName(skill),
      weight: getSkillWeight(skill),
      primary: getSkillPrimary(skill) || (index === 0 && !skills.some(getSkillPrimary)),
    }))
    .filter((skill) => skill.skillId);

const normalizeSkillPayload = (skills = []) =>
  skills.map((skill) => ({
    skillId: skill.skillId,
    weight: Number(skill.weight),
    primary: Boolean(skill.primary),
  }));

const getDifficultyLabel = (difficultyB) => {
  if (difficultyB <= -1) return "Easy";
  if (difficultyB >= 1) return "Hard";
  return "Medium";
};

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
    skills: normalizeQuestionSkills(question?.skills ?? question?.questionSkills),
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

function QuestionSkillsModal({ open, question, onClose }) {
  const skills = normalizeQuestionSkills(question?.skills ?? question?.questionSkills);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="question-modal question-skills-modal">
        <h2>Danh sách kỹ năng</h2>
        <p>{question?.content || "Câu hỏi"}</p>

        <div className="question-skill-popup-list">
          {skills.length ? (
            skills.map((skill) => (
              <div className="question-skill-popup-item" key={skill.skillId}>
                <strong>
                  {skill.name}
                  <em className={skill.primary ? "primary" : "secondary"}>
                    {skill.primary ? "Kỹ năng chính" : "Kỹ năng phụ"}
                  </em>
                </strong>
                <span>Trọng số: {skill.weight}</span>
              </div>
            ))
          ) : (
            <span className="question-skill-empty">Câu hỏi này chưa được gắn kỹ năng.</span>
          )}
        </div>

        <div className="question-modal-actions">
          <button className="add-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminQuestions() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [questionRows, setQuestionRows] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openAddQuestion, setOpenAddQuestion] = useState(false);
  const [openImportQuestions, setOpenImportQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loadingEditQuestionId, setLoadingEditQuestionId] = useState("");
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [skillPreviewQuestion, setSkillPreviewQuestion] = useState(null);

  const loadQuestionBank = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
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
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải ngân hàng câu hỏi."));
    } finally {
      setLoading(false);
    }
  }, [chapterId, subjectId]);

  useEffect(() => {
    loadQuestionBank();
  }, [loadQuestionBank]);

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

  const visibleQuestions = useMemo(
    () =>
      questionRows.filter((question) => {
        const matchesSubject = subjectFilter === "ALL" || question.subjectId === subjectFilter;
        const matchesDifficulty =
          difficultyFilter === "ALL" ||
          getDifficultyLabel(question.difficultyB ?? 0) === difficultyFilter;
        return matchesSubject && matchesDifficulty;
      }),
    [questionRows, subjectFilter, difficultyFilter],
  );

  const handleCreateQuestion = async (formValues) => {
    const created = await createQuestion({
      subjectId: formValues.subjectId,
      chapterId: formValues.chapterId,
      content: formValues.content,
      explanation: formValues.explanation,
      difficultyB: formValues.difficulty === "Easy" ? -1 : formValues.difficulty === "Medium" ? 0 : 1,
      skills: normalizeSkillPayload(formValues.skills),
      options: formValues.options,
    });
    setQuestionRows((currentRows) => [
      enrichQuestion({ ...created, skills: created?.skills ?? formValues.skills }, chapterMap, subjectMap),
      ...currentRows,
    ]);
    setOpenAddQuestion(false);
    toast.success("Đã thêm câu hỏi mới.");
  };

  const handleImportQuestions = async (importItems = [], onProgress) => {
    const errors = [];
    let successCount = 0;

    for (let index = 0; index < importItems.length; index += 1) {
      const item = importItems[index];

      try {
        await createQuestion(item.payload);
        successCount += 1;
      } catch (importError) {
        errors.push({
          clientId: item.clientId,
          index: item.index || index + 1,
          message: getErrorMessage(importError, "Không thể lưu câu hỏi này."),
        });
      }

      onProgress?.({
        total: importItems.length,
        completed: index + 1,
        success: successCount,
        failed: errors.length,
      });
    }

    if (successCount > 0) {
      await loadQuestionBank();
      toast.success(`Đã import ${successCount} câu hỏi.`);
    }

    return {
      successCount,
      failureCount: errors.length,
      errors,
    };
  };

  const handleStartEditQuestion = async (row) => {
    if (!row?.questionId || loadingEditQuestionId) return;

    try {
      setLoadingEditQuestionId(row.questionId);
      const detail = await getQuestionById(row.questionId);
      const nextQuestion = enrichQuestion(
        {
          ...row,
          ...detail,
          subjectId: detail?.subjectId ?? row.subjectId,
          chapterId: detail?.chapterId ?? row.chapterId,
          options: detail?.options || [],
          skills: detail?.skills ?? row.skills,
        },
        chapterMap,
        subjectMap,
      );

      if (!nextQuestion.options?.length) {
        toast.error("Không thể tải đáp án của câu hỏi. Vui lòng thử lại trước khi chỉnh sửa.");
        return;
      }

      setEditingQuestion(nextQuestion);
    } catch (detailError) {
      toast.error(getErrorMessage(detailError, "Không thể tải chi tiết câu hỏi để chỉnh sửa."));
    } finally {
      setLoadingEditQuestionId("");
    }
  };

  const handleUpdateQuestion = async (formValues) => {
    if (!editingQuestion?.options?.length) {
      toast.error("Chưa tải đủ đáp án của câu hỏi. Không thể lưu chỉnh sửa.");
      return;
    }

    const updated = await updateQuestion(editingQuestion.questionId, {
      subjectId: formValues.subjectId,
      chapterId: formValues.chapterId,
      content: formValues.content,
      explanation: formValues.explanation,
      difficultyB: formValues.difficulty === "Easy" ? -1 : formValues.difficulty === "Medium" ? 0 : 1,
      skills: normalizeSkillPayload(formValues.skills),
      options: formValues.options,
    });
    setQuestionRows((currentRows) => {
      const nextQuestion = enrichQuestion(
        {
          ...editingQuestion,
          ...updated,
          subjectId: formValues.subjectId,
          chapterId: formValues.chapterId,
          content: formValues.content,
          explanation: formValues.explanation,
          difficultyB:
            formValues.difficulty === "Easy" ? -1 : formValues.difficulty === "Medium" ? 0 : 1,
          options: formValues.options,
          skills: updated?.skills ?? formValues.skills,
        },
        chapterMap,
        subjectMap,
      );

      return currentRows.map((question) =>
        question.questionId === editingQuestion.questionId ? nextQuestion : question,
      );
    });
    setEditingQuestion(null);
    toast.success("Đã cập nhật câu hỏi.");
  };

  const handleHardDelete = async () => {
    await deleteQuestion(deletingQuestion.questionId);
    setQuestionRows((currentRows) =>
      currentRows.filter((question) => question.questionId !== deletingQuestion.questionId),
    );
    setDeletingQuestion(null);
    toast.success("Đã xóa câu hỏi.");
  };

  const columns = [
    {
      key: "content",
      label: "Câu hỏi",
      sortable: true,
      sortValue: (row) => row.content,
      render: (row) => (
        <div className="bank-question-cell">
          <strong>{row.content}</strong>
          <div className="question-tags">
            <span>Môn: {row.subject?.name || "-"}</span>
            <span>Chương: {row.chapter?.name || "-"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "skills",
      label: "Kỹ năng",
      width: 140,
      render: (row) => (
        <button
          className={`skill-preview-trigger ${(row.skills || []).length === 0 ? "empty" : ""}`}
          onClick={() => setSkillPreviewQuestion(row)}
          type="button"
        >
          {(row.skills || []).length > 0 ? `${(row.skills || []).length} kỹ năng` : "Xem danh sách"}
        </button>
      ),
    },
    {
      key: "difficultyB",
      label: "Độ khó",
      width: 120,
      sortable: true,
      sortValue: (row) => row.difficultyB ?? 0,
      render: (row) => <span className="difficulty-pill">{getDifficultyLabel(row.difficultyB ?? 0)}</span>,
    },
    {
      key: "actions",
      label: "",
      width: 60,
      align: "right",
      render: (row) => (
        <RowActions
          items={[
            {
              label: "Chỉnh sửa",
              icon: <Pencil size={16} />,
              disabled: Boolean(loadingEditQuestionId),
              onClick: () => handleStartEditQuestion(row),
            },
            {
              label: "Xóa",
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => setDeletingQuestion(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Ngân hàng câu hỏi"]}
        title="Ngân hàng câu hỏi"
        subtitle="Quản lý tập trung tất cả câu hỏi trong hệ thống"
        icon={<Database size={22} />}
        action={
          <div className="question-bank-actions">
            <button className="import-question-btn" onClick={() => setOpenImportQuestions(true)}>
              <Upload size={18} />
              Import câu hỏi
            </button>
            <button className="add-btn" onClick={() => setOpenAddQuestion(true)}>
              <Plus size={18} />
              Thêm câu hỏi
            </button>
          </div>
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={loadQuestionBank} />
      ) : (
        <DataTable
          columns={columns}
          rows={visibleQuestions}
          getRowKey={(row) => row.questionId}
          loading={loading}
          searchPlaceholder="Tìm kiếm câu hỏi theo nội dung..."
          searchKeys={["content"]}
          emptyState={
            <EmptyState
              icon={<Database size={28} />}
              title="Chưa có câu hỏi"
              description="Thêm hoặc import câu hỏi để bắt đầu xây dựng ngân hàng câu hỏi."
            />
          }
          toolbarExtra={
            <>
              <select
                className="filter-select"
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
              >
                <option value="ALL">Tất cả môn học</option>
                {subjects.map((subject) => (
                  <option key={subject.subjectId} value={subject.subjectId}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                className="filter-select"
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value)}
              >
                <option value="ALL">Tất cả độ khó</option>
                <option value="Easy">Dễ</option>
                <option value="Medium">Trung bình</option>
                <option value="Hard">Khó</option>
              </select>
            </>
          }
        />
      )}

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
      <ImportQuestionsModal
        open={openImportQuestions}
        onClose={() => setOpenImportQuestions(false)}
        subject={selectedSubject}
        chapter={selectedChapter}
        onSubmit={handleImportQuestions}
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
        onCancel={() => setDeletingQuestion(null)}
        onConfirm={handleHardDelete}
        onClose={() => setDeletingQuestion(null)}
      />
      <QuestionSkillsModal
        open={Boolean(skillPreviewQuestion)}
        question={skillPreviewQuestion}
        onClose={() => setSkillPreviewQuestion(null)}
      />
    </>
  );
}
