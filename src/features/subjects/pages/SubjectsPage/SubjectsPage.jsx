import { useEffect, useMemo, useState } from "react";
import { BookOpen, Layers3, Search } from "lucide-react";
import {
  getChaptersBySubject,
  getSubjects,
} from "../../../../services/contentService";
import {
  EmptyState,
  ErrorState,
  SkeletonCard,
} from "../../../../components/ui";
import { getErrorMessage } from "../../../../services/apiClient";
import SubjectCard from "../../components/SubjectCard";
import "./SubjectsPage.css";

export default function SubjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectCollection, setSubjectCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const loadSubjects = async () => {
      try {
        setLoading(true);
        setError("");
        const subjects = (await getSubjects()) || [];
        const withChapters = await Promise.all(
          subjects.map(async (subject) => {
            const chapters =
              (await getChaptersBySubject(subject.subjectId)) || [];
            return {
              ...subject,
              subject_id: subject.subjectId,
              course_code: subject.courseCode,
              chapterCount: chapters.length,
              chapterPreview: chapters.slice(0, 3).map((chapter) => ({
                chapter_id: chapter.chapterId,
                name: chapter.name,
              })),
            };
          })
        );
        if (alive) setSubjectCollection(withChapters);
      } catch (loadError) {
        if (alive)
          setError(
            getErrorMessage(loadError, "Không thể tải danh sách môn học.")
          );
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadSubjects();
    return () => {
      alive = false;
    };
  }, []);

  const filteredSubjects = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return subjectCollection;
    return subjectCollection.filter(
      (subject) =>
        subject.name.toLowerCase().includes(normalized) ||
        (subject.course_code || "").toLowerCase().includes(normalized)
    );
  }, [searchTerm, subjectCollection]);

  const totalChapters = useMemo(
    () => subjectCollection.reduce((sum, s) => sum + (s.chapterCount || 0), 0),
    [subjectCollection]
  );

  return (
    <section className="subjects-page">
      <header className="subjects-page__hero">
        <div>
          <p className="subjects-page__eyebrow">Không gian học tập</p>
          <h1>Môn học</h1>
          <p className="subjects-page__description">
            Chọn môn học để xem lý thuyết theo từng chương và làm quiz ôn tập.
          </p>
        </div>
        <div className="subjects-page__stats">
          <div className="subjects-stat">
            <span className="subjects-stat__icon">
              <BookOpen size={18} />
            </span>
            <div>
              <strong>{subjectCollection.length}</strong>
              <p>Môn học</p>
            </div>
          </div>
          <div className="subjects-stat">
            <span className="subjects-stat__icon">
              <Layers3 size={18} />
            </span>
            <div>
              <strong>{totalChapters}</strong>
              <p>Chương</p>
            </div>
          </div>
        </div>
      </header>

      <div className="subjects-toolbar">
        <div className="subjects-toolbar__search">
          <Search size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên môn hoặc mã môn"
          />
        </div>
      </div>

      {loading ? (
        <div className="subjects-page__grid">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : error ? (
        <ErrorState
          description={error}
          onRetry={() => window.location.reload()}
        />
      ) : filteredSubjects.length === 0 ? (
        <EmptyState
          title={
            searchTerm
              ? "Không tìm thấy môn học phù hợp"
              : "Chưa có môn học nào"
          }
          description={
            searchTerm
              ? "Hãy thử từ khóa khác để xem danh sách môn học."
              : "Hệ thống chưa có môn học để hiển thị."
          }
        />
      ) : (
        <section className="subjects-page__grid">
          {filteredSubjects.map((subject) => (
            <SubjectCard key={subject.subject_id} subject={subject} />
          ))}
        </section>
      )}
    </section>
  );
}
