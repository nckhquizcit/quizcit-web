import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, GraduationCap, Layers3, Library, Search, X } from "lucide-react";
import {
  getAllChapters,
  getSubjects,
  getSubjectCatalogSummary,
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
  Modal,
  SkeletonCard,
  StatTile,
  useToast,
} from "../../../../components/ui";
import { getErrorMessage } from "../../../../services/apiClient";
import { normalizeCatalogSummary } from "../../utils/catalogSummary";
import SubjectCard from "../../components/SubjectCard";
import "./SubjectsPage.css";

// GET /api/chapters chỉ trả chương user đã mở (unlock/θ), không phải toàn bộ catalog.
function buildSubjectCollection(subjects, openChapters) {
  return subjects.map((subject) => {
    const chapters = openChapters.filter(
      (chapter) => String(chapter.subjectId) === String(subject.subjectId),
    );
    return {
      ...subject,
      subject_id: subject.subjectId,
      course_code: subject.courseCode,
      openChapterCount: chapters.length,
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
  const [unenrollTarget, setUnenrollTarget] = useState(null);
  const [unenrolling, setUnenrolling] = useState(false);
  const toast = useToast();
  const aliveRef = useRef(true);
  const tabRefs = useRef({});

  const loadData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const catalog = await getSubjectCatalogSummary();
        if (!aliveRef.current) return;

        if (Array.isArray(catalog)) {
          const { subjectCollection: collection, enrollments: enrolledItems } =
            normalizeCatalogSummary(catalog);
          setSubjectCollection(collection);
          setEnrollments(enrolledItems);
          return;
        }
      } catch (catalogError) {
        console.warn("getSubjectCatalogSummary failed, falling back to legacy flow:", catalogError);
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

  // Mở modal xác nhận thay cho window.confirm; thao tác hủy thật nằm ở confirmUnenroll.
  const handleUnenroll = (subject) => {
    setUnenrollTarget(subject);
  };

  const confirmUnenroll = async () => {
    if (!unenrollTarget || unenrolling) return;
    const targetId = unenrollTarget.subjectId || unenrollTarget.subject_id;
    try {
      setUnenrolling(true);
      await unenrollCourse(targetId);
    } catch (unenrollError) {
      toast.error(getErrorMessage(unenrollError, "Không thể hủy đăng ký môn học."));
      return;
    } finally {
      setUnenrolling(false);
    }
    setUnenrollTarget(null);
    await refreshAfterChange("Đã hủy đăng ký môn học.");
  };

  const switchTab = (nextTab, { focus = false } = {}) => {
    setActiveTab(nextTab);
    if (focus) tabRefs.current[nextTab]?.focus();
  };

  // role=tablist: mũi tên Trái/Phải chuyển tab (roving tabindex).
  const handleTablistKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const order = ["all", "mine"];
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const currentIndex = order.indexOf(activeTab);
    const nextTab = order[(currentIndex + direction + order.length) % order.length];
    switchTab(nextTab, { focus: true });
  };

  const enrolledIds = useMemo(
    () => new Set(enrollments.map((item) => String(item.subjectId || item.subject_id))),
    [enrollments],
  );

  // Catalog có imageUrl; enrollment DTO không — luôn ưu tiên bản catalog khi merge.
  const mySubjects = useMemo(() => {
    const byId = new Map(
      subjectCollection.map((subject) => [String(subject.subjectId), subject]),
    );
    return enrollments.map((item) => {
      const id = String(item.subjectId || item.subject_id);
      const catalog = byId.get(id);
      if (!catalog) {
        return {
          ...item,
          subjectId: id,
          subject_id: id,
          course_code: item.courseCode || item.course_code,
        };
      }
      return {
        ...catalog,
        enrolledAt: item.enrolledAt ?? catalog.enrolledAt ?? null,
      };
    });
  }, [enrollments, subjectCollection]);

  const filteredSubjects = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return subjectCollection;
    return subjectCollection.filter(
      (subject) =>
        (subject.name || "").toLowerCase().includes(normalized) ||
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
            Đăng ký môn học để mở khóa lý thuyết theo từng chương và bài kiểm tra ôn tập.
          </p>
        </div>
        <div className="subjects-page__stats">
          <StatTile
            value={subjectCollection.length}
            label="Môn học"
            icon={<BookOpen size={18} />}
          />
          <StatTile
            value={totalChapters}
            label="Chương đã mở"
            icon={<Layers3 size={18} />}
          />
        </div>
      </header>

      <div
        className="subjects-tabs"
        role="tablist"
        aria-label="Bộ lọc môn học"
        onKeyDown={handleTablistKeyDown}
      >
        <button
          ref={(element) => {
            tabRefs.current.all = element;
          }}
          type="button"
          role="tab"
          id="subjects-tab-all"
          aria-controls="subjects-panel-all"
          aria-selected={activeTab === "all"}
          tabIndex={activeTab === "all" ? 0 : -1}
          className={`subjects-tab ${activeTab === "all" ? "is-active" : ""}`}
          onClick={() => switchTab("all")}
        >
          <Library size={16} />
          Toàn bộ môn học
        </button>
        <button
          ref={(element) => {
            tabRefs.current.mine = element;
          }}
          type="button"
          role="tab"
          id="subjects-tab-mine"
          aria-controls="subjects-panel-mine"
          aria-selected={activeTab === "mine"}
          tabIndex={activeTab === "mine" ? 0 : -1}
          className={`subjects-tab ${activeTab === "mine" ? "is-active" : ""}`}
          onClick={() => switchTab("mine")}
        >
          <GraduationCap size={16} />
          Môn của tôi
          {enrolledIds.size > 0 && (
            <span className="subjects-tab__count">{enrolledIds.size}</span>
          )}
        </button>
      </div>

      {activeTab === "all" && (
        <div role="tabpanel" id="subjects-panel-all" aria-labelledby="subjects-tab-all" className="subjects-panel">
          <div className="subjects-toolbar">
            <div className="subjects-toolbar__search">
              <Search size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo tên học phần hoặc mã học phần"
                aria-label="Tìm môn học"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="subjects-toolbar__clear"
                  onClick={() => setSearchTerm("")}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="subjects-page__grid">
              <SkeletonCard lines={4} />
              <SkeletonCard lines={4} />
              <SkeletonCard lines={4} />
            </div>
          ) : error ? (
            <ErrorState description={error} onRetry={() => loadData()} />
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
                  enrolled={enrolledIds.has(String(subject.subjectId))}
                  onEnroll={handleEnroll}
                  onUnenroll={handleUnenroll}
                />
              ))}
            </section>
          )}
        </div>
      )}

      {activeTab === "mine" && (
        <div role="tabpanel" id="subjects-panel-mine" aria-labelledby="subjects-tab-mine" className="subjects-panel">
          {loading ? (
            <div className="subjects-page__grid">
              <SkeletonCard lines={4} />
              <SkeletonCard lines={4} />
              <SkeletonCard lines={4} />
            </div>
          ) : error ? (
            <ErrorState description={error} onRetry={() => loadData()} />
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
        </div>
      )}

      <Modal
        open={Boolean(unenrollTarget)}
        onClose={() => {
          if (!unenrolling) setUnenrollTarget(null);
        }}
        title="Hủy đăng ký môn học"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              disabled={unenrolling}
              onClick={() => setUnenrollTarget(null)}
            >
              Giữ nguyên
            </Button>
            <Button variant="danger" loading={unenrolling} onClick={confirmUnenroll}>
              Hủy đăng ký
            </Button>
          </>
        }
      >
        <p>
          Bạn sắp hủy đăng ký môn{" "}
          <strong>{unenrollTarget?.name || "này"}</strong>. Bạn sẽ không xem được
          lý thuyết và bài kiểm tra của môn cho đến khi đăng ký lại.
        </p>
      </Modal>
    </section>
  );
}
