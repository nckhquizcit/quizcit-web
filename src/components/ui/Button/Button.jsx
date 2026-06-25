import { Link } from "react-router-dom";
import Spinner from "../Spinner/Spinner";
import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  to = null,
  type = "button",
  className = "",
  ...rest
}) {
  const classes = [
    "ui-btn",
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    fullWidth ? "ui-btn--block" : "",
    loading ? "ui-btn--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading && <Spinner size={16} className="ui-btn__spinner" />}
      {!loading && iconLeft}
      {children && <span className="ui-btn__label">{children}</span>}
      {!loading && iconRight}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {content}
    </button>
  );
}
