import { createElement } from "react";
import "./Card.css";

export default function Card({
  children,
  as = "div",
  padding = "md",
  interactive = false,
  className = "",
  ...rest
}) {
  const classes = [
    "ui-card",
    `ui-card--pad-${padding}`,
    interactive ? "ui-card--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return createElement(as, { className: classes, ...rest }, children);
}
