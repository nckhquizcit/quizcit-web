export function selectImportValue({
  mode,
  importedValue = "",
  defaultValue = "",
  manualValue,
}) {
  if (mode === "single-chapter") return defaultValue;
  if (manualValue !== undefined) return manualValue;
  return importedValue || defaultValue;
}

export const isImportReferenceDataReady = ({
  loadingChapters = false,
} = {}) => !loadingChapters;
