import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import "./RowActions.css";

const MENU_ESTIMATED_HEIGHT = 200;

/**
 * items: [{ label, icon, onClick, danger, disabled, title }]
 * labelled: show icon + visible text label instead of icon-only buttons
 * variant: "menu" renders a single "···" trigger that opens a dropdown of items
 * triggerLabel: nhan mo ta rieng cho nut mo menu; truyen kem ten dong de trinh doc
 * man hinh phan biet duoc nut nao thuoc dong nao.
 */
export default function RowActions({
  items = [],
  labelled = false,
  variant = "default",
  triggerLabel = "Mở menu hành động",
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const rootRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (variant !== "menu" || !open) return;

    const handleOutsideClick = (event) => {
      if (rootRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    const closeMenu = () => setOpen(false);

    document.addEventListener("mousedown", handleOutsideClick);
    // Menu dùng position: fixed nên phải đóng khi cuộn/resize để không trôi vị trí.
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [variant, open]);

  const toggleMenu = () => {
    setOpen((current) => {
      if (!current && rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();
        const right = window.innerWidth - rect.right;
        const openUpward = window.innerHeight - rect.bottom < MENU_ESTIMATED_HEIGHT;
        setMenuPos(
          openUpward
            ? { bottom: window.innerHeight - rect.top + 4, right }
            : { top: rect.bottom + 4, right },
        );
      }
      return !current;
    });
  };

  if (variant === "menu") {
    return (
      <div className="row-actions row-actions--menu" ref={rootRef}>
        <button
          type="button"
          className="row-actions__trigger"
          onClick={toggleMenu}
          aria-label={triggerLabel}
          aria-expanded={open}
        >
          <MoreHorizontal size={18} />
        </button>
        {open &&
          menuPos &&
          createPortal(
            // Portal + fixed để menu không bị vùng cuộn của bảng (overflow) cắt mất.
            <div className="row-actions__menu" role="menu" ref={menuRef} style={menuPos}>
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
            </div>,
            document.body,
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
