import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
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
  getSubjectStudyOverview,
  getTheoriesBySubject,
} from "../../../../services/contentService";
import {
  getAdaptiveEligibility,
  getActiveAttempts,
  getQuizzesBySubject,
  startAdaptiveQuiz,
} from "../../../../services/quizService";
import {
  enrollCourse,
  getMyEnrollments,
  isAlreadyEnrolled,
} from "../../../../services/enrollmentService";
import { getUserSkillAbilities } from "../../../../services/progressService";
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
import { resolveImageUrl } from "../../../../services/mappers";
import { getTheoryDisplayTitle } from "../../../content/utils/theoryDisplay.js";
import { isValidAdaptiveQuestionCount } from "../../../quiz/pages/AdaptiveQuizPage/AdaptiveQuizPage.logic.js";
import {
  buildAbilityMap,
  formatCurrentTheta,
  formatRequiredTheta,
  isSkillRequirementMet,
  resolveSkillCurrentTheta,
} from "./SubjectDetailPage.logic.js";
import "./SubjectDetailPage.css";

// Dùng chung cho cả nhánh đặt lỗi lẫn nhánh render để nhận diện trường hợp 404.
const NOT_FOUND_MESSAGE = "Không tìm thấy môn học này.";

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [theoriesByChapter, setTheoriesByChapter] = useState({});
  const [quizzesByChapter, setQuizzesByChapter] = useState({});
  const [activeChapterId, setActiveChapterId] = useState(
    () => location.state?.chapterId || location.state?.activeChapterId || null
  );
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
  const [warningQuiz, setWarningQuiz] = useState(null);
  const [userAbilities, setUserAbilities] = useState([]);
  const [activeAttempts, setActiveAttempts] = useState([]);
  const adaptiveCancelledRef = useRef(false);
  const adaptiveInputRef = useRef(null);
  const loadIdRef = useRef(0);

  const userAbilityMap = useMemo(() => buildAbilityMap(userAbilities), [userAbilities]);
  const activeAttemptByQuizId = useMemo(
    () => new Map(activeAttempts.map((attempt) => [String(attempt.quizId), attempt])),
    [activeAttempts],
  );

  useEffect(() => {
    const storedUser = getStoredUser();
    const userId = storedUser?.userId || storedUser?.id;
    if (!userId) {
      setActiveAttempts([]);
      return undefined;
    }

    let isCurrent = true;
    getActiveAttempts(userId)
      .then((attempts) => {
        if (isCurrent) setActiveAttempts(attempts || []);
      })
      .catch(() => {
        if (isCurrent) setActiveAttempts([]);
      });

    return () => {
      isCurrent = false;
    };
  }, [subjectId]);

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

  // Chỉ admin thật (không ở chế độ xem như sinh viên) hoặc người đã đăng ký mới
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

  const applyStudyOverview = useCallback((data) => {
    setSubject({
      subjectId: data.subjectId,
      name: data.name,
      courseCode: data.courseCode,
      description: data.description,
      imageUrl: data.imageUrl,
    });

    if (!data.enrolled) {
      setContentBlocked(true);
      setChapters([]);
      setTheoriesByChapter({});
      setQuizzesByChapter({});
      setUserAbilities([]);
      setActiveChapterId(null);
      return;
    }

    setContentBlocked(false);
    const chapterData = data.chapters || [];
    const chapterIds = chapterData.map((ch) => ch.chapterId || ch.chapter_id);
    const theoryEntries = chapterData.map((ch) => [
      ch.chapterId || ch.chapter_id,
      ch.theories || [],
    ]);
    const quizEntries = chapterData.map((ch) => [
      ch.chapterId || ch.chapter_id,
      ch.quizzes || [],
    ]);

    setChapters(chapterData);
    setTheoriesByChapter(Object.fromEntries(theoryEntries));
    setQuizzesByChapter(Object.fromEntries(quizEntries));

    const targetChapterId = location.state?.chapterId || location.state?.activeChapterId;
    setActiveChapterId((current) => {
      if (current && chapterIds.includes(current)) return current;
      if (targetChapterId && chapterIds.includes(targetChapterId)) return targetChapterId;
      return chapterIds[0] || null;
    });
  }, [location.state?.chapterId, location.state?.activeChapterId]);

  // Dự phòng: luồng multi-request cũ phòng trường hợp endpoint mới gặp lỗi
  const loadContentLegacy = useCallback(async () => {
    const loadId = loadIdRef.current;
    setContentError(null);

    const canAccessContent = await resolveContentAccess();
    if (loadIdRef.current !== loadId) return;

    if (!canAccessContent) {
      setChapters([]);
      setTheoriesByChapter({});
      setQuizzesByChapter({});
      setUserAbilities([]);
      setActiveChapterId(null);
      setContentBlocked(true);
      return;
    }
    setContentBlocked(false);

    const storedUser = getStoredUser();
    const currentUserId = storedUser?.userId || storedUser?.id || null;

    const [chapterRes, theoriesRes, quizzesRes, abilitiesRes] = await Promise.allSettled([
      getChaptersBySubject(subjectId),
      getTheoriesBySubject(subjectId),
      getQuizzesBySubject(subjectId),
      currentUserId ? getUserSkillAbilities(currentUserId) : Promise.resolve([]),
    ]);
    if (loadIdRef.current !== loadId) return;

    const failures = [chapterRes, theoriesRes, quizzesRes]
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);

    if (failures.length > 0) {
      setChapters([]);
      setTheoriesByChapter({});
      setQuizzesByChapter({});
      setUserAbilities([]);
      setActiveChapterId(null);
      if (failures.some(isAccessDenied)) {
        setContentBlocked(true);
      } else {
        setContentError(getErrorMessage(failures[0], "Không thể tải nội dung môn học."));
      }
      return;
    }

    const chapterData = chapterRes.value || [];
    const theories = theoriesRes.value || [];
    const quizzes = quizzesRes.value || [];
    const abilities =
      abilitiesRes.status === "fulfilled" && Array.isArray(abilitiesRes.value)
        ? abilitiesRes.value
        : [];

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
    setUserAbilities(abilities);
    const targetChapterId = location.state?.chapterId || location.state?.activeChapterId;
    setActiveChapterId((current) => {
      if (current && chapterIds.includes(current)) return current;
      if (targetChapterId && chapterIds.includes(targetChapterId)) return targetChapterId;
      return chapterIds[0] || null;
    });
  }, [subjectId, resolveContentAccess, location.state?.chapterId, location.state?.activeChapterId]);

  const load = useCallback(async () => {
    const loadId = (loadIdRef.current += 1);
    setLoading(true);
    setError(null);
    setContentError(null);

    try {
      // Primary: Endpoint tổng hợp study-overview (Phase 3 optimization)
      const overview = await getSubjectStudyOverview(subjectId);
      if (loadIdRef.current !== loadId) return;
      applyStudyOverview(overview);
    } catch {
      // Resilient Fallback: Gọi luồng Promise.allSettled cũ nếu endpoint tổng hợp lỗi
      if (loadIdRef.current !== loadId) return;
      const [subjectResult] = await Promise.allSettled([
        getSubjectById(subjectId),
        loadContentLegacy(),
      ]);
      if (loadIdRef.current !== loadId) return;

      // Chốt phòng thủ: BE có thể trả 200 kèm data rỗng cho id sai, khi đó
      // không được coi là môn học hợp lệ để tránh render trang trống vô nghĩa.
      const subjectIdValue = subjectResult.value?.subjectId || subjectResult.value?.subject_id;
      if (subjectResult.status === "rejected") {
        setError(getErrorMessage(subjectResult.reason, "Không thể tải thông tin môn học."));
      } else if (!subjectIdValue) {
        setError(NOT_FOUND_MESSAGE);
      } else {
        setSubject(subjectResult.value);
      }
    } finally {
      if (loadIdRef.current === loadId) {
        setLoading(false);
      }
    }
  }, [subjectId, applyStudyOverview, loadContentLegacy]);

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
      await load();
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
  const activeChapterUnlocked = activeChapter ? activeChapter.unlocked !== false : true;

  const unlockedChaptersCount = useMemo(
    () => chapters.filter((c) => c.unlocked !== false).length,
    [chapters]
  );

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

  // Môn không tồn tại thì thử lại là vô nghĩa, chỉ cần lối về danh sách môn.
  const subjectNotFound = error === NOT_FOUND_MESSAGE;

  if (error) {
    return (
      <div className="subject-detail-page">
        {subjectNotFound ? (
          <EmptyState
            title="Không tìm thấy môn học"
            description={NOT_FOUND_MESSAGE}
            action={
              <Button variant="primary" onClick={() => navigate("/app/subjects")}>
                Về danh sách môn học
              </Button>
            }
          />
        ) : (
          <ErrorState
            title="Không tải được môn học"
            description={error}
            onRetry={load}
          />
        )}
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
            <span className="subject-detail-header__code">{subjectCourseCode}</span>
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
          onRetry={load}
        />
      ) : (
        <>
          <div className="subject-detail-stats">
            <StatTile value={`${unlockedChaptersCount}/${chapters.length}`} label="Chương đã mở" icon={<Layers3 size={18} />} />
            <StatTile value={totalTheories} label="Bài lý thuyết" icon={<BookOpen size={18} />} />
            <StatTile value={totalQuizzes} label="Bài kiểm tra" icon={<ListChecks size={18} />} />
          </div>

          <p className="subject-detail-unlock-hint">
            Hiển thị toàn bộ chương của môn học. Các chương có viền vàng là chương chưa mở khóa do năng lực các chương trước chưa đạt yêu cầu.
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

          <Modal
            open={Boolean(warningQuiz)}
            onClose={() => setWarningQuiz(null)}
            title="Cảnh báo năng lực"
            size="sm"
            footer={
              <>
                <Button variant="ghost" onClick={() => setWarningQuiz(null)}>
                  Để sau
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const qId = warningQuiz.quizId || warningQuiz.quiz_id;
                    setWarningQuiz(null);
                    navigate(`/app/quiz/${qId}`);
                  }}
                >
                  Tôi vẫn muốn làm
                </Button>
              </>
            }
          >
            <div className="chapter-quiz-warning-modal">
              <div className="chapter-quiz-warning-modal__icon">
                <AlertTriangle size={24} />
              </div>
              <p className="chapter-quiz-warning-modal__text">
                Năng lực bạn chưa đủ để làm bài này, bạn vẫn có thể làm nhưng vẫn khuyến khích hoàn thiện các chương trước đó.
              </p>
            </div>
          </Modal>

          {chapters.length === 0 ? (
            <EmptyState
              title="Chưa có chương nào"
              description="Chưa có dữ liệu chương cho môn học này."
            />
          ) : (
            <div className="subject-detail-body">
              <aside className="chapter-nav">
                <p className="chapter-nav__title">Chương</p>
                {chapters.map((chapter, index) => {
                  const id = chapter.chapterId || chapter.chapter_id;
                  const isUnlocked = chapter.unlocked !== false;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`chapter-nav__item ${
                        id === activeChapterId ? "active" : ""
                      } ${!isUnlocked ? "chapter-nav__item--locked" : ""}`}
                      onClick={() => setActiveChapterId(id)}
                    >
                      <span className="chapter-nav__index">{index + 1}</span>
                      <span className="chapter-nav__name">{chapter.name}</span>
                      {!isUnlocked && (
                        <span className="chapter-nav__locked-tag" title="Chưa mở khóa do chưa đủ năng lực">
                          <Lock size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </aside>

              <div className="chapter-panel">
                <Card
                  padding="lg"
                  className={`chapter-overview-card ${
                    !activeChapterUnlocked ? "chapter-overview-card--locked" : ""
                  }`}
                >
                  <div className="chapter-overview-card__header-row">
                    <span className="chapter-overview-card__chip">
                      CHƯƠNG {activeChapterIndex + 1}
                    </span>
                    {!activeChapterUnlocked && (
                      <Badge variant="warning" size="sm" className="chapter-locked-badge">
                        <Lock size={12} /> Chưa mở khóa
                      </Badge>
                    )}
                  </div>
                  <h2 className="chapter-overview-card__name">{activeChapter?.name}</h2>
                  <p className="chapter-overview-card__meta">
                    {theories.length} bài lý thuyết · {quizzes.length} bài kiểm tra
                  </p>
                  {!activeChapterUnlocked && (
                    <div className="chapter-locked-banner" role="alert">
                      <AlertTriangle size={18} className="chapter-locked-banner__icon" />
                      <div className="chapter-locked-banner__content">
                        <strong>Chương này chưa mở khóa.</strong>{" "}
                        Hãy hoàn thành bài kiểm tra của chương trước để mở khóa chương này.{" "}
                        Bạn vẫn có thể học và làm bài kiểm tra, nhưng nên hoàn thiện các chương trước đó.
                      </div>
                    </div>
                  )}
                  {activeChapterSkills.length > 0 && (
                    <div className="chapter-overview-card__skills">
                      <span className="chapter-overview-card__skills-label">
                        Kỹ năng bao gồm trong chương này
                      </span>
                      {activeChapterSkills.map((skill) => {
                        const currentThetaRaw = resolveSkillCurrentTheta(skill, userAbilityMap);
                        const threshold = formatRequiredTheta(skill.requiredTheta);
                        const current = formatCurrentTheta(currentThetaRaw);
                        const isMet = isSkillRequirementMet(currentThetaRaw, skill.requiredTheta);
                        return (
                          <Badge
                            key={skill.skillId || skill.id || skill.name}
                            size="sm"
                            variant={isMet ? "success" : "neutral"}
                            className={`chapter-skill-badge ${isMet ? "chapter-skill-badge--met" : "chapter-skill-badge--unmet"}`}
                            title={
                              threshold
                                ? `Năng lực hiện có: ${current} / Yêu cầu: ${threshold}`
                                : `Kỹ năng: ${skill.name}`
                            }
                          >
                            <span>{skill.name}</span>
                            {threshold ? (
                              <span
                                className="chapter-skill-badge__theta"
                                aria-label={`Năng lực hiện có ${current}, yêu cầu ${threshold}`}
                              >
                                {current}/{threshold}
                              </span>
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
                        const activeAttempt = activeAttemptByQuizId.get(String(quizId));
                        return (
                          <div
                            key={quizId}
                            className={`quiz-nav-row ${
                              !activeChapterUnlocked ? "quiz-nav-row--warning" : ""
                            }`}
                          >
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
                                {!activeChapterUnlocked && (
                                  <span className="quiz-nav-row__warning-tag">
                                    <AlertTriangle size={12} /> Chưa mở khóa
                                  </span>
                                )}
                              </span>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (activeChapterUnlocked) {
                                  const unfinishedAttempt = activeAttempts.find((attempt) => {
                                    const deadline = Date.parse(attempt.deadlineAt || "");
                                    return !Number.isFinite(deadline) || deadline > Date.now();
                                  });
                                  if (
                                    unfinishedAttempt &&
                                    String(unfinishedAttempt.quizId) !== String(quizId)
                                  ) {
                                    toast.error(
                                      `Bạn còn bài \"${unfinishedAttempt.quizName || "bài kiểm tra"}\" đang làm dở. Hãy hoàn thành bài đó trước khi bắt đầu bài khác.`,
                                    );
                                    return;
                                  }

                                  const resumeQuery = activeAttempt
                                    ? `?attemptId=${encodeURIComponent(activeAttempt.attemptId)}`
                                    : "";
                                  navigate(`/app/quiz/${quizId}${resumeQuery}`);
                                } else {
                                  setWarningQuiz(quiz);
                                }
                              }}
                            >
                              {activeAttempt ? "Tiếp tục làm" : "Bắt đầu làm"}
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
