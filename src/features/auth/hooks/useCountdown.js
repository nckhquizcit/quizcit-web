import { useCallback, useEffect, useState } from "react";

const DEFAULT_DURATION_SECONDS = 60;

// BE tra 429 cho hai truong hop cho rat khac nhau va khong co Retry-After:
// gioi han theo cua so (AuthRateLimitService: login/register 900s, gui lai ma 600s)
// va cooldown gui lai ma cua challenge (60s). Chi phan biet duoc qua message.
export function isWindowRateLimit(error) {
  return String(error?.message || "").includes("quá nhiều yêu cầu");
}

function secondsLeft(deadline) {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}

function readDeadline(storageKey) {
  if (!storageKey) return 0;
  try {
    const stored = Number(window.sessionStorage.getItem(storageKey));
    return Number.isFinite(stored) ? stored : 0;
  } catch {
    // Storage bi chan: countdown chi song trong state.
    return 0;
  }
}

function writeDeadline(storageKey, deadline) {
  if (!storageKey) return;
  try {
    window.sessionStorage.setItem(storageKey, String(deadline));
  } catch {
    // Khong luu duoc thi bo qua, countdown van chay den khi reload.
  }
}

// storageKey rong = countdown trong bo nho; co key = deadline con song qua reload.
export default function useCountdown(storageKey = "") {
  const [deadline, setDeadline] = useState(() => readDeadline(storageKey));
  const [seconds, setSeconds] = useState(() => secondsLeft(deadline));

  useEffect(() => {
    setDeadline(readDeadline(storageKey));
  }, [storageKey]);

  useEffect(() => {
    setSeconds(secondsLeft(deadline));
    if (secondsLeft(deadline) <= 0) return undefined;
    const timer = setInterval(() => {
      const remaining = secondsLeft(deadline);
      setSeconds(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const start = useCallback(
    (durationSeconds = DEFAULT_DURATION_SECONDS) => {
      const nextDeadline = Date.now() + durationSeconds * 1000;
      writeDeadline(storageKey, nextDeadline);
      setDeadline(nextDeadline);
    },
    [storageKey],
  );

  return [seconds, start];
}
