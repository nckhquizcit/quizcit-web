/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useState } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import "./Toast.css";

const ToastContext = createContext(null);

let idSeq = 0;

const ICONS = {
  success: <CheckCircle size={18} />,
  error: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { type = "info", duration = 3500 } = {}) => {
      const id = ++idSeq;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove]
  );

  const api = {
    show,
    success: (m, o) => show(m, { ...o, type: "success" }),
    error: (m, o) => show(m, { ...o, type: "error" }),
    info: (m, o) => show(m, { ...o, type: "info" }),
    remove,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toast-region" role="region" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ui-toast ui-toast--${t.type}`}>
            <span className="ui-toast__icon">{ICONS[t.type]}</span>
            <span className="ui-toast__msg">{t.message}</span>
            <button
              type="button"
              className="ui-toast__close"
              onClick={() => remove(t.id)}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      remove: () => {},
    };
  }
  return ctx;
}
