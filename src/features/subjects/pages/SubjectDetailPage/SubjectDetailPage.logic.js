import { formatScaledThetaValue } from "../../../../services/mappers.js";

// BE so sánh Theta raw; 0 = ngưỡng mặc định (scale hiển thị 2.00). Chỉ ẩn khi không phải số.
export const formatRequiredTheta = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return formatScaledThetaValue(n);
};

export const formatCurrentTheta = (value) => {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return formatScaledThetaValue(n);
};

export const buildAbilityMap = (abilities = []) => {
  const map = new Map();
  if (!Array.isArray(abilities)) return map;
  for (const item of abilities) {
    if (!item) continue;
    const theta = Number(item.theta);
    if (!Number.isFinite(theta)) continue;
    if (item.skillId) {
      map.set(String(item.skillId), theta);
    }
    if (item.id) {
      map.set(String(item.id), theta);
    }
    const name = item.name || item.skillName;
    if (name && typeof name === "string") {
      map.set(name.trim().toLowerCase(), theta);
    }
  }
  return map;
};

export const resolveSkillCurrentTheta = (skill, abilityMap) => {
  if (skill?.currentTheta !== null && skill?.currentTheta !== undefined) {
    const num = Number(skill.currentTheta);
    return Number.isFinite(num) ? num : null;
  }
  if (!abilityMap) return null;
  const skillId = skill?.skillId || skill?.skill_id || skill?.id;
  if (skillId && abilityMap.has(String(skillId))) {
    return abilityMap.get(String(skillId));
  }
  const skillName = (skill?.name || skill?.skillName || "").trim().toLowerCase();
  if (skillName && abilityMap.has(skillName)) {
    return abilityMap.get(skillName);
  }
  return null;
};

export const isSkillRequirementMet = (currentTheta, requiredTheta) => {
  if (currentTheta === null || currentTheta === undefined) return false;
  const curr = Number(currentTheta);
  const req = Number(requiredTheta);
  if (!Number.isFinite(curr) || !Number.isFinite(req)) return false;
  return curr >= req;
};
