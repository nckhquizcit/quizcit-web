const FALLBACK_DATE = "—";

export const submittedAtFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

export const shortDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
});

/** Backend trả `LocalDateTime` (không kèm múi giờ) nên giá trị có thể không parse được. */
export const formatSubmittedAt = (value) => {
  if (!value) return FALLBACK_DATE;

  const submittedDate = new Date(value);
  return Number.isNaN(submittedDate.getTime())
    ? FALLBACK_DATE
    : submittedAtFormatter.format(submittedDate);
};

export const formatShortDate = (value) => {
  if (!value) return FALLBACK_DATE;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? FALLBACK_DATE : shortDateFormatter.format(date);
};
