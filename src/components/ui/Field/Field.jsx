import "./Field.css";

export default function Field({
  label,
  htmlFor,
  error = "",
  hint = "",
  required = false,
  children,
  className = "",
}) {
  return (
    <div className={`ui-field ${className}`}>
      {label && (
        <label className="ui-field__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="ui-field__req">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="ui-field__error">{error}</p>
      ) : hint ? (
        <p className="ui-field__hint">{hint}</p>
      ) : null}
    </div>
  );
}
