import { request } from "../../../services/apiClient";

export async function getSkills() {
  return request({ method: "GET", url: "/api/skills" });
}

export async function createSkill(payload) {
  return request({ method: "POST", url: "/api/skills", data: payload });
}

export async function updateSkill(skillId, payload) {
  return request({ method: "PUT", url: `/api/skills/${skillId}`, data: payload });
}

export async function deleteSkill(skillId) {
  return request({ method: "DELETE", url: `/api/skills/${skillId}` });
}