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

  useEffect(() => {
    const load = async () => {
      const subjectData = await getSubjectById(subjectId);
      const chapterData = (await getChaptersBySubject(subjectId)) || [];

      const [theoryEntries, quizEntries] = await Promise.all([
        Promise.all(
          chapterData.map(async (chapter) => [
            chapter.chapterId,
            (await getTheoriesByChapter(chapter.chapterId)) || [],
          ]),
        ),
        Promise.all(
          chapterData.map(async (chapter) => [
            chapter.chapterId,
            (await getQuizzesByChapter(chapter.chapterId)) || [],
          ]),
        ),
      ]);

      setSubject(subjectData);
      setChapters(chapterData);
      setTheoriesByChapter(Object.fromEntries(theoryEntries));
      setQuizzesByChapter(Object.fromEntries(quizEntries));
    };
    load();
  }, [subjectId]);

  if (!subject) return <div>Đang tải nội dung môn học...</div>;

  return (
    <div className="subject-detail-page">
      <div className="subject-detail-header">
        <h1>{subject.name}</h1>
        <div className="subject-detail-meta">
          <span>Mã môn: {subject.courseCode}</span>
          <span>{chapters.length} chương</span>
        </div>
        {subject.description && <p>{subject.description}</p>}
      </div>

      <div className="chapters-section">
        {chapters.map((chapter) => {
          const theories = theoriesByChapter[chapter.chapterId] || [];
          const quizzes = quizzesByChapter[chapter.chapterId] || [];

          return (
            <article key={chapter.chapterId} className="chapter-section">
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
                      <div key={theory.theoryId} className="theory-item">
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
                          key={quiz.quizId}
                          className="quiz-card"
                          onClick={() => navigate(`/app/quiz/${quiz.quizId}`)}
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
