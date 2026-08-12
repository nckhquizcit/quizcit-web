import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Clock3, ListChecks } from "lucide-react";
import {
  getChaptersBySubject,
  getSubjectById,
  getTheoriesBySubject,
} from "../../../../services/contentService";
import { getQuizzesBySubject, startAdaptiveQuiz } from "../../../../services/quizService";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
} from "../../../../components/ui";
import ChatBox from "../../../../components/ChatBox/ChatBox";
import { getErrorMessage } from "../../../../services/apiClient";
import { getTheoryDisplayTitle } from "../../../content/utils/theoryDisplay.js";
import { isValidAdaptiveQuestionCount } from "../../../quiz/pages/AdaptiveQuizPage/AdaptiveQuizPage.logic.js";
import "./SubjectDetailPage.css";

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [theoriesByChapter, setTheoriesByChapter] = useState({});
  const [quizzesByChapter, setQuizzesByChapter] = useState({});
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adaptiveOpen, setAdaptiveOpen] = useState(false);
  const [adaptiveCount, setAdaptiveCount] = useState(15);
  const [startingAdaptive, setStartingAdaptive] = useState(false);
  const [adaptiveError, setAdaptiveError] = useState("");
  const adaptiveCancelledRef = useRef(false);

  const closeAdaptiveDialog = useCallback(() => {
    adaptiveCancelledRef.current = true;
    setAdaptiveOpen(false);
    setAdaptiveError("");
  }, []);

  useEffect(() => {
    if (!adaptiveOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeAdaptiveDialog();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [adaptiveOpen, closeAdaptiveDialog]);

  const handleStartAdaptive = async () => {
    const count = Number(adaptiveCount);
    if (!isValidAdaptiveQuestionCount(count)) {
      setAdaptiveError("Số câu của bài thích ứng phải từ 15 trở lên và chia hết cho 5.");
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

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [subjectData, chapterData = [], theories = [], quizzes = []] = await Promise.all([
          getSubjectById(subjectId), getChaptersBySubject(subjectId),
          getTheoriesBySubject(subjectId), getQuizzesBySubject(subjectId),
        ]);
        const theoryEntries = chapterData.map((chapter) => {
          const id = chapter.chapterId || chapter.chapter_id;
          return [id, theories.filter((theory) => theory.chapterId === id)];
        });
        const quizEntries = chapterData.map((chapter) => {
          const id = chapter.chapterId || chapter.chapter_id;
          return [id, quizzes.filter((quiz) => quiz.chapterId === id)];
        });

        if (!alive) return;
        setSubject(subjectData);
        setChapters(chapterData);
        setTheoriesByChapter(Object.fromEntries(theoryEntries));
        setQuizzesByChapter(Object.fromEntries(quizEntries));
        setActiveChapterId(
          chapterData[0]?.chapterId || chapterData[0]?.chapter_id || null
        );
      } catch (err) {
        if (alive)
          setError(getErrorMessage(err, "Không thể tải thông tin môn học."));
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (subjectId) load();
    return () => {
      alive = false;
    };
  }, [subjectId]);

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

  return (
    <div className="subject-detail-page">
      <button
        type="button"
        className="subject-detail-back"
        onClick={() => navigate("/app/subjects")}
      >
        <ArrowLeft size={16} />
        Môn học
      </button>

      <header className="subject-detail-header">
        <div className="subject-detail-header__main">
          <Badge variant="primary">{subjectCourseCode}</Badge>
          <h1>{subjectName}</h1>
          {subjectDescription && <p>{subjectDescription}</p>}
        </div>
        <Button variant="primary" onClick={() => setAdaptiveOpen(true)}>
          Ôn tập thích ứng
        </Button>
      </header>

      <div className="subject-detail-stats">
        <div className="subject-detail-stats__cell">
          <span className="subject-detail-stats__value">{chapters.length}</span>
          <span className="subject-detail-stats__label">Chương</span>
        </div>
        <span className="subject-detail-stats__divider" aria-hidden="true" />
        <div className="subject-detail-stats__cell">
          <span className="subject-detail-stats__value">{totalTheories}</span>
          <span className="subject-detail-stats__label">Bài lý thuyết</span>
        </div>
        <span className="subject-detail-stats__divider" aria-hidden="true" />
        <div className="subject-detail-stats__cell">
          <span className="subject-detail-stats__value">{totalQuizzes}</span>
          <span className="subject-detail-stats__label">Bài kiểm tra</span>
        </div>
      </div>

      {adaptiveOpen && (
        <div className="adaptive-dialog-backdrop" onClick={closeAdaptiveDialog}>
          <section
            className="adaptive-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adaptive-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="adaptive-dialog-title">Tạo bài kiểm tra thích ứng</h2>
            <p>Nhập số câu (tối thiểu 15 và chia hết cho 5).</p>
            {adaptiveError && <p className="adaptive-dialog__error">{adaptiveError}</p>}
            <input
              type="number"
              min="15"
              step="5"
              aria-label="Số câu hỏi"
              value={adaptiveCount}
              onChange={(event) => setAdaptiveCount(event.target.value)}
            />
            <div className="adaptive-dialog__actions">
              <Button variant="ghost" onClick={closeAdaptiveDialog}>Hủy</Button>
              <Button variant="primary" loading={startingAdaptive} onClick={handleStartAdaptive}>
                Bắt đầu
              </Button>
            </div>
          </section>
        </div>
      )}

      {chapters.length === 0 ? (
        <EmptyState
          title="Chưa có chương nào"
          description="Môn học này chưa có nội dung chương để hiển thị."
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
                    Kỹ năng rèn luyện
                  </span>
                  {activeChapterSkills.map((skill) => (
                    <Badge key={skill.skillId} size="sm">
                      {skill.name}
                    </Badge>
                  ))}
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

      {theories.length > 0 && (
        <ChatBox key={subjectId} subjectId={subjectId} chapterId={activeChapterId} />
      )}
    </div>
  );
}
