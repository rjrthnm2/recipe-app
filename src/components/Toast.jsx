import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

// High-visibility styling: white card, bold colored edge, icon chip.
// Designed to be unmissable for older eyes.
const TYPE_CONFIG = {
  info: {
    border: "border-l-primary",
    chip: "bg-primary",
    icon: "i",
    label: "Notice",
  },
  success: {
    border: "border-l-success",
    chip: "bg-success",
    icon: "✓",
    label: "Done",
  },
  error: {
    border: "border-l-destructive",
    chip: "bg-destructive",
    icon: "!",
    label: "Problem",
  },
};

// Errors stay up longer so there's time to read them.
const DURATION = { info: 5000, success: 5000, error: 7000 };

// Lightweight in-app notifications, replacing blocking alert() popups.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURATION[type] || DURATION.info);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-3 px-4 sm:bottom-6 sm:items-end sm:px-6 print:hidden"
      >
        {toasts.map((t) => {
          const config = TYPE_CONFIG[t.type] || TYPE_CONFIG.info;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[10px] border border-border border-l-[6px] bg-white py-3 pl-4 pr-2 shadow-xl ring-1 ring-black/5 motion-safe:animate-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-300 ${config.border}`}
            >
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[18px] font-bold text-white ${config.chip}`}
              >
                {config.icon}
              </span>
              <p className="flex-1 font-sans text-[18px] leading-snug text-primary">
                <span className="sr-only">{config.label}: </span>
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[20px] text-muted-strong transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
