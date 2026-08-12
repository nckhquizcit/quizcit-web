import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import "./RowActions.css";

/**
 * items: [{ label, icon, onClick, danger, disabled, title }]
 * labelled: show icon + visible text label instead of icon-only buttons
 * variant: "menu" renders a single "···" trigger that opens a dropdown of items
 */
export default function RowActions({ items = [], labelled = false, variant = "default" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (variant !== "menu" || !open) return;

    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [variant, open]);

  if (variant === "menu") {
    return (
      <div className="row-actions row-actions--menu" ref={rootRef}>
        <button
          type="button"
          className="row-actions__trigger"
          onClick={() => setOpen((current) => !current)}
          aria-label="Mở menu hành động"
          aria-expanded={open}
        >
          <MoreHorizontal size={18} />
        </button>
        {open && (
          <div className="row-actions__menu" role="menu">
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                role="menuitem"
                className={`row-actions__menu-item ${item.danger ? "is-danger" : ""}`}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                disabled={item.disabled}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`row-actions ${labelled ? "row-actions--labelled" : ""}`}>
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          className={`row-actions__btn ${labelled ? "row-actions__btn--labelled" : ""} ${item.danger ? "is-danger" : ""}`}
          onClick={() => item.onClick?.()}
          title={item.title || item.label}
          aria-label={item.label}
          disabled={item.disabled}
        >
          {item.icon}
          {labelled && <span>{item.label}</span>}
        </button>
      ))}
    </div>
  );
}
