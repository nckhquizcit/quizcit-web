import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  getAllChapters,
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
  const [totalChapters, setTotalChapters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const loadSubjects = async () => {
      try {
        setLoading(true);
        setError("");
        const [subjects = [], allChapters = []] = await Promise.all([getSubjects(), getAllChapters()]);
        const withChapters = subjects.map((subject) => ({
          ...subject,
          chapterCount: allChapters.filter(
            (chapter) => chapter.subjectId === subject.subjectId
          ).length,
        }));
        if (alive) {
          setSubjectCollection(withChapters);
          setTotalChapters(allChapters.length);
        }
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

  const showCounts = !loading && !error;

  return (
    <section className="subjects-page">
      <header className="subjects-page__header">
        <h1>Danh sách môn học</h1>
        <p>Chọn môn học để xem lý thuyết theo từng chương và làm quiz ôn tập.</p>
      </header>

      <div className="subjects-banner">
        <span className="subjects-banner__chip">NỘI DUNG HỆ THỐNG</span>
        <p className="subjects-banner__headline">
          {showCounts ? subjectCollection.length : "—"} môn khả dụng ·{" "}
          {showCounts ? totalChapters : "—"} chương khả dụng
        </p>
        <p className="subjects-banner__sub">
          Vào môn để đọc lý thuyết, làm bài kiểm tra và ôn thích ứng theo năng lực.
        </p>
      </div>

      <div className="subjects-search-card">
        <div className="subjects-search-card__input">
          <Search size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên môn hoặc mã môn"
          />
        </div>
        <span className="subjects-search-card__chip">
          {showCounts ? filteredSubjects.length : "—"} MÔN KHẢ DỤNG
        </span>
      </div>

      <section className="subjects-page__body">
        <h2 className="subjects-page__section-title">Các môn đang hiển thị</h2>

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
          <div className="subjects-page__grid">
            {filteredSubjects.map((subject) => (
              <SubjectCard key={subject.subject_id} subject={subject} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
