import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import AddChapterModal from "../components/modals/AddChapterModal";
import EditChapterModal from "../components/modals/EditChapterModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import AddTheoryModal from "../components/modals/AddTheoryModal";
import EditTheoryModal from "../components/modals/EditTheoryModal";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import {
  createChapter,
  getChaptersBySubject,
  getSubjectById,
  updateChapter,
  deleteChapter,
  getTheoriesByChapter,
  createTheory,
  updateTheory,
  deleteTheory,
} from "../../../services/contentService";
import { getQuestionsByChapter } from "../../../services/quizService";

export default function AdminChapters() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openAddChapter, setOpenAddChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [deletingChapter, setDeletingChapter] = useState(null);
  const [subject, setSubject] = useState(null);
  const [subjectChapters, setSubjectChapters] = useState([]);
  const [questionCountByChapter, setQuestionCountByChapter] = useState({});
  
  // Theory management
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [theoriesByChapter, setTheoriesByChapter] = useState({});
  const [openAddTheory, setOpenAddTheory] = useState(false);
  const [editingTheory, setEditingTheory] = useState(null);
  const [deletingTheory, setDeletingTheory] = useState(null);

  useEffect(() => {
    const load = async () => {
      const subjectData = await getSubjectById(subjectId);
      const chapters = (await getChaptersBySubject(subjectId)) || [];
      setSubject(subjectData);
      setSubjectChapters(chapters);
      const entries = await Promise.all(
        chapters.map(async (chapter) => [
          chapter.chapterId,
          ((await getQuestionsByChapter(chapter.chapterId)) || []).length,
        ]),
      );
      setQuestionCountByChapter(Object.fromEntries(entries));
    };
    load();
  }, [subjectId]);

  const loadTheories = async (chapterId) => {
    const theories = (await getTheoriesByChapter(chapterId)) || [];
    setTheoriesByChapter((prev) => ({ ...prev, [chapterId]: theories }));
  };

  const handleExpandChapter = async (chapterId) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
    } else {
      setExpandedChapter(chapterId);
      if (!theoriesByChapter[chapterId]) {
        await loadTheories(chapterId);
      }
    }
  };

  const filteredChapters = useMemo(
    () => subjectChapters.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [subjectChapters, search],
  );

  const handleUpdateChapter = async (payload) => {
    await updateChapter(editingChapter.chapterId, payload);
    setSubjectChapters((current) =>
      current.map((c) => (c.chapterId === editingChapter.chapterId ? { ...c, ...payload } : c)),
    );
    setEditingChapter(null);
  };

  const handleDeleteChapter = async () => {
    await deleteChapter(deletingChapter.chapterId);
    setSubjectChapters((current) =>
      current.filter((c) => c.chapterId !== deletingChapter.chapterId),
    );
    setDeletingChapter(null);
  };

  const handleAddTheory = async (payload) => {
    const created = await createTheory(expandedChapter, payload);
    await loadTheories(expandedChapter);
    setOpenAddTheory(false);
  };

  const handleUpdateTheory = async (payload) => {
    await updateTheory(editingTheory.theoryId, payload);
    await loadTheories(editingTheory.chapterId);
    setEditingTheory(null);
  };

  const handleDeleteTheory = async () => {
    await deleteTheory(deletingTheory.theoryId);
    await loadTheories(deletingTheory.chapterId);
    setDeletingTheory(null);
  };

  if (!subject) return <div>Không tìm thấy môn</div>;

  const expandedChapterData = subjectChapters.find((c) => c.chapterId === expandedChapter);

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Môn học", subject.name]}
        title={subject.name}
        subtitle={`Mã môn: ${subject.courseCode} • ${subjectChapters.length} chương`}
        icon={<BookOpen size={22} />}
        onBack={() => navigate("/admin/subjects")}
        action={
          <button className="add-btn" onClick={() => setOpenAddChapter(true)}>
            <Plus size={18} />
            Thêm chương
          </button>
        }
      />

      <SearchBar placeholder="Tìm kiếm chương..." onChange={setSearch} />

      <div className="chapter-list">
        {filteredChapters.map((chapter, index) => {
          const isExpanded = expandedChapter === chapter.chapterId;

          return (
            <div key={chapter.chapterId} className="chapter-card-wrapper">
              <div
                className="chapter-card"
                onClick={() => handleExpandChapter(chapter.chapterId)}
              >
                <div className="chapter-left">
                  <div className="chapter-index">{index + 1}</div>

                  <div>
                    <div className="chapter-title">{chapter.name}</div>
                    <div className="chapter-sub">
                      {questionCountByChapter[chapter.chapterId] || 0} câu hỏi
                    </div>
                  </div>
                </div>

                <div className="chapter-actions">
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChapter(chapter);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingChapter(chapter);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="chapter-arrow">{isExpanded ? "▼" : "›"}</div>
                </div>
              </div>

              {isExpanded && (
                <div className="chapter-expanded-content">
                  <div className="theory-management">
                    <div className="theory-header">
                      <h4>📖 Lý thuyết</h4>
                      <button
                        className="add-btn small"
                        onClick={() => setOpenAddTheory(true)}
                      >
                        <Plus size={14} />
                        Thêm lý thuyết
                      </button>
                    </div>

                    <div className="theory-list">
                      {(theoriesByChapter[chapter.chapterId] || []).length === 0 ? (
                        <div className="empty-state">Chưa có lý thuyết</div>
                      ) : (
                        (theoriesByChapter[chapter.chapterId] || []).map((theory) => (
                          <div key={theory.theoryId} className="theory-item-admin">
                            <div className="theory-content">{theory.content}</div>
                            <div className="theory-actions">
                              <button
                                className="icon-btn"
                                onClick={() => setEditingTheory(theory)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className="icon-btn danger"
                                onClick={() => setDeletingTheory(theory)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="question-management">
                    <button
                      className="view-questions-btn"
                      onClick={() =>
                        navigate(
                          `/admin/subjects/${subjectId}/chapters/${chapter.chapterId}/questions`,
                        )
                      }
                    >
                      Quản lý câu hỏi →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddChapterModal
        open={openAddChapter}
        onClose={() => setOpenAddChapter(false)}
        subject={subject}
        onSubmit={async (payload) => {
          const created = await createChapter(subjectId, payload);
          setSubjectChapters((current) => [...current, created]);
          setOpenAddChapter(false);
        }}
      />

      <EditChapterModal
        open={Boolean(editingChapter)}
        onClose={() => setEditingChapter(null)}
        chapter={editingChapter}
        onSubmit={handleUpdateChapter}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingChapter)}
        onClose={() => setDeletingChapter(null)}
        title="Xóa chương"
        message="Bạn có muốn xóa chương này không? Tất cả câu hỏi và lý thuyết trong chương cũng sẽ bị xóa."
        itemName={deletingChapter?.name}
        onConfirm={handleDeleteChapter}
      />

      <AddTheoryModal
        open={openAddTheory}
        onClose={() => setOpenAddTheory(false)}
        chapter={expandedChapterData}
        onSubmit={handleAddTheory}
      />

      <EditTheoryModal
        open={Boolean(editingTheory)}
        onClose={() => setEditingTheory(null)}
        theory={editingTheory}
        onSubmit={handleUpdateTheory}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingTheory)}
        onClose={() => setDeletingTheory(null)}
        title="Xóa lý thuyết"
        message="Bạn có muốn xóa nội dung lý thuyết này không?"
        itemName={deletingTheory?.content?.substring(0, 50)}
        onConfirm={handleDeleteTheory}
      />
    </>
  );
}