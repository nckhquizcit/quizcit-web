const QUIZ_DRAFT_PREFIX = "quizcit:quiz-draft:";
const ADAPTIVE_DRAFT_PREFIX = "quizcit:adaptive-draft:";

export function getQuizDraftKey(quizId, userId) {
  return `${QUIZ_DRAFT_PREFIX}${userId || "anonymous"}:${quizId}`;
}

export function loadQuizDraft(quizId, userId) {
  const key = getQuizDraftKey(quizId, userId);
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveQuizDraft(quizId, userId, draft) {
  const key = getQuizDraftKey(quizId, userId);
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Best-effort only; fallback to sessionStorage if quota/security error
    try {
      sessionStorage.setItem(key, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }
}

export function clearQuizDraft(quizId, userId) {
  const key = getQuizDraftKey(quizId, userId);
  try {
    localStorage.removeItem(key);
  } catch {
    // Best-effort
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Best-effort
  }
}

export function getAdaptiveDraftKey(attemptId, userId) {
  return `${ADAPTIVE_DRAFT_PREFIX}${userId || "anonymous"}:${attemptId}`;
}

export function loadAdaptiveDraft(attemptId, userId) {
  const key = getAdaptiveDraftKey(attemptId, userId);
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAdaptiveDraft(attemptId, userId, draft) {
  const key = getAdaptiveDraftKey(attemptId, userId);
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    try {
      sessionStorage.setItem(key, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }
}

export function clearAdaptiveDraft(attemptId, userId) {
  const key = getAdaptiveDraftKey(attemptId, userId);
  try {
    localStorage.removeItem(key);
  } catch {
    // Best-effort
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Best-effort
  }
}

export function getExpiredQuizDrafts(userId, now = Date.now()) {
  if (!userId) return [];
  const prefix = `${QUIZ_DRAFT_PREFIX}${userId}:`;
  const expired = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        try {
          const draft = JSON.parse(localStorage.getItem(key));
          const deadline = Number(draft?.deadlineAt);
          if (draft?.attemptId && Number.isFinite(deadline) && deadline > 0 && deadline <= now) {
            expired.push(draft);
          }
        } catch {
          // ignore corrupted entry
        }
      }
    }
  } catch {
    // storage may not be accessible
  }
  return expired;
}
