import { request } from "./apiClient";
import { mapSkill } from "./mappers";

export const MISSING_SKILL_NAME = "Kỹ năng chưa đặt tên";
let skillCatalogPromise = null;

const normalizeSkillId = (value) => String(value ?? "").trim();

export function isMissingSkillName(value) {
  return !value || !String(value).trim() || String(value).trim() === MISSING_SKILL_NAME;
}

export function enrichSkillNames(rows = [], skills = []) {
  const namesById = new Map(
    skills
      .map((skill) => [normalizeSkillId(skill.skillId), skill.name])
      .filter(([skillId, name]) => skillId && !isMissingSkillName(name)),
  );

  return (rows || []).map((row) => {
    const skillId = normalizeSkillId(row?.skillId ?? row?.skill_id ?? row?.id);
    const resolvedName = namesById.get(skillId);
    const currentName = row?.name ?? row?.skillName ?? row?.skill_name;
    const name = isMissingSkillName(currentName)
      ? resolvedName || MISSING_SKILL_NAME
      : String(currentName).trim();

    return { ...row, skillId, skill_id: skillId, name, skillName: name };
  });
}

export async function getSkills() {
  if (!skillCatalogPromise) {
    skillCatalogPromise = request({ method: "GET", url: "/api/skills" })
      .then((skills) => (skills || []).map(mapSkill))
      .catch((error) => {
        skillCatalogPromise = null;
        throw error;
      });
  }
  return skillCatalogPromise;
}

export async function getSkillById(skillId) {
  return mapSkill(await request({ method: "GET", url: `/api/skills/${skillId}` }));
}

export async function createSkill(payload) {
  const result = mapSkill(await request({ method: "POST", url: "/api/skills", data: payload }));
  skillCatalogPromise = null;
  return result;
}

export async function updateSkill(skillId, payload) {
  const result = mapSkill(await request({ method: "PUT", url: `/api/skills/${skillId}`, data: payload }));
  skillCatalogPromise = null;
  return result;
}

export async function deleteSkill(skillId) {
  const result = await request({ method: "DELETE", url: `/api/skills/${skillId}` });
  skillCatalogPromise = null;
  return result;
}
