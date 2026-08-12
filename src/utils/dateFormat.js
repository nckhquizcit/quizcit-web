const FALLBACK_DATE = "—";

export const submittedAtFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Backend trả `LocalDateTime` (không kèm múi giờ) nên giá trị có thể không parse được. */
export const formatSubmittedAt = (value) => {
  if (!value) return FALLBACK_DATE;

  const submittedDate = new Date(value);
  return Number.isNaN(submittedDate.getTime())
    ? FALLBACK_DATE
    : submittedAtFormatter.format(submittedDate);
};
