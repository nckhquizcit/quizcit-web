import { request } from "./apiClient";
import { mapAbilityHistory, mapUserSkillAbility } from "./mappers";

export async function getUserSkillAbilities(userId) {
  const abilities = await request({ method: "GET", url: `/api/users/${userId}/skills` });
  return (abilities || []).map(mapUserSkillAbility);
}

export async function getUserSkillAbility(userId, skillId) {
  return mapUserSkillAbility(
    await request({ method: "GET", url: `/api/users/${userId}/skills/${skillId}` }),
  );
}

export async function getAbilityHistories(userId) {
  const histories = await request({ method: "GET", url: `/api/users/${userId}/abilities/history` });
  return (histories || []).map(mapAbilityHistory);
}

export async function getAbilityHistoriesBySkill(userId, skillId) {
  const histories = await request({
    method: "GET",
    url: `/api/users/${userId}/skills/${skillId}/history`,
  });
  return (histories || []).map(mapAbilityHistory);
}

export async function getAverageAbility(userId) {
  const result = await request({ method: "GET", url: `/api/users/${userId}/abilities/average` });
  return Number.isFinite(Number(result)) ? Number(result) : 0;
}
