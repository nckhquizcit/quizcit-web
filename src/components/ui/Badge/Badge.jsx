import "./Badge.css";

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  iconLeft = null,
  className = "",
  ...rest
}) {
  const classes = [
    "ui-badge",
    `ui-badge--${variant}`,
    `ui-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {iconLeft}
      {children}
    </span>
  );
}
