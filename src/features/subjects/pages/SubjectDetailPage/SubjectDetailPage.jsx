import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getChaptersBySubject,
  getSubjectById,
  getTheoriesByChapter,
} from "../../../../services/contentService";
import { getQuizzesByChapter } from "../../../../services/quizService";
import "./SubjectDetailPage.css";

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [theoriesByChapter, setTheoriesByChapter] = useState({});
  const [quizzesByChapter, setQuizzesByChapter] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const subjectData = await getSubjectById(subjectId);
        const chapterData = (await getChaptersBySubject(subjectId)) || [];

        const [theoryEntries, quizEntries] = await Promise.all([
          Promise.all(
            chapterData.map(async (chapter) => [
              chapter.chapterId || chapter.chapter_id,
              (await getTheoriesByChapter(chapter.chapterId || chapter.chapter_id)) || [],
            ]),
          ),
          Promise.all(
            chapterData.map(async (chapter) => [
              chapter.chapterId || chapter.chapter_id,
              (await getQuizzesByChapter(chapter.chapterId || chapter.chapter_id)) || [],
            ]),
          ),
        ]);

        setSubject(subjectData);
        setChapters(chapterData);
        setTheoriesByChapter(Object.fromEntries(theoryEntries));
        setQuizzesByChapter(Object.fromEntries(quizEntries));
      } catch (err) {
        console.error("Error loading subject details:", err);
        setError(err.message || "Không thể tải thông tin môn học");
      }
    };
    if (subjectId) {
      load();
    }
  }, [subjectId]);

  if (!subject && !error) return <div>Đang tải nội dung môn học...</div>;
  
  if (error) {
    return (
      <div className="subject-detail-page">
        <div className="error-state">
          <h1>Lỗi</h1>
          <p>{error}</p>
          <button onClick={() => navigate("/app/subjects")}>
            Quay lại danh sách môn học
          </button>
        </div>
      </div>
    );
  }

  // Normalize subject data to handle both camelCase and snake_case
  const subjectName = subject?.name || subject?.title || "Môn học";
  const subjectCourseCode = subject?.courseCode || subject?.course_code || "-";
  const subjectDescription = subject?.description || "";

  return (
    <div className="subject-detail-page">
      <div className="subject-detail-header">
        <h1>{subjectName}</h1>
        <div className="subject-detail-meta">
          <span>Mã môn: {subjectCourseCode}</span>
          <span>{chapters.length} chương</span>
        </div>
        {subjectDescription && <p>{subjectDescription}</p>}
      </div>

      <div className="chapters-section">
        {chapters.map((chapter) => {
          const chapterId = chapter.chapterId || chapter.chapter_id;
          const theories = theoriesByChapter[chapterId] || [];
          const quizzes = quizzesByChapter[chapterId] || [];

          return (
            <article key={chapterId} className="chapter-section">
              <div className="chapter-header">
                <h3>{chapter.name}</h3>
              </div>

              <div className="chapter-content">
                <div className="theory-section">
                  <h4>📖 Lý thuyết</h4>
                  {theories.length === 0 ? (
                    <div className="empty-state">
                      Chương này chưa có nội dung lý thuyết.
                    </div>
                  ) : (
                    theories.map((theory) => (
                      <div key={theory.theoryId || theory.theory_id} className="theory-item">
                        {theory.content}
                      </div>
                    ))
                  )}
                </div>

                <div className="quiz-section">
                  <h4>📝 Bài kiểm tra</h4>
                  {quizzes.length === 0 ? (
                    <div className="empty-state">
                      Chưa có đề kiểm tra cho chương này.
                    </div>
                  ) : (
                    <div className="quiz-list">
                      {quizzes.map((quiz) => (
                        <div
                          key={quiz.quizId || quiz.quiz_id}
                          className="quiz-card"
                          onClick={() => navigate(`/app/quiz/${quiz.quizId || quiz.quiz_id}`)}
                        >
                          <div className="quiz-card-title">{quiz.name}</div>
                          <div className="quiz-card-meta">
                            <span className={`quiz-type-badge ${quiz.type?.toLowerCase()}`}>
                              {quiz.type}
                            </span>
                            <span>{quiz.totalQuestion} câu</span>
                            <span>{quiz.duration} phút</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
