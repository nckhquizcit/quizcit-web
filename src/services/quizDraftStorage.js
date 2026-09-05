const QUIZ_DRAFT_PREFIX = "quizcit:quiz-draft:";
const ADAPTIVE_DRAFT_PREFIX = "quizcit:adaptive-draft:";

export function getQuizDraftKey(identifier, userId) {
  return `${QUIZ_DRAFT_PREFIX}${userId || "anonymous"}:${identifier}`;
}

export function loadQuizDraft(identifier, userId) {
  const key = getQuizDraftKey(identifier, userId);
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveQuizDraft(identifier, userId, draft) {
  const key = getQuizDraftKey(identifier, userId);
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

export function clearQuizDraft(identifier, userId) {
  const key = getQuizDraftKey(identifier, userId);
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

export function clearQuizDraftsByQuizId(quizId, userId) {
  if (!quizId) return;
  const prefix = `${QUIZ_DRAFT_PREFIX}${userId || "anonymous"}:`;
  const keysToRemove = [];

  const inspectStorage = (storage) => {
    if (!storage) return;
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(prefix)) {
          if (key.endsWith(`:${quizId}`)) {
            keysToRemove.push(key);
          } else {
            try {
              const raw = storage.getItem(key);
              const parsed = raw ? JSON.parse(raw) : null;
              if (parsed && String(parsed.quizId) === String(quizId)) {
                keysToRemove.push(key);
              }
            } catch {
              // ignore unparseable
            }
          }
        }
      }
    } catch {
      // ignore
    }
  };

  try {
    inspectStorage(localStorage);
  } catch {
    // ignore
  }
  try {
    inspectStorage(sessionStorage);
  } catch {
    // ignore
  }

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
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
