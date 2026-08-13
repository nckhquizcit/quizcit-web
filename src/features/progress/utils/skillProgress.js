import { Minus, TrendingDown, TrendingUp } from "lucide-react";

export const MISSING_SKILL_NAME = "Kỹ năng chưa có tên";
export const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus };
export const TREND_BADGE_VARIANT = { up: "success", down: "error", flat: "neutral" };

export const normalizeSkillId = (value) => String(value ?? "").trim();

export function buildSkillMaps(skills = []) {
  const nameById = new Map();
  const descriptionById = new Map();

  skills.forEach((skill) => {
    const skillId = normalizeSkillId(skill?.skillId);
    if (!skillId) return;
    nameById.set(skillId, skill.name);
    descriptionById.set(skillId, skill.description || "");
  });

  return { nameById, descriptionById };
}

export function getSkillDisplayName(nameById, skillId, fallbackName) {
  return (
    nameById.get(normalizeSkillId(skillId)) ||
    (fallbackName && fallbackName !== MISSING_SKILL_NAME ? fallbackName : "") ||
    MISSING_SKILL_NAME
  );
}

/** Delta hiển thị luôn theo thang 0–4 giống theta, không dùng theta thô. */
export function formatDelta(delta) {
  const value = Number(delta ?? 0);
  if (value > 0.001) return { text: `+${value.toFixed(2)}`, trend: "up" };
  if (value < -0.001) return { text: `\u2212${Math.abs(value).toFixed(2)}`, trend: "down" };
  return { text: "0.00", trend: "flat" };
}

/** LocalDateTime từ backend có thể không parse được, coi như mốc 0 để sort không vỡ. */
export function toTimestamp(value) {
  const time = new Date(value ?? 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function sortHistoriesAscending(histories = []) {
  return [...histories].sort((a, b) => toTimestamp(a?.createdAt) - toTimestamp(b?.createdAt));
}
