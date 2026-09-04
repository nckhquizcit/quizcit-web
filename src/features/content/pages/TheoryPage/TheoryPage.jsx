import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import {
  getChaptersBySubject,
  getTheoriesByChapter,
  getTheoryById,
} from "../../../../services/contentService";
import { getErrorMessage, isAccessDenied } from "../../../../services/apiClient";
import { Button, Card, EmptyState, ErrorState, Spinner } from "../../../../components/ui";
import ChatBox from "../../../../components/ChatBox/ChatBox";
import { useChatSession } from "../../../../components/ChatBox/useChatSession";
import ChatMessages from "../../../../components/ChatBox/ChatMessages";
import ChatComposer from "../../../../components/ChatBox/ChatComposer";
import TheoryContent from "../../components/TheoryContent";
import { getTheoryDisplayTitle, stripLeadingTitleBlock } from "../../utils/theoryDisplay.js";
import "./TheoryPage.css";

export default function TheoryPage() {
  const { subjectId, theoryId } = useParams();
  const navigate = useNavigate();
  const chatInputRef = useRef(null);

  const [chapter, setChapter] = useState(null);
  const [chapterIndex, setChapterIndex] = useState(-1);
  const [theory, setTheory] = useState(null);
  const [chapterTheories, setChapterTheories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        setAccessDenied(false);
        const [chapters = [], theoryData] = await Promise.all([
          getChaptersBySubject(subjectId),
          getTheoryById(theoryId),
        ]);
        const chapterId = theoryData.chapterId || theoryData.chapter_id;
        const idx = chapters.findIndex(
          (item) => (item.chapterId || item.chapter_id) === chapterId
        );
        const theories = chapterId ? await getTheoriesByChapter(chapterId) : [];

        if (!alive) return;
        setChapter(idx >= 0 ? chapters[idx] : null);
        setChapterIndex(idx);
        setTheory(theoryData);
        setChapterTheories(theories);
      } catch (err) {
        if (!alive) return;
        // BE trả 403 khi chưa đăng ký môn, hướng người dùng về trang đăng ký.
        if (isAccessDenied(err)) {
          setAccessDenied(true);
        } else {
          setError(getErrorMessage(err, "Không thể tải nội dung bài học."));
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (subjectId && theoryId) load();
    return () => {
      alive = false;
    };
  }, [subjectId, theoryId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [theoryId]);

  const chapterId = chapter?.chapterId || chapter?.chapter_id || null;
  const handleGoBack = () => {
    navigate(`/app/subjects/${subjectId}`, { state: { chapterId } });
  };
  // Một phiên chat duy nhất cho cả dock desktop lẫn FAB mobile — đổi kích
  // thước cửa sổ qua mốc 1023px không làm mất hội thoại.
  const chatSession = useChatSession({ subjectId, chapterId });
  const { messages, draft, setDraft, loading: chatLoading, error: chatError, listRef, handleSend } =
    chatSession;

  if (loading) {
    return (
      <div className="theory-page theory-page--center">
        <Spinner size={32} />
        <p>Đang tải bài học...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="theory-page theory-page--center">
        <EmptyState
          icon={<Lock size={28} />}
          title="Bạn chưa đăng ký môn này"
          description="Bạn cần đăng ký môn học để xem bài học này."
          action={
            <Button variant="primary" onClick={() => navigate(`/app/subjects/${subjectId}`)}>
              Đăng ký môn học
            </Button>
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="theory-page">
        <ErrorState
          title="Không tải được bài học"
          description={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const theoryIdValue = theory?.theoryId || theory?.theory_id;
  const activeIndexInChapter = chapterTheories.findIndex(
    (item) => (item.theoryId || item.theory_id) === theoryIdValue
  );
  const displayTitle = getTheoryDisplayTitle(
    theory,
    activeIndexInChapter >= 0 ? activeIndexInChapter : 0
  );
  // Block đầu của nội dung hay lặp lại đúng tên bài đã hiển thị ở h1 phía trên.
  const contentForDisplay = stripLeadingTitleBlock(
    theory?.content,
    theory?.contentFormat,
    displayTitle
  );

  const prevTheory =
    activeIndexInChapter > 0 ? chapterTheories[activeIndexInChapter - 1] : null;
  const nextTheory =
    activeIndexInChapter >= 0 && activeIndexInChapter < chapterTheories.length - 1
      ? chapterTheories[activeIndexInChapter + 1]
      : null;
  const prevTheoryId = prevTheory ? prevTheory.theoryId || prevTheory.theory_id : null;
  const nextTheoryId = nextTheory ? nextTheory.theoryId || nextTheory.theory_id : null;

  return (
    <div className="theory-page">
      <aside className="theory-page__nav">
        <Card padding="md" className="theory-nav-card">
          <button
            type="button"
            className="theory-nav-card__back-btn"
            onClick={handleGoBack}
          >
            <ArrowLeft size={15} />
            <span>Quay lại môn học</span>
          </button>
          <div className="theory-nav-card__divider" />
          <p className="theory-nav-card__title">Nội dung</p>
          <div className="theory-nav-card__list">
            {chapterTheories.map((item, index) => {
              const itemId = item.theoryId || item.theory_id;
              const active = itemId === theoryIdValue;
              return (
                <button
                  key={itemId}
                  type="button"
                  className={`theory-nav-card__item ${active ? "active" : ""}`}
                  onClick={() => navigate(`/app/subjects/${subjectId}/theories/${itemId}`)}
                >
                  <span className="theory-nav-card__index">{index + 1}</span>
                  <span className="theory-nav-card__label">
                    {getTheoryDisplayTitle(item, index)}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      </aside>

      <div className="theory-page__content">
        <div className="theory-page__back-bar" role="navigation" aria-label="Điều hướng bài học">
          <button
            type="button"
            className="theory-page__back"
            onClick={handleGoBack}
            title={chapterIndex >= 0 && chapter?.name ? `Quay lại ${chapter.name}` : "Quay lại môn học"}
          >
            <ArrowLeft size={16} />
            <span className="theory-page__back-text">
              {chapterIndex >= 0 && chapter?.name
                ? `Chương ${chapterIndex + 1} · ${chapter.name}`
                : "Quay lại môn học"}
            </span>
          </button>

          {chapterTheories.length > 1 && (
            <div className="theory-page__back-bar-nav">
              <span className="theory-page__back-bar-counter">
                Bài {activeIndexInChapter + 1}/{chapterTheories.length}
              </span>
              <div className="theory-page__back-bar-arrows">
                <button
                  type="button"
                  className="theory-page__bar-arrow"
                  disabled={!prevTheory}
                  onClick={() =>
                    prevTheoryId && navigate(`/app/subjects/${subjectId}/theories/${prevTheoryId}`)
                  }
                  title={
                    prevTheory
                      ? `Bài trước: ${getTheoryDisplayTitle(prevTheory, activeIndexInChapter - 1)}`
                      : "Đã là bài đầu tiên"
                  }
                  aria-label="Bài trước"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="theory-page__bar-arrow"
                  disabled={!nextTheory}
                  onClick={() =>
                    nextTheoryId && navigate(`/app/subjects/${subjectId}/theories/${nextTheoryId}`)
                  }
                  title={
                    nextTheory
                      ? `Bài tiếp theo: ${getTheoryDisplayTitle(nextTheory, activeIndexInChapter + 1)}`
                      : "Đã là bài cuối cùng"
                  }
                  aria-label="Bài tiếp theo"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <Card padding="lg" className="theory-content-card">
          <div className="theory-content-card__head">
            <h1>{displayTitle}</h1>
          </div>
          <TheoryContent content={contentForDisplay} contentFormat={theory?.contentFormat} />

          <footer className="theory-content-card__footer">
            <div className="theory-footer-nav">
              {prevTheory ? (
                <button
                  type="button"
                  className="theory-footer-nav-btn theory-footer-nav-btn--prev"
                  onClick={() =>
                    navigate(`/app/subjects/${subjectId}/theories/${prevTheoryId}`)
                  }
                >
                  <ChevronLeft size={18} className="theory-footer-nav-btn__icon" />
                  <div className="theory-footer-nav-btn__info">
                    <small>Bài trước</small>
                    <span>{getTheoryDisplayTitle(prevTheory, activeIndexInChapter - 1)}</span>
                  </div>
                </button>
              ) : (
                <div className="theory-footer-nav-placeholder" />
              )}

              {nextTheory ? (
                <button
                  type="button"
                  className="theory-footer-nav-btn theory-footer-nav-btn--next"
                  onClick={() =>
                    navigate(`/app/subjects/${subjectId}/theories/${nextTheoryId}`)
                  }
                >
                  <div className="theory-footer-nav-btn__info">
                    <small>Bài tiếp theo</small>
                    <span>{getTheoryDisplayTitle(nextTheory, activeIndexInChapter + 1)}</span>
                  </div>
                  <ChevronRight size={18} className="theory-footer-nav-btn__icon" />
                </button>
              ) : (
                <div className="theory-footer-nav-placeholder" />
              )}
            </div>

            <div className="theory-footer-back-row">
              <Button
                variant="secondary"
                onClick={handleGoBack}
                leftIcon={<ArrowLeft size={16} />}
              >
                {chapterIndex >= 0 && chapter?.name
                  ? `Quay lại Chương ${chapterIndex + 1} · ${chapter.name}`
                  : "Quay lại môn học"}
              </Button>
            </div>
          </footer>
        </Card>
      </div>

      <aside className="theory-page__chat-dock">
        <div className="theory-chat">
          <header className="theory-chat__header">
            <span className="theory-chat__avatar">AI</span>
            <div className="theory-chat__title">
              <strong>Trợ giảng QuizCIT</strong>
              <small>Giải đáp theo bài học hiện tại</small>
            </div>
          </header>

          <ChatMessages
            messages={messages}
            loading={chatLoading}
            error={chatError}
            listRef={listRef}
            emptyTitle="Có câu hỏi về bài học?"
            emptyDescription="Nhập câu hỏi để được giải thích dựa trên nội dung bài đang học."
          />

          <ChatComposer
            draft={draft}
            setDraft={setDraft}
            loading={chatLoading}
            onSend={handleSend}
            inputRef={chatInputRef}
            placeholder="Nhập câu hỏi về bài học..."
            hint="Enter để gửi · Shift + Enter để xuống dòng"
          />
        </div>
      </aside>

      <div className="theory-page__chat-mobile-fab">
        <ChatBox subjectId={subjectId} chapterId={chapterId} session={chatSession} />
      </div>
    </div>
  );
}
