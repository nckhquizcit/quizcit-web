import { mapAbilityHistory } from "../../../services/mappers.js";

export function normalizeProgressOverview(overview) {
  if (!overview || typeof overview !== "object") {
    return {
      abilities: [],
      histories: [],
      skills: [],
      averageAbility: null,
    };
  }

  const skills = (Array.isArray(overview.skills) ? overview.skills : []).map((s) => ({
    id: s.id || s.skillId,
    skillId: s.skillId,
    name: s.name || "Kỹ năng",
    description: s.description || "",
    theta: s.theta,
    updatedAt: s.updatedAt,
  }));

  const histories = (Array.isArray(overview.recentHistories) ? overview.recentHistories : []).map(
    mapAbilityHistory
  );

  return {
    abilities: skills,
    skills,
    histories,
    averageAbility:
      overview.averageTheta !== undefined && overview.averageTheta !== null
        ? Number(overview.averageTheta)
        : null,
  };
}

export function normalizeSkillDetailOverview(detail) {
  if (!detail || typeof detail !== "object") {
    return {
      abilities: [],
      skills: [],
      histories: [],
    };
  }

  const currentAbility = {
    id: detail.skillId,
    skillId: detail.skillId,
    name: detail.name || "Kỹ năng",
    theta: detail.currentTheta !== undefined ? detail.currentTheta : null,
    updatedAt: detail.updatedAt || null,
  };

  const otherSkills = Array.isArray(detail.otherSkills) ? detail.otherSkills : [];

  const abilities = [currentAbility, ...otherSkills];
  const skills = [
    {
      skillId: detail.skillId,
      name: detail.name || "Kỹ năng",
      description: detail.description || "",
    },
    ...otherSkills,
  ];

  const histories = (Array.isArray(detail.histories) ? detail.histories : []).map(mapAbilityHistory);

  return {
    abilities,
    skills,
    histories,
  };
}
