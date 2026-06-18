import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getChaptersBySubject, getSubjectById, getTheoriesByChapter } from "../../../../services/contentService";

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [theoriesByChapter, setTheoriesByChapter] = useState({});

  useEffect(() => {
    const load = async () => {
      const subjectData = await getSubjectById(subjectId);
      const chapterData = (await getChaptersBySubject(subjectId)) || [];
      const theoryEntries = await Promise.all(
        chapterData.map(async (chapter) => [
          chapter.chapterId,
          (await getTheoriesByChapter(chapter.chapterId)) || [],
        ]),
      );

      setSubject(subjectData);
      setChapters(chapterData);
      setTheoriesByChapter(Object.fromEntries(theoryEntries));
    };
    load();
  }, [subjectId]);

  if (!subject) return <div>Đang tải nội dung môn học...</div>;

  return (
    <section>
      <h1>{subject.name}</h1>
      <p>{subject.description || "Chưa có mô tả môn học."}</p>
      <p>Mã môn: {subject.courseCode}</p>
      <hr />
      {chapters.map((chapter) => (
        <article key={chapter.chapterId} style={{ marginBottom: "16px" }}>
          <h3>{chapter.name}</h3>
          {(theoriesByChapter[chapter.chapterId] || []).length === 0 && (
            <p>Chương này chưa có nội dung lý thuyết.</p>
          )}
          {(theoriesByChapter[chapter.chapterId] || []).map((theory) => (
            <div key={theory.theoryId} style={{ padding: "8px 0" }}>
              {theory.content}
            </div>
          ))}
        </article>
      ))}
    </section>
  );
}
