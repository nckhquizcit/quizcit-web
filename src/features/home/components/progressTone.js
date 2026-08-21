export function getProgressTone(percent) {
  if (percent < 25) return "danger";
  if (percent < 50) return "warning";
  if (percent < 75) return "info";
  return "success";
}
