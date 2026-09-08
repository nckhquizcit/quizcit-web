import { compactImportKey, SKILL_WEIGHT_SUM_TOLERANCE, splitRespectingGroups } from "./questionImportParser.js";

const normalizeId = (value) => (value === undefined || value === null ? "" : String(value).trim());

const YES_VALUES = new Set(["1", "true", "yes", "y", "x", "main", "primary", "chinh", "true"]);

/**
 * Finds a matching skill in available skills list by ID or name.
 */
export function matchSkill(ref = "", availableSkills = []) {
  const normalizedRef = normalizeId(ref).trim();
  const lowerRef = normalizedRef.toLowerCase();
  const compactRef = compactImportKey(normalizedRef);
  if (!normalizedRef) return null;

  return (
    availableSkills.find((s) => {
      const name = (s?.name ?? s?.skillName ?? "").trim().toLowerCase();
      return name === lowerRef || compactImportKey(name) === compactRef;
    }) ||
    availableSkills.find(
      (s) => normalizeId(s?.skillId ?? s?.id) === normalizedRef,
    ) ||
    null
  );
}

/**
 * Normalizes a list of skill objects for a single question, ensuring weights sum to 1
 * and exactly one primary skill exists.
 */
export function normalizeSingleQuestionSkills(skills = [], availableSkills = []) {
  if (!Array.isArray(skills) || !skills.length) return [];

  const rawSkills = skills.map((item, index) => {
    const rawRef = typeof item === "string" ? item : item?.skillName || item?.name || item?.skill || item?.skillId || "";
    const matched = matchSkill(rawRef, availableSkills);
    const skillId = matched?.skillId || matched?.id || normalizeId(item?.skillId || rawRef);
    const name = matched?.name || matched?.skillName || item?.name || item?.skillName || item?.skill || rawRef || "Kỹ năng chưa đặt tên";

    const rawWeight = item?.weight !== undefined && item?.weight !== null ? Number(item.weight) : null;
    const isPrimary = Boolean(
      item?.primary ||
      item?.isPrimary ||
      item?.is_primary ||
      YES_VALUES.has(String(item?.primary || item?.isPrimary || "").toLowerCase())
    );

    return {
      skillId,
      name,
      rawWeight,
      primary: isPrimary,
      originalIndex: index,
    };
  });

  const count = rawSkills.length;
  if (!count) return [];

  const hasAnyWeight = rawSkills.some((s) => s.rawWeight !== null && Number.isFinite(s.rawWeight));
  const defaultWeight = 1 / count;

  let hasPrimary = rawSkills.some((s) => s.primary);

  return rawSkills.map((s, index) => {
    const weight = hasAnyWeight
      ? (s.rawWeight !== null && Number.isFinite(s.rawWeight) ? s.rawWeight : defaultWeight)
      : defaultWeight;
    const formattedWeight = String(Number(weight.toFixed(6)));
    const primary = hasPrimary ? s.primary : index === 0;

    return {
      skillId: s.skillId,
      name: s.name,
      weight: formattedWeight,
      primary,
    };
  });
}

/**
 * Parses skill mapping input (JSON array or line-based text) for all questions.
 * Returns array of skill arrays, where index i corresponds to question i.
 */
const PRIMARY_KEYWORDS = new Set(["primary", "main", "chinh", "chính", "true", "yes", "y", "x"]);

/**
 * Splits a string by delimiters (default: [",", ";"]), respecting:
 * 1. Double quotes ("...") and single quotes ('...')
 * 2. Parentheses (...), brackets [...], and braces {...}
 */
export function parseSingleSkillEntry(rawPart = "") {
  const trimmed = String(rawPart || "").trim();
  if (!trimmed) return null;

  // Split by colons ':' OUTSIDE quotes and parentheses/brackets
  const colonParts = splitRespectingGroups(trimmed, [":"]);
  if (!colonParts.length) return null;

  const tokens = colonParts.map((p) => p.trim()).filter(Boolean);
  if (!tokens.length) return null;

  let weight = null;
  let primaryFlag = false;

  // Inspect trailing tokens from right to left
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1];
    const lowerLast = last.toLowerCase();

    // Check if rightmost token is primary flag
    if (!primaryFlag && PRIMARY_KEYWORDS.has(lowerLast)) {
      primaryFlag = true;
      tokens.pop();
      continue;
    }

    // Check if rightmost token is numeric weight
    const num = Number(last.replace(",", "."));
    if (weight === null && !Number.isNaN(num) && Number.isFinite(num) && num >= 0) {
      weight = num;
      tokens.pop();
      continue;
    }

    break;
  }

  let skillName = tokens.join(": ").trim();
  if (
    (skillName.startsWith('"') && skillName.endsWith('"') && skillName.length >= 2) ||
    (skillName.startsWith("'") && skillName.endsWith("'") && skillName.length >= 2)
  ) {
    skillName = skillName.slice(1, -1).trim();
  }

  if (!skillName) return null;

  return {
    name: skillName,
    skillId: skillName,
    weight,
    primary: primaryFlag,
  };
}

/**
 * Parses skill mapping input (JSON array or line-based text) for all questions.
 * Returns array of skill arrays, where index i corresponds to question i.
 */
export function parseSkillArray(input = "", availableSkills = []) {
  const raw = String(input || "").trim();
  if (!raw) {
    return {
      isValid: true,
      mappings: [],
      invalidTokens: [],
      errorMessage: "",
    };
  }

  // 1. Try parsing JSON
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const mappings = parsed.map((item) => {
          if (Array.isArray(item)) {
            return normalizeSingleQuestionSkills(item, availableSkills);
          }
          if (item && typeof item === "object") {
            return normalizeSingleQuestionSkills([item], availableSkills);
          }
          if (typeof item === "string") {
            return normalizeSingleQuestionSkills([{ name: item, weight: 1, primary: true }], availableSkills);
          }
          return [];
        });

        return {
          isValid: true,
          mappings,
          invalidTokens: [],
          errorMessage: "",
        };
      }
    } catch {
      // Fall through to text lines parsing
    }
  }

  // 2. Parse line-based text
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const mappings = [];
  const invalidTokens = [];

  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("//")) {
      continue;
    }

    // Step A: Check if the entire line (excluding trailing weight/primary) directly matches an available skill
    const singleCandidate = parseSingleSkillEntry(line);
    if (singleCandidate && matchSkill(singleCandidate.name, availableSkills)) {
      mappings.push(normalizeSingleQuestionSkills([singleCandidate], availableSkills));
      continue;
    }

    // Step B: Split line into parts by ',' or ';', respecting quotes and parentheses/brackets/braces
    const skillParts = splitRespectingGroups(line, [",", ";"]);
    const parsedSkills = [];

    for (const part of skillParts) {
      const entry = parseSingleSkillEntry(part);
      if (!entry || !entry.name) {
        invalidTokens.push(part);
        continue;
      }
      parsedSkills.push(entry);
    }

    if (!parsedSkills.length && skillParts.length > 0) {
      invalidTokens.push(line);
    }

    mappings.push(normalizeSingleQuestionSkills(parsedSkills, availableSkills));
  }

  return {
    isValid: invalidTokens.length === 0,
    mappings,
    invalidTokens,
    errorMessage: invalidTokens.length ? `Không phân tích được một số kỹ năng: ${invalidTokens.join(", ")}` : "",
  };
}
export { splitRespectingGroups };
