import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Database,
  Gauge,
  ListChecks,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import AddQuestionModal from "../components/modals/AddQuestionModal";
import AdminPageHeader from "../components/AdminPageHeader";
import Modal from "../components/ui/Modal";
import RowActions from "../components/ui/RowActions";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import { useToast } from "../../../components/ui/Toast/Toast";
import {
  deleteQuestion,
  getQuestionById,
  getQuestionsByChapter,
  updateQuestion,
} from "../../../services/quizService";
import { getErrorMessage } from "../../../services/apiClient";
import { getChaptersBySubject, getSubjects } from "../../../services/contentService";

const QUESTION_PAGE_SIZE = 8;

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

const getDifficultyText = (difficulty) => {
  if (difficulty === "Easy") return "Dễ";
  if (difficulty === "Hard") return "Khó";
  return "Trung bình";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [sort, setSort] = useState({ key: "content", dir: "asc" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const chapterMap = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.chapterId, chapter])),
    [chapters],
  );
  const subjectMap = useMemo(
    () => new Map(subjects.map((subject) => [subject.subjectId, subject])),
    [subjects],
  );

  const visibleQuestions = useMemo(
    () => {
      const q = searchQuery.trim().toLowerCase();

      return questionRows.filter((question) => {
        const matchesSubject = subjectFilter === "ALL" || question.subjectId === subjectFilter;
        const matchesDifficulty =
          difficultyFilter === "ALL" ||
          getDifficultyLabel(question.difficultyB ?? 0) === difficultyFilter;
        const matchesSearch =
          !q ||
          [
            question.content,
            question.subject?.name,
            question.chapter?.name,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(q));

        return matchesSubject && matchesDifficulty && matchesSearch;
      });
    },
    [questionRows, searchQuery, subjectFilter, difficultyFilter],
  );

  const sortedQuestions = useMemo(() => {
    const valueOf = (question) => {
      if (sort.key === "difficultyB") return question.difficultyB ?? 0;
      if (sort.key === "skills") return (question.skills || []).length;
      return question.content || "";
    };

    const dir = sort.dir === "desc" ? -1 : 1;
    return [...visibleQuestions].sort((a, b) => {
      const va = valueOf(a);
      const vb = valueOf(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "vi") * dir;
    });
  }, [sort, visibleQuestions]);

  const totalPages = Math.max(1, Math.ceil(sortedQuestions.length / QUESTION_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedQuestions = useMemo(
    () =>
      sortedQuestions.slice(
        (safePage - 1) * QUESTION_PAGE_SIZE,
        safePage * QUESTION_PAGE_SIZE,
      ),
    [safePage, sortedQuestions],
  );

  const questionStats = useMemo(
    () => ({
      total: questionRows.length,
      matched: visibleQuestions.length,
      withSkills: visibleQuestions.filter((question) => (question.skills || []).length > 0).length,
    }),
    [questionRows, visibleQuestions],
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, subjectFilter, difficultyFilter]);

  const toggleSort = (key) => {
    setPage(1);
    setSort((current) => {
      if (!current || current.key !== key) return { key, dir: "asc" };
      return { key, dir: current.dir === "asc" ? "desc" : "asc" };
    });
  };

  const renderSortIcon = (key) => {
    if (sort?.key !== key) return <ChevronsUpDown size={14} />;
    return sort.dir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const hasActiveFilters =
    searchQuery.trim() || subjectFilter !== "ALL" || difficultyFilter !== "ALL";

  const resetQuestionFilters = () => {
    setSearchQuery("");
    setSubjectFilter("ALL");
    setDifficultyFilter("ALL");
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

  const createQuestionPath =
    subjectId && chapterId
      ? `/admin/subjects/${subjectId}/chapters/${chapterId}/questions/new`
      : "/admin/questions/new";
  const importQuestionPath =
    subjectId && chapterId
      ? `/admin/subjects/${subjectId}/chapters/${chapterId}/questions/import`
      : "/admin/questions/import";

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Ngân hàng câu hỏi"]}
        title="Ngân hàng câu hỏi"
        subtitle="Quản lý tập trung tất cả câu hỏi trong hệ thống"
        icon={<Database size={22} />}
        action={
          <div className="question-bank-actions">
            <button
              className="import-question-btn"
              onClick={() => navigate(importQuestionPath)}
              type="button"
            >
              <Upload size={18} />
              Import câu hỏi
            </button>
            <button className="add-btn" onClick={() => navigate(createQuestionPath)} type="button">
              <Plus size={18} />
              Thêm câu hỏi
            </button>
          </div>
        }
      />

      {error ? (
        <ErrorState description={error} onRetry={loadQuestionBank} />
      ) : (
        <section className="question-bank-shell">
          <div className="question-bank-insights" aria-label="Tổng quan câu hỏi">
            <article>
              <span className="question-bank-insight-icon">
                <Database size={18} />
              </span>
              <div>
                <p>Tổng câu hỏi</p>
                <strong>{questionStats.total}</strong>
              </div>
            </article>
            <article>
              <span className="question-bank-insight-icon">
                <Gauge size={18} />
              </span>
              <div>
                <p>Đang hiển thị</p>
                <strong>{questionStats.matched}</strong>
              </div>
            </article>
            <article>
              <span className="question-bank-insight-icon">
                <ListChecks size={18} />
              </span>
              <div>
                <p>Có kỹ năng</p>
                <strong>{questionStats.withSkills}</strong>
              </div>
            </article>
          </div>

          <div className="question-bank-surface">
            <div className="question-bank-toolbar">
              <label className="question-bank-search">
                <Search size={17} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Tìm nội dung, môn học, chương..."
                />
              </label>

              <div className="question-bank-filter-group">
                <span className="question-bank-filter-label">
                  <SlidersHorizontal size={15} />
                  Lọc
                </span>
                <select
                  className="question-bank-select"
                  value={subjectFilter}
                  onChange={(event) => setSubjectFilter(event.target.value)}
                  aria-label="Lọc theo môn học"
                >
                  <option value="ALL">Tất cả môn học</option>
                  {subjects.map((subject) => (
                    <option key={subject.subjectId} value={subject.subjectId}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <select
                  className="question-bank-select"
                  value={difficultyFilter}
                  onChange={(event) => setDifficultyFilter(event.target.value)}
                  aria-label="Lọc theo độ khó"
                >
                  <option value="ALL">Tất cả độ khó</option>
                  <option value="Easy">Dễ</option>
                  <option value="Medium">Trung bình</option>
                  <option value="Hard">Khó</option>
                </select>
              </div>
            </div>

            <div className="question-bank-active-line">
              <span>
                Hiển thị <strong>{questionStats.matched}</strong> / {questionStats.total} câu hỏi
              </span>
              {hasActiveFilters && (
                <button type="button" onClick={resetQuestionFilters}>
                  <X size={14} />
                  Đặt lại
                </button>
              )}
            </div>

            <div className="question-bank-table-wrap">
              <table className="question-bank-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <button type="button" onClick={() => toggleSort("content")}>
                        Câu hỏi {renderSortIcon("content")}
                      </button>
                    </th>
                    <th scope="col">
                      <button type="button" onClick={() => toggleSort("skills")}>
                        Kỹ năng {renderSortIcon("skills")}
                      </button>
                    </th>
                    <th scope="col">
                      <button type="button" onClick={() => toggleSort("difficultyB")}>
                        Độ khó {renderSortIcon("difficultyB")}
                      </button>
                    </th>
                    <th scope="col" className="question-bank-action-col">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading &&
                    Array.from({ length: QUESTION_PAGE_SIZE }).map((_, index) => (
                      <tr key={`question-skeleton-${index}`} className="question-bank-row">
                        <td colSpan={4}>
                          <div className="question-bank-row-skeleton" />
                        </td>
                      </tr>
                    ))}

                  {!loading &&
                    pagedQuestions.map((row, index) => {
                      const difficulty = getDifficultyLabel(row.difficultyB ?? 0);
                      const skillCount = (row.skills || []).length;
                      const rowNumber = (safePage - 1) * QUESTION_PAGE_SIZE + index + 1;

                      return (
                        <tr className="question-bank-row" key={row.questionId}>
                          <td>
                            <div className="bank-question-cell">
                              <span className="bank-question-index">
                                {String(rowNumber).padStart(2, "0")}
                              </span>
                              <div className="bank-question-main">
                                <strong>{row.content}</strong>
                                <div className="question-bank-meta">
                                  <span>
                                    <BookOpen size={13} />
                                    {row.subject?.name || "Chưa có môn"}
                                  </span>
                                  <span>{row.chapter?.name || "Chưa có chương"}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Kỹ năng">
                            <button
                              className={`skill-preview-trigger ${skillCount === 0 ? "empty" : ""}`}
                              onClick={() => setSkillPreviewQuestion(row)}
                              type="button"
                            >
                              <ListChecks size={14} />
                              {skillCount > 0 ? `${skillCount} kỹ năng` : "Chưa gắn"}
                            </button>
                          </td>
                          <td data-label="Độ khó">
                            <span className={`difficulty-pill ${difficulty.toLowerCase()}`}>
                              {getDifficultyText(difficulty)}
                            </span>
                          </td>
                          <td data-label="Thao tác" className="question-bank-row-actions">
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
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>

              {!loading && pagedQuestions.length === 0 && (
                <div className="question-bank-empty">
                  <EmptyState
                    icon={<Database size={28} />}
                    title="Chưa có câu hỏi phù hợp"
                    description="Thêm, import hoặc đổi bộ lọc để xem câu hỏi."
                  />
                </div>
              )}
            </div>

            {!loading && sortedQuestions.length > QUESTION_PAGE_SIZE && (
              <div className="question-bank-pagination">
                <span>
                  {(safePage - 1) * QUESTION_PAGE_SIZE + 1}-
                  {Math.min(safePage * QUESTION_PAGE_SIZE, sortedQuestions.length)} /{" "}
                  {sortedQuestions.length}
                </span>
                <div>
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    aria-label="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <strong>
                    Trang {safePage} / {totalPages}
                  </strong>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    aria-label="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
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
