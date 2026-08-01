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
  getTheoriesByChapter,
} from "../../../../services/contentService";
import { getQuizzesByChapter } from "../../../../services/quizService";
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

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const subjectData = await getSubjectById(subjectId);
        const chapterData = (await getChaptersBySubject(subjectId)) || [];

        const [theoryEntries, quizEntries] = await Promise.all([
          Promise.all(
            chapterData.map(async (chapter) => [
              chapter.chapterId || chapter.chapter_id,
              (await getTheoriesByChapter(
                chapter.chapterId || chapter.chapter_id
              )) || [],
            ])
          ),
          Promise.all(
            chapterData.map(async (chapter) => [
              chapter.chapterId || chapter.chapter_id,
              (await getQuizzesByChapter(
                chapter.chapterId || chapter.chapter_id
              )) || [],
            ])
          ),
        ]);

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
        </div>
      </header>

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
                  {theories.map((theory) => (
                    <div
                      key={theory.theoryId || theory.theory_id}
                      className="theory-item"
                    >
                      <TheoryContent
                        content={theory.content}
                        contentFormat={theory.contentFormat}
                      />
                    </div>
                  ))}
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
    </div>
  );
}
