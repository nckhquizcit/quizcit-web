import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  FileText,
  ListChecks,
} from "lucide-react";
import {
  getChaptersBySubject,
  getSubjectById,
  getTheoriesBySubject,
} from "../../../../services/contentService";
import { getQuizzesBySubject } from "../../../../services/quizService";
import { startAdaptiveQuiz } from "../../../../services/quizService";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
} from "../../../../components/ui";
import { getErrorMessage } from "../../../../services/apiClient";
import TheoryContent from "../../../content/components/TheoryContent";
import ChatBox from "../../../../components/ChatBox/ChatBox";
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
  const [expandedTheories, setExpandedTheories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adaptiveOpen, setAdaptiveOpen] = useState(false);
  const [adaptiveCount, setAdaptiveCount] = useState(15);
  const [startingAdaptive, setStartingAdaptive] = useState(false);
  const [adaptiveError, setAdaptiveError] = useState("");

  const handleStartAdaptive = async () => {
    const count = Number(adaptiveCount);
    if (!isValidAdaptiveQuestionCount(count)) {
      setAdaptiveError("Số câu của bài thích ứng phải từ 15 trở lên và chia hết cho 5.");
      return;
    }
    try {
      setStartingAdaptive(true);
      setAdaptiveError("");
      const state = await startAdaptiveQuiz(subjectId, count);
      navigate(`/app/adaptive/${state.attemptId}`);
    } catch (err) {
      setAdaptiveError(getErrorMessage(err, "Không thể tạo bài kiểm tra thích ứng."));
    } finally {
      setStartingAdaptive(false);
    }
  };

  const toggleTheory = (theoryId) => {
    setExpandedTheories((current) => ({
      ...current,
      [theoryId]: !current[theoryId],
    }));
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

  const activeChapter = useMemo(
    () =>
      chapters.find(
        (chapter) =>
          (chapter.chapterId || chapter.chapter_id) === activeChapterId
      ) || null,
    [chapters, activeChapterId]
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
  const subjectCourseCode = subject?.courseCode || subject?.course_code || "-";
  const subjectDescription = subject?.description || "";
  const theories = activeChapter
    ? theoriesByChapter[
        activeChapter.chapterId || activeChapter.chapter_id
      ] || []
    : [];
  const quizzes = activeChapter
    ? quizzesByChapter[
        activeChapter.chapterId || activeChapter.chapter_id
      ] || []
    : [];

  return (
    <div className="subject-detail-page">
      <button
        type="button"
        className="subject-detail-back"
        onClick={() => navigate("/app/subjects")}
      >
        <ArrowLeft size={16} />
        Danh sách môn học
      </button>

      <header className="subject-detail-header">
        <div className="subject-detail-header__main">
          <Badge variant="primary">{subjectCourseCode}</Badge>
          <h1>{subjectName}</h1>
          {subjectDescription && <p>{subjectDescription}</p>}
        </div>
        <div className="subject-detail-header__meta">
          <span>
            <BookOpen size={16} /> {chapters.length} chương
          </span>
          <Button variant="primary" onClick={() => setAdaptiveOpen(true)}>
            Làm bài thích ứng
          </Button>
        </div>
      </header>

      {adaptiveOpen && (
        <div className="adaptive-dialog-backdrop" onClick={() => setAdaptiveOpen(false)}>
          <section className="adaptive-dialog" onClick={(event) => event.stopPropagation()}>
            <h2>Tạo bài kiểm tra thích ứng</h2>
            <p>Nhập số câu (tối thiểu 15 và chia hết cho 5).</p>
            {adaptiveError && <p className="adaptive-dialog__error">{adaptiveError}</p>}
            <input
              type="number"
              min="15"
              step="5"
              value={adaptiveCount}
              onChange={(event) => setAdaptiveCount(event.target.value)}
            />
            <div className="adaptive-dialog__actions">
              <Button variant="ghost" onClick={() => setAdaptiveOpen(false)}>Hủy</Button>
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
            <Card padding="lg" className="content-block">
              <div className="content-block__title">
                <FileText size={18} />
                <h2>Lý thuyết</h2>
              </div>
              {theories.length === 0 ? (
                <p className="content-block__empty">
                  Chương này chưa có nội dung lý thuyết.
                </p>
              ) : (
                <div className="theory-list">
                  {theories.map((theory) => {
                    const theoryId = theory.theoryId || theory.theory_id;
                    const theoryText = theory.content || "";
                    const isTheoryExpanded = Boolean(expandedTheories[theoryId]);
                    const isLongTheory =
                      theoryText.length > 320 ||
                      theoryText.split(/\r?\n/).length > 6;

                    return (
                      <div key={theoryId} className="theory-item">
                        <TheoryContent
                          content={theoryText}
                          contentFormat={theory.contentFormat}
                          className={
                            isTheoryExpanded ? "is-expanded" : "is-collapsed"
                          }
                        />
                        {isLongTheory && (
                          <button
                            type="button"
                            className="theory-expand-btn"
                            onClick={() => toggleTheory(theoryId)}
                          >
                            {isTheoryExpanded ? "Thu gọn" : "Xem đầy đủ"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card padding="lg" className="content-block">
              <div className="content-block__title">
                <ListChecks size={18} />
                <h2>Bài kiểm tra</h2>
              </div>
              {quizzes.length === 0 ? (
                <p className="content-block__empty">
                  Chưa có đề kiểm tra cho chương này.
                </p>
              ) : (
                <div className="quiz-list">
                  {quizzes.map((quiz) => {
                    const quizId = quiz.quizId || quiz.quiz_id;
                    const minutes = quiz.durationMinutes || quiz.duration || 0;
                    return (
                      <Card
                        key={quizId}
                        interactive
                        padding="md"
                        className="quiz-card"
                        onClick={() => navigate(`/app/quiz/${quizId}`)}
                      >
                        <div className="quiz-card__head">
                          <h3>{quiz.name}</h3>
                          {quiz.type && (
                            <Badge variant="info" size="sm">
                              {quiz.type}
                            </Badge>
                          )}
                        </div>
                        <div className="quiz-card__meta">
                          <span>
                            <ListChecks size={14} />
                            {quiz.totalQuestion} câu
                          </span>
                          {minutes > 0 && (
                            <span>
                              <Clock3 size={14} />
                              {minutes} phút
                            </span>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="quiz-card__cta"
                        >
                          Bắt đầu làm
                        </Button>
                      </Card>
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
