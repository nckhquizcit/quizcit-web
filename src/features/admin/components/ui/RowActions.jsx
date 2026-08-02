import "./RowActions.css";

/**
 * items: [{ label, icon, onClick, danger, disabled, title }]
 */
export default function RowActions({ items = [] }) {
  return (
    <div className="row-actions">
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          className={`row-actions__btn ${item.danger ? "is-danger" : ""}`}
          onClick={() => item.onClick?.()}
          title={item.title || item.label}
          aria-label={item.label}
          disabled={item.disabled}
        >
          {item.icon}
        </button>
      ))}
    </div>
  );
}
