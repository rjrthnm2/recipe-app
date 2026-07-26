import { useEffect, useState } from "react";

// TEMPORARY design tool. Lets Robin flip between background treatments on the
// real pages before we commit to one. Invisible to everyone else: the panel
// only appears after visiting any page with ?bg=1, and the chosen treatment
// is stored per-browser (nothing is saved to the database).
//
// Remove this component (and the [data-bg] blocks in index.css) once a
// treatment is chosen and applied as the default.

const TREATMENTS = [
  { id: "current", label: "Current", hint: "What's live today" },
  { id: "canvas", label: "Canvas", hint: "Tinted page, white cards" },
  { id: "aurora", label: "Aurora", hint: "Canvas + soft blooms" },
  { id: "aurora-drift", label: "Aurora (drifting)", hint: "Blooms move slowly" },
  { id: "gingham", label: "Gingham", hint: "Canvas + tea-towel check" },
];

const STORE_KEY = "bgPreview";
const PANEL_KEY = "bgPreviewPanel";

export default function BackgroundPreview() {
  const [active, setActive] = useState(
    () => localStorage.getItem(STORE_KEY) || "current",
  );
  const [showPanel, setShowPanel] = useState(() => {
    if (new URLSearchParams(window.location.search).has("bg")) {
      localStorage.setItem(PANEL_KEY, "1");
      return true;
    }
    return localStorage.getItem(PANEL_KEY) === "1";
  });

  // Drive the CSS treatments from <html data-bg="...">.
  useEffect(() => {
    document.documentElement.setAttribute("data-bg", active);
    localStorage.setItem(STORE_KEY, active);
  }, [active]);

  if (!showPanel) return null;

  const hide = () => {
    localStorage.removeItem(PANEL_KEY);
    setShowPanel(false);
  };

  return (
    <div className="fixed bottom-24 left-4 z-40 w-[15rem] rounded-[12px] border border-border bg-white/95 p-3 shadow-lg backdrop-blur sm:bottom-4 print:hidden">
      <div className="flex items-center justify-between gap-2">
        <p className="font-ui text-[14px] font-semibold text-primary">
          Background preview
        </p>
        <button
          type="button"
          onClick={hide}
          className="rounded px-2 py-1 font-ui text-[14px] text-muted-strong hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Hide
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {TREATMENTS.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              aria-pressed={isActive}
              className={`min-h-[44px] rounded-[8px] border px-3 text-left font-ui text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isActive
                  ? "border-transparent bg-accent text-white"
                  : "border-border bg-white text-primary hover:bg-secondary"
              }`}
            >
              <span className="block font-medium">{t.label}</span>
              <span
                className={`block text-[13px] ${
                  isActive ? "text-white/80" : "text-muted-strong"
                }`}
              >
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 font-sans text-[13px] leading-snug text-muted-strong">
        Only visible to you. Browse a few pages with each one.
      </p>
    </div>
  );
}
