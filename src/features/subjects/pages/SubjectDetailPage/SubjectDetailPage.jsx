import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock3,
  Layers3,
  ListChecks,
  Lock,
  Plus,
} from "lucide-react";
import {
  getChaptersBySubject,
  getSubjectById,
  getTheoriesBySubject,
} from "../../../../services/contentService";
import {
  getAdaptiveEligibility,
  getQuizzesBySubject,
  startAdaptiveQuiz,
} from "../../../../services/quizService";
import {
  enrollCourse,
  getMyEnrollments,
  isAlreadyEnrolled,
} from "../../../../services/enrollmentService";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Spinner,
  StatTile,
  useToast,
} from "../../../../components/ui";
import ChatBox from "../../../../components/ChatBox/ChatBox";
import { getErrorMessage, getStoredUser, isAccessDenied } from "../../../../services/apiClient";
import { isUserPreviewActive } from "../../../../services/userPreviewMode";
import { formatScaledThetaValue, resolveImageUrl } from "../../../../services/mappers";
import { getTheoryDisplayTitle } from "../../../content/utils/theoryDisplay.js";
import { isValidAdaptiveQuestionCount } from "../../../quiz/pages/AdaptiveQuizPage/AdaptiveQuizPage.logic.js";
import "./SubjectDetailPage.css";

// BE so sánh θ raw; 0 = ngưỡng mặc định (scale hiển thị 2.00). Chỉ ẩn khi không phải số.
const formatRequiredTheta = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return formatScaledThetaValue(n);
};

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [theoriesByChapter, setTheoriesByChapter] = useState({});
  const [quizzesByChapter, setQuizzesByChapter] = useState({});
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentError, setContentError] = useState(null);
  const [contentBlocked, setContentBlocked] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [adaptiveOpen, setAdaptiveOpen] = useState(false);
  const [adaptiveCount, setAdaptiveCount] = useState(15);
  const [startingAdaptive, setStartingAdaptive] = useState(false);
  const [adaptiveError, setAdaptiveError] = useState("");
  const [adaptiveEligibility, setAdaptiveEligibility] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const adaptiveCancelledRef = useRef(false);
  const adaptiveInputRef = useRef(null);
  const loadIdRef = useRef(0);

  // Escape/backdrop/focus trap do Modal dùng chung đảm nhiệm.
  const closeAdaptiveDialog = useCallback(() => {
    adaptiveCancelledRef.current = true;
    setAdaptiveOpen(false);
    setAdaptiveError("");
    setAdaptiveEligibility(null);
  }, []);

  const handleOpenAdaptive = useCallback(async () => {
    adaptiveCancelledRef.current = false;
    setAdaptiveOpen(true);
    setAdaptiveError("");
    setAdaptiveEligibility(null);
    setCheckingEligibility(true);
    try {
      const eligibility = await getAdaptiveEligibility(subjectId);
      if (adaptiveCancelledRef.current) return;
      setAdaptiveEligibility(eligibility);
    } catch (err) {
      if (adaptiveCancelledRef.current) return;
      setAdaptiveError(
        getErrorMessage(err, "Không thể kiểm tra điều kiện làm bài thích ứng.")
      );
    } finally {
      setCheckingEligibility(false);
    }
  }, [subjectId]);

  const handleStartAdaptive = async () => {
    const count = Number(adaptiveCount);
    if (!isValidAdaptiveQuestionCount(count)) {
      setAdaptiveError("Số câu của bài kiểm tra thích ứng phải từ 15 trở lên và chia hết cho 5.");
      return;
    }
    try {
      adaptiveCancelledRef.current = false;
      setStartingAdaptive(true);
      setAdaptiveError("");
      const state = await startAdaptiveQuiz(subjectId, count);
      if (adaptiveCancelledRef.current) return;
      navigate(`/app/adaptive/${state.attemptId}`);
    } catch (err) {
      if (adaptiveCancelledRef.current) return;
      setAdaptiveError(getErrorMessage(err, "Không thể tạo bài kiểm tra thích ứng."));
    } finally {
      setStartingAdaptive(false);
    }
  };

  // Chỉ admin thật (không ở chế độ xem như học viên) hoặc người đã đăng ký mới
  // được xem nội dung. BE chỉ chặn ở endpoint bài kiểm tra, còn chương và lý
  // thuyết vẫn trả dữ liệu, nên FE phải tự chặn trước khi gọi.
  const resolveContentAccess = useCallback(async () => {
    const user = getStoredUser();
    const isAdmin = user?.role === "ADMINISTRATOR";
    const previewActive = isUserPreviewActive(user);
    const adminAccess = isAdmin && !previewActive;

    let enrolled = false;
    if (!adminAccess) {
      try {
        const enrollments = await getMyEnrollments();
        enrolled = (enrollments || []).some(
          (item) => String(item.subjectId || item.subject_id) === String(subjectId)
        );
      } catch {
        // Không xác định được thì coi như chưa đăng ký để tránh gọi nội dung khóa.
        enrolled = false;
      }
    }

    return adminAccess || enrolled;
  }, [subjectId]);

  // Nội dung trong môn yêu cầu đã đăng ký, nên tách khỏi request thông tin môn.
  const loadContent = useCallback(async () => {
    const loadId = loadIdRef.current;
    setContentError(null);

    const canAccessContent = await resolveContentAccess();
    if (loadIdRef.current !== loadId) return;

    if (!canAccessContent) {
      setChapters([]);
      setTheoriesByChapter({});
      setQuizzesByChapter({});
      setActiveChapterId(null);
      setContentBlocked(true);
      return;
    }
    setContentBlocked(false);

    const results = await Promise.allSettled([
      getChaptersBySubject(subjectId),
      getTheoriesBySubject(subjectId),
      getQuizzesBySubject(subjectId),
    ]);
    if (loadIdRef.current !== loadId) return;

    const failures = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);

    if (failures.length > 0) {
      setChapters([]);
      setTheoriesByChapter({});
      setQuizzesByChapter({});
      setActiveChapterId(null);
      if (failures.some(isAccessDenied)) {
        setContentBlocked(true);
      } else {
        setContentError(getErrorMessage(failures[0], "Không thể tải nội dung môn học."));
      }
      return;
    }

    const [chapterData = [], theories = [], quizzes = []] = results.map((result) => result.value);
    const chapterIds = chapterData.map((chapter) => chapter.chapterId || chapter.chapter_id);
    const theoryEntries = chapterIds.map((id) => [
      id,
      theories.filter((theory) => theory.chapterId === id),
    ]);
    const quizEntries = chapterIds.map((id) => [
      id,
      quizzes.filter((quiz) => quiz.chapterId === id),
    ]);

    setChapters(chapterData);
    setTheoriesByChapter(Object.fromEntries(theoryEntries));
    setQuizzesByChapter(Object.fromEntries(quizEntries));
    setActiveChapterId((current) =>
      current && chapterIds.includes(current) ? current : chapterIds[0] || null
    );
  }, [subjectId, resolveContentAccess]);

  const load = useCallback(async () => {
    const loadId = (loadIdRef.current += 1);
    setLoading(true);
    setError(null);

    const [subjectResult] = await Promise.allSettled([
      getSubjectById(subjectId),
      loadContent(),
    ]);
    if (loadIdRef.current !== loadId) return;

    if (subjectResult.status === "rejected") {
      setError(getErrorMessage(subjectResult.reason, "Không thể tải thông tin môn học."));
    } else {
      setSubject(subjectResult.value);
    }
    setLoading(false);
  }, [subjectId, loadContent]);

  useEffect(() => {
    if (!subjectId) return undefined;
    load();
    return () => {
      loadIdRef.current += 1;
    };
  }, [subjectId, load]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      try {
        await enrollCourse(subjectId);
      } catch (enrollError) {
        if (!isAlreadyEnrolled(enrollError)) throw enrollError;
      }
      toast.success("Đã đăng ký môn học.");
      await loadContent();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể đăng ký môn học."));
    } finally {
      setEnrolling(false);
    }
  };

  const activeChapterIndex = useMemo(
    () =>
      chapters.findIndex(
        (chapter) =>
          (chapter.chapterId || chapter.chapter_id) === activeChapterId
      ),
    [chapters, activeChapterId]
  );
  const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : null;

  const totalTheories = useMemo(
    () => Object.values(theoriesByChapter).reduce((sum, list) => sum + list.length, 0),
    [theoriesByChapter]
  );
  const totalQuizzes = useMemo(
    () => Object.values(quizzesByChapter).reduce((sum, list) => sum + list.length, 0),
    [quizzesByChapter]
  );

  if (loading) {
    return (
      <div className="subject-detail-page subject-detail-page--center">
        <Spinner size={32} />
        <p>Đang tải nội dung môn học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subject-detail-page">
        <ErrorState
          title="Không tải được môn học"
          description={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const subjectName = subject?.name || "Môn học";
  const subjectCourseCode = subject?.courseCode || subject?.course_code || "—";
  const subjectDescription = subject?.description || "";
  const theories = activeChapterId ? theoriesByChapter[activeChapterId] || [] : [];
  const quizzes = activeChapterId ? quizzesByChapter[activeChapterId] || [] : [];
  const activeChapterSkills = activeChapter?.skills || [];
  const contentUnavailable = contentBlocked || Boolean(contentError);

  return (
    <div className="subject-detail-page">
      <Link to="/app/subjects" className="subject-detail-back">
        <ArrowLeft size={16} />
        Môn học
      </Link>

      <header className="subject-detail-header">
        {subject?.imageUrl && (
          <div className="subject-detail-header__cover">
            <img
              src={resolveImageUrl(subject.imageUrl)}
              alt={subjectName}
              className="subject-detail-header__cover-img"
            />
          </div>
        )}
        <div className="subject-detail-header__content">
          <div className="subject-detail-header__main">
            <Badge variant="primary">{subjectCourseCode}</Badge>
            <h1>{subjectName}</h1>
            {subjectDescription && <p>{subjectDescription}</p>}
          </div>
          {!contentUnavailable && (
            <Button variant="primary" onClick={handleOpenAdaptive}>
              Bài kiểm tra thích ứng
            </Button>
          )}
        </div>
      </header>

      {contentBlocked ? (
        <Card padding="lg" className="subject-enroll-cta">
          <span className="subject-enroll-cta__icon">
            <Lock size={22} />
          </span>
          <h2>Bạn chưa đăng ký môn này</h2>
          <p>
            Đăng ký môn học để mở khóa danh sách chương, bài lý thuyết và bài kiểm tra của môn.
          </p>
          <Button
            variant="primary"
            loading={enrolling}
            iconLeft={<Plus size={16} />}
            onClick={handleEnroll}
          >
            Đăng ký ngay
          </Button>
        </Card>
      ) : contentError ? (
        <ErrorState
          title="Không tải được nội dung môn học"
          description={contentError}
          onRetry={loadContent}
        />
      ) : (
        <>
          <div className="subject-detail-stats">
            <StatTile value={chapters.length} label="Chương đã mở" icon={<Layers3 size={18} />} />
            <StatTile value={totalTheories} label="Bài lý thuyết" icon={<BookOpen size={18} />} />
            <StatTile value={totalQuizzes} label="Bài kiểm tra" icon={<ListChecks size={18} />} />
          </div>

          <p className="subject-detail-unlock-hint">
            Chỉ hiện chương đã mở khóa. Chương còn lại mở khi năng lực kỹ năng đạt ngưỡng yêu cầu.
          </p>

          <Modal
            open={adaptiveOpen}
            onClose={closeAdaptiveDialog}
            title="Bài kiểm tra thích ứng"
            size="sm"
            initialFocusRef={adaptiveInputRef}
            footer={
              <>
                <Button variant="ghost" onClick={closeAdaptiveDialog}>Hủy</Button>
                {adaptiveEligibility?.eligible && (
                  <Button variant="primary" loading={startingAdaptive} onClick={handleStartAdaptive}>
                    Bắt đầu
                  </Button>
                )}
              </>
            }
          >
            <div className="adaptive-form">
              {checkingEligibility ? (
                <div className="adaptive-form__checking">
                  <Spinner size={22} />
                  <span>Đang kiểm tra điều kiện làm bài...</span>
                </div>
              ) : adaptiveEligibility && !adaptiveEligibility.eligible ? (
                <div className="adaptive-form__ineligible">
                  <p>
                    Bạn cần hoàn thành {adaptiveEligibility.requiredQuizzes} bài kiểm tra tiêu
                    chuẩn trước khi làm bài kiểm tra thích ứng.
                  </p>
                  <p className="adaptive-form__progress">
                    Đã hoàn thành {adaptiveEligibility.completedQuizzes}/
                    {adaptiveEligibility.requiredQuizzes} bài, còn thiếu{" "}
                    {adaptiveEligibility.remainingQuizzes} bài.
                  </p>
                </div>
              ) : (
                <>
                  <p className="adaptive-form__desc">
                    Nhập số câu (tối thiểu 15 và chia hết cho 5).
                  </p>
                  {adaptiveError && <p className="adaptive-form__error">{adaptiveError}</p>}
                  <Input
                    ref={adaptiveInputRef}
                    type="number"
                    min="15"
                    step="5"
                    aria-label="Số câu hỏi"
                    value={adaptiveCount}
                    onChange={(event) => setAdaptiveCount(event.target.value)}
                  />
                </>
              )}
            </div>
          </Modal>

          {chapters.length === 0 ? (
            <EmptyState
              title="Chưa mở khóa chương nào"
              description="Chương sẽ hiện khi bạn đạt ngưỡng năng lực kỹ năng tương ứng, hoặc khi hệ thống mở khóa."
            />
          ) : (
            <div className="subject-detail-body">
              <aside className="chapter-nav">
                <p className="chapter-nav__title">Chương</p>
                {chapters.map((chapter, index) => {
                  const id = chapter.chapterId || chapter.chapter_id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`chapter-nav__item ${
                        id === activeChapterId ? "active" : ""
                      }`}
                      onClick={() => setActiveChapterId(id)}
                    >
                      <span className="chapter-nav__index">{index + 1}</span>
                      <span className="chapter-nav__name">{chapter.name}</span>
                    </button>
                  );
                })}
              </aside>

              <div className="chapter-panel">
                <Card padding="lg" className="chapter-overview-card">
                  <span className="chapter-overview-card__chip">
                    CHƯƠNG {activeChapterIndex + 1}
                  </span>
                  <h2 className="chapter-overview-card__name">{activeChapter?.name}</h2>
                  <p className="chapter-overview-card__meta">
                    {theories.length} bài lý thuyết · {quizzes.length} bài kiểm tra
                  </p>
                  {activeChapterSkills.length > 0 && (
                    <div className="chapter-overview-card__skills">
                      <span className="chapter-overview-card__skills-label">
                        Kỹ năng liên quan
                      </span>
                      {activeChapterSkills.map((skill) => {
                        const threshold = formatRequiredTheta(skill.requiredTheta);
                        return (
                          <Badge key={skill.skillId} size="sm" className="chapter-skill-badge">
                            {skill.name}
                            {threshold ? (
                              <span className="chapter-skill-badge__theta">≥ {threshold}</span>
                            ) : null}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card padding="lg" className="content-block">
                  <p className="content-block__label">Lý thuyết</p>
                  {theories.length === 0 ? (
                    <p className="content-block__empty">
                      Chương này chưa có nội dung lý thuyết.
                    </p>
                  ) : (
                    <div className="theory-nav-list">
                      {theories.map((theory, index) => {
                        const theoryId = theory.theoryId || theory.theory_id;
                        return (
                          <button
                            key={theoryId}
                            type="button"
                            className="theory-nav-row"
                            onClick={() =>
                              navigate(`/app/subjects/${subjectId}/theories/${theoryId}`)
                            }
                          >
                            <span className="theory-nav-row__index">{index + 1}</span>
                            <span className="theory-nav-row__title">
                              {getTheoryDisplayTitle(theory, index)}
                            </span>
                            <ChevronRight size={16} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card padding="lg" className="content-block">
                  <p className="content-block__label">Bài kiểm tra</p>
                  {quizzes.length === 0 ? (
                    <p className="content-block__empty">
                      Chưa có bài kiểm tra cho chương này.
                    </p>
                  ) : (
                    <div className="quiz-nav-list">
                      {quizzes.map((quiz) => {
                        const quizId = quiz.quizId || quiz.quiz_id;
                        const minutes = quiz.durationMinutes || quiz.duration || 0;
                        return (
                          <div key={quizId} className="quiz-nav-row">
                            <div className="quiz-nav-row__info">
                              <span className="quiz-nav-row__name">{quiz.name}</span>
                              <span className="quiz-nav-row__meta">
                                <ListChecks size={13} />
                                {quiz.totalQuestion} câu
                                {minutes > 0 && (
                                  <>
                                    <Clock3 size={13} />
                                    {minutes} phút
                                  </>
                                )}
                              </span>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => navigate(`/app/quiz/${quizId}`)}
                            >
                              Bắt đầu làm
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {!contentUnavailable && totalTheories > 0 && (
        <ChatBox key={subjectId} subjectId={subjectId} chapterId={activeChapterId} />
      )}
    </div>
  );
}
