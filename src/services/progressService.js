import { request } from "./apiClient";
import { mapAbilityHistory, mapUserSkillAbility } from "./mappers";
import { enrichSkillNames, getSkills } from "./skillService";

async function enrichProgressRows(rows) {
  const skills = await getSkills().catch(() => []);
  return enrichSkillNames(rows, skills);
}

export async function getUserSkillAbilities(userId) {
  const abilities = await request({ method: "GET", url: `/api/users/${userId}/skills` });
  return enrichProgressRows((abilities || []).map(mapUserSkillAbility));
}

export async function getUserSkillAbility(userId, skillId) {
  return (await enrichProgressRows([mapUserSkillAbility(
    await request({ method: "GET", url: `/api/users/${userId}/skills/${skillId}` }),
  )]))[0];
}

export async function getAbilityHistories(userId) {
  const histories = await request({ method: "GET", url: `/api/users/${userId}/abilities/history` });
  return enrichProgressRows((histories || []).map(mapAbilityHistory));
}

export async function getAbilityHistoriesBySkill(userId, skillId) {
  const histories = await request({
    method: "GET",
    url: `/api/users/${userId}/skills/${skillId}/history`,
  });
  return enrichProgressRows((histories || []).map(mapAbilityHistory));
}

export async function getAverageAbility(userId) {
  const result = await request({ method: "GET", url: `/api/users/${userId}/abilities/average` });
  // null/"" nghia la chua co du lieu, khong duoc ep thanh 0.
  if (result == null || result === "") return null;
  const value = Number(result);
  return Number.isFinite(value) ? value : null;
}

export async function getUserProgressOverview(userId) {
  return request({ method: "GET", url: `/api/v1/progress/users/${userId}/overview` });
}

export async function getUserSkillsSummary(userId) {
  return request({ method: "GET", url: `/api/v1/progress/users/${userId}/skills-summary` });
}

export async function getUserSkillDetailOverview(userId, skillId) {
  return request({
    method: "GET",
    url: `/api/v1/progress/users/${userId}/skills/${skillId}/detail-overview`,
  });
}
