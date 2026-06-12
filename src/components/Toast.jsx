import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

const TYPE_STYLES = {
  info: "bg-[#0F172A] text-white",
  success: "bg-[#16a34a] text-white",
  error: "bg-[#dc2626] text-white",
};

// Lightweight in-app notifications, replacing blocking alert() popups.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 print:hidden"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-[8px] px-5 py-3 font-sans text-[16px] shadow-lg motion-safe:animate-in motion-safe:slide-in-from-bottom-2 ${
              TYPE_STYLES[t.type] || TYPE_STYLES.info
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
