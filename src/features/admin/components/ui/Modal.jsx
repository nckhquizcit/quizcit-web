import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./ui.css";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export default function Modal({
  open,
  onClose,
  children,
  containerClassName = "",
  overlayClassName = "",
  title,
  labelledById,
  initialFocusRef = null,
}) {
  const containerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const generatedTitleId = useId();
  const labelId = labelledById || (title ? generatedTitleId : undefined);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const initialTarget =
      initialFocusRef?.current ??
      containerRef.current?.querySelector(FOCUSABLE_SELECTOR) ??
      containerRef.current;
    initialTarget?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = containerRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  return createPortal(
    <div
      className={`modal-overlay ${overlayClassName}`.trim()}
      onClick={() => onCloseRef.current?.()}
      role="presentation"
    >
      <div
        ref={containerRef}
        className={`modal-container ${containerClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="modal-close"
          onClick={() => onCloseRef.current?.()}
          type="button"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {title ? (
          <h2 id={generatedTitleId} className="admin-modal-title">
            {title}
          </h2>
        ) : null}

        {children}
      </div>
    </div>,
    document.body,
  );
}
