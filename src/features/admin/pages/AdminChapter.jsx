import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import AddChapterModal from "../components/modals/AddChapterModal";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import { createChapter, getChaptersBySubject, getSubjectById } from "../../../services/contentService";
import { getQuestionsByChapter } from "../../../services/quizService";

export default function AdminChapters() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openAddChapter, setOpenAddChapter] = useState(false);
  const [subject, setSubject] = useState(null);
  const [subjectChapters, setSubjectChapters] = useState([]);
  const [questionCountByChapter, setQuestionCountByChapter] = useState({});

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

  const filteredChapters = useMemo(
    () => subjectChapters.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [subjectChapters, search],
  );

  if (!subject) return <div>Không tìm thấy môn</div>;

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
          return (
            <div
              key={chapter.chapterId}
              className="chapter-card"
              onClick={() =>
                navigate(
                  `/admin/subjects/${subjectId}/chapters/${chapter.chapterId}/questions`,
                )
              }
            >
              <div className="chapter-left">
                <div className="chapter-index">{index + 1}</div>

                <div>
                  <div className="chapter-title">{chapter.name}</div>
                  <div className="chapter-sub">{questionCountByChapter[chapter.chapterId] || 0} câu hỏi</div>
                </div>
              </div>

              <div className="chapter-arrow">›</div>
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
    </>
  );
}
