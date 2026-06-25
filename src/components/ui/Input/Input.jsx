import { forwardRef } from "react";
import "./Input.css";

const Input = forwardRef(function Input(
  { invalid = false, iconLeft = null, className = "", ...rest },
  ref
) {
  const classes = [
    "ui-input",
    iconLeft ? "ui-input--with-icon" : "",
    invalid ? "ui-input--invalid" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (iconLeft) {
    return (
      <span className="ui-input-wrap">
        <span className="ui-input__icon">{iconLeft}</span>
        <input ref={ref} className={classes} {...rest} />
      </span>
    );
  }

  return <input ref={ref} className={classes} {...rest} />;
});

export default Input;
