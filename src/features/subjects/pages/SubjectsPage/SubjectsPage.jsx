import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, GraduationCap, Layers3, Library, Search } from "lucide-react";
import {
  getAllChapters,
  getSubjects,
} from "../../../../services/contentService";
import {
  enrollCourse,
  getMyEnrollments,
  isAlreadyEnrolled,
  unenrollCourse,
} from "../../../../services/enrollmentService";
import {
  Button,
  EmptyState,
  ErrorState,
  SkeletonCard,
  useToast,
} from "../../../../components/ui";
import { getErrorMessage } from "../../../../services/apiClient";
import SubjectCard from "../../components/SubjectCard";
import "./SubjectsPage.css";

function buildSubjectCollection(subjects, allChapters) {
  return subjects.map((subject) => {
    const chapters = allChapters.filter((chapter) => chapter.subjectId === subject.subjectId);
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
  });
}

export default function SubjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectCollection, setSubjectCollection] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const toast = useToast();
  const aliveRef = useRef(true);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      // Chi getSubjects fail moi coi la loi ca trang; chapters/enrollments fail
      // thi degrade ve rong de nut Dang ky van dung duoc.
      const [subjectsResult, chaptersResult, enrolledResult] = await Promise.allSettled([
        getSubjects(),
        getAllChapters(),
        getMyEnrollments(),
      ]);
      if (subjectsResult.status === "rejected") throw subjectsResult.reason;
      if (!aliveRef.current) return;
      const subjects = subjectsResult.value || [];
      const allChapters = chaptersResult.status === "fulfilled" ? chaptersResult.value || [] : [];
      const enrolled = enrolledResult.status === "fulfilled" ? enrolledResult.value || [] : [];
      setSubjectCollection(buildSubjectCollection(subjects, allChapters));
      setEnrollments(enrolled);
    } catch (loadError) {
      if (silent) throw loadError;
      if (aliveRef.current) {
        setError(getErrorMessage(loadError, "Không thể tải danh sách môn học."));
      }
    } finally {
      if (!silent && aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    loadData();
    return () => {
      aliveRef.current = false;
    };
  }, [loadData]);

  const refreshAfterChange = async (message) => {
    toast.success(message);
    try {
      await loadData({ silent: true });
    } catch (refreshError) {
      toast.error(getErrorMessage(refreshError, "Không tải lại được danh sách môn học."));
    }
  };

  const handleEnroll = async (subject) => {
    const targetId = subject.subjectId || subject.subject_id;
    try {
      await enrollCourse(targetId);
    } catch (enrollError) {
      if (!isAlreadyEnrolled(enrollError)) {
        toast.error(getErrorMessage(enrollError, "Không thể đăng ký môn học."));
        return;
      }
    }
    await refreshAfterChange("Đã đăng ký môn học.");
  };

  const handleUnenroll = async (subject) => {
    if (!window.confirm("Hủy đăng ký môn này?")) return;
    const targetId = subject.subjectId || subject.subject_id;
    try {
      await unenrollCourse(targetId);
    } catch (unenrollError) {
      toast.error(getErrorMessage(unenrollError, "Không thể hủy đăng ký môn học."));
      return;
    }
    await refreshAfterChange("Đã hủy đăng ký môn học.");
  };

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((item) => item.subjectId)),
    [enrollments]
  );

  const mySubjects = useMemo(() => {
    const byId = new Map(subjectCollection.map((subject) => [subject.subjectId, subject]));
    return enrollments.map((item) => byId.get(item.subjectId) || item);
  }, [enrollments, subjectCollection]);

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
          <h1>Danh sách môn học</h1>
          <p className="subjects-page__description">
            Đăng ký môn học để mở khóa lý thuyết theo từng chương và quiz ôn tập.
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
              <p>Chương đã đăng ký</p>
            </div>
          </div>
        </div>
      </header>

      <div className="subjects-tabs" role="tablist" aria-label="Bộ lọc môn học">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "all"}
          className={`subjects-tab ${activeTab === "all" ? "is-active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <Library size={16} />
          Toàn bộ môn học
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "mine"}
          className={`subjects-tab ${activeTab === "mine" ? "is-active" : ""}`}
          onClick={() => setActiveTab("mine")}
        >
          <GraduationCap size={16} />
          Môn của tôi
          {enrolledIds.size > 0 && (
            <span className="subjects-tab__count">{enrolledIds.size}</span>
          )}
        </button>
      </div>

      {activeTab === "all" && (
        <>
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
                <SubjectCard
                  key={subject.subject_id}
                  subject={subject}
                  enrolled={enrolledIds.has(subject.subjectId)}
                  onEnroll={handleEnroll}
                  onUnenroll={handleUnenroll}
                />
              ))}
            </section>
          )}
        </>
      )}

      {activeTab === "mine" && (
        <>
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
          ) : mySubjects.length === 0 ? (
            <EmptyState
              title="Bạn chưa đăng ký môn nào"
              description="Hãy sang tab Toàn bộ môn học và bấm Đăng ký để mở khóa lý thuyết cùng bài kiểm tra của môn."
              action={
                <Button variant="primary" onClick={() => setActiveTab("all")}>
                  Xem toàn bộ môn học
                </Button>
              }
            />
          ) : (
            <section className="subjects-page__grid">
              {mySubjects.map((subject) => (
                <SubjectCard
                  key={subject.subject_id}
                  subject={subject}
                  enrolled
                  onEnroll={handleEnroll}
                  onUnenroll={handleUnenroll}
                />
              ))}
            </section>
          )}
        </>
      )}
    </section>
  );
}
