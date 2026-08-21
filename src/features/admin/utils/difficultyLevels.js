export const DIFFICULTY_PRESETS = [
  { key: "VERY_EASY", label: "Rất dễ", value: -3 },
  { key: "EASY", label: "Dễ", value: -1.8 },
  { key: "MEDIUM", label: "Trung bình", value: -0.6 },
  { key: "FAIRLY_HARD", label: "Khá khó", value: 0.6 },
  { key: "HARD", label: "Khó", value: 1.8 },
  { key: "VERY_HARD", label: "Rất khó", value: 3 },
];

export const CUSTOM_DIFFICULTY_KEY = "CUSTOM";
export const DEFAULT_DIFFICULTY_KEY = "MEDIUM";
export const DEFAULT_DIFFICULTY_B = -0.6;

const PRESET_TOLERANCE = 0.05;

const stripDiacritics = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

export const compactDifficultyKey = (value = "") =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9.+-]/g, "");

const LABEL_TO_PRESET_KEY = {
  veryeasy: "VERY_EASY",
  ratde: "VERY_EASY",
  "-3": "VERY_EASY",
  "-3.0": "VERY_EASY",
  easy: "EASY",
  de: "EASY",
  "-1.8": "EASY",
  medium: "MEDIUM",
  trungbinh: "MEDIUM",
  "-0.6": "MEDIUM",
  fairlyhard: "FAIRLY_HARD",
  khakho: "FAIRLY_HARD",
  "0.6": "FAIRLY_HARD",
  "+0.6": "FAIRLY_HARD",
  hard: "HARD",
  kho: "HARD",
  "1.8": "HARD",
  "+1.8": "HARD",
  veryhard: "VERY_HARD",
  ratkho: "VERY_HARD",
  "3": "VERY_HARD",
  "3.0": "VERY_HARD",
  "+3": "VERY_HARD",
  "+3.0": "VERY_HARD",
  // Legacy 3-level labels / values
  "-1": "EASY",
  "0": "MEDIUM",
  "1": "HARD",
};

const isNumericDifficulty = (value) => {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return false;
  return /^-?\d+(\.\d+)?$/.test(text) && Number.isFinite(Number(text));
};

export function getDifficultyPreset(key) {
  return DIFFICULTY_PRESETS.find((preset) => preset.key === key) || null;
}

export function matchDifficultyPresetKey(difficultyB) {
  if (difficultyB === null || difficultyB === undefined || difficultyB === "") return "";
  const value = Number(difficultyB);
  if (!Number.isFinite(value)) return "";

  const matched = DIFFICULTY_PRESETS.find(
    (preset) => Math.abs(preset.value - value) <= PRESET_TOLERANCE,
  );
  return matched?.key ?? CUSTOM_DIFFICULTY_KEY;
}

export function resolveDifficultyB(difficultyKey, customValue = DEFAULT_DIFFICULTY_B) {
  if (difficultyKey === CUSTOM_DIFFICULTY_KEY) {
    const custom = Number(String(customValue).replace(",", "."));
    return Number.isFinite(custom) ? custom : customValue;
  }

  const preset = getDifficultyPreset(difficultyKey);
  if (preset) return preset.value;

  if (customValue !== undefined) {
    return Number.isFinite(Number(customValue)) ? Number(customValue) : customValue;
  }

  return DEFAULT_DIFFICULTY_B;
}

export function getDifficultyLabelVi(difficultyB) {
  if (difficultyB === null || difficultyB === undefined || difficultyB === "" || !Number.isFinite(Number(difficultyB))) {
    return "Chưa có độ khó";
  }

  const key = matchDifficultyPresetKey(difficultyB);
  if (key && key !== CUSTOM_DIFFICULTY_KEY) {
    return getDifficultyPreset(key)?.label ?? "Trung bình";
  }

  const value = Number(difficultyB);
  if (!Number.isFinite(value)) return "Chưa có độ khó";
  return `Tùy chỉnh (${value.toFixed(1)})`;
}

export function getDifficultyTone(difficultyB) {
  if (difficultyB === null || difficultyB === undefined || difficultyB === "" || !Number.isFinite(Number(difficultyB))) {
    return "empty";
  }

  const value = Number(difficultyB);
  if (value <= -1.8) return "very-easy";
  if (value <= -0.6) return "easy";
  if (value < 0.6) return "medium";
  if (value < 1.8) return "fairly-hard";
  if (value < 3) return "hard";
  return "very-hard";
}

export function parseDifficultyArray(input = "") {
  if (Array.isArray(input)) {
    const values = input
      .map((item) => (typeof item === "number" ? item : Number(String(item).trim().replace(",", "."))))
      .filter(Number.isFinite);
    return {
      values,
      invalidTokens: [],
      isValid: values.length > 0,
    };
  }

  const raw = String(input ?? "").trim();
  if (!raw) {
    return { values: [], invalidTokens: [], isValid: false };
  }

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const values = [];
        const invalidTokens = [];
        for (const item of parsed) {
          const text = String(item).trim().replace(",", ".");
          const num = Number(text);
          if (text !== "" && Number.isFinite(num)) {
            values.push(num);
          } else {
            invalidTokens.push(String(item));
          }
        }
        return {
          values,
          invalidTokens,
          isValid: invalidTokens.length === 0 && values.length > 0,
        };
      }
    } catch {
      // Fallback to token splitting
    }
  }

  const unwrapped = raw.replace(/^[[({]\s*/, "").replace(/\s*[\])}]$/, "");
  const tokens = unwrapped
    .split(/[\s,;\n\r\t]+/)
    .map((token) => token.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  const values = [];
  const invalidTokens = [];

  for (const token of tokens) {
    const normalized = token.replace(",", ".");
    const num = Number(normalized);
    if (
      token &&
      Number.isFinite(num) &&
      /^[+-]?\d*(\.\d+)?$/.test(normalized) &&
      normalized !== "." &&
      normalized !== "+" &&
      normalized !== "-"
    ) {
      values.push(num);
    } else if (token) {
      invalidTokens.push(token);
    }
  }

  return {
    values,
    invalidTokens,
    isValid: invalidTokens.length === 0 && values.length > 0,
  };
}

export function parseImportDifficultyB(value, fallback = DEFAULT_DIFFICULTY_B) {
  const text = String(value ?? "").trim();
  if (!text) return fallback;

  if (isNumericDifficulty(text)) {
    return Number(text.replace(",", "."));
  }

  const presetKey = LABEL_TO_PRESET_KEY[compactDifficultyKey(text)];
  if (presetKey) {
    return getDifficultyPreset(presetKey)?.value ?? fallback;
  }

  return fallback;
}

/** @deprecated Prefer parseImportDifficultyB; kept for callers that still expect preset keys. */
export function normalizeImportDifficultyKey(value, fallback = DEFAULT_DIFFICULTY_KEY) {
  const text = String(value ?? "").trim();
  if (!text) return fallback;

  if (isNumericDifficulty(text)) {
    return matchDifficultyPresetKey(Number(text.replace(",", ".")));
  }

  return LABEL_TO_PRESET_KEY[compactDifficultyKey(text)] || fallback;
}
