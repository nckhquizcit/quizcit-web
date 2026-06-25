import { request } from "./apiClient";
import { mapSkill } from "./mappers";

export async function getSkills() {
  const skills = await request({ method: "GET", url: "/api/skills" });
  return (skills || []).map(mapSkill);
}

export async function getSkillById(skillId) {
  return mapSkill(await request({ method: "GET", url: `/api/skills/${skillId}` }));
}

export async function createSkill(payload) {
  return mapSkill(await request({ method: "POST", url: "/api/skills", data: payload }));
}

export async function updateSkill(skillId, payload) {
  return mapSkill(await request({ method: "PUT", url: `/api/skills/${skillId}`, data: payload }));
}

export async function deleteSkill(skillId) {
  return request({ method: "DELETE", url: `/api/skills/${skillId}` });
}
