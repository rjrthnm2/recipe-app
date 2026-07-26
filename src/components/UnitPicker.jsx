import { useState, useRef, useEffect } from "react";
import { UNIT_GROUPS, UNIT_MAP } from "../lib/units";

// The most-used units (from analyzing the recipe data) get quick chips.
const COMMON_UNITS = ["tsp", "tbsp", "cup", "oz", "lb", "can"];

// A compact unit control: a small trigger button that opens a popover with
// quick-pick chips for common units plus the full, height-capped grouped list.
export default function UnitPicker({ value, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (key) => {
    onChange(key);
    setOpen(false);
  };

  const triggerLabel = value ? (UNIT_MAP[value]?.label ?? value) : "Unit";

  const chipClass = (active) =>
    `rounded-full px-3 py-1.5 font-ui text-[14px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      active
        ? "bg-accent text-white border-accent"
        : "bg-white text-primary border-border hover:bg-secondary"
    }`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex h-12 w-full items-center justify-between rounded-md border border-border bg-white px-3 font-sans text-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          value ? "text-primary" : "text-slate-500"
        }`}
      >
        <span className="truncate">{triggerLabel}</span>
        <span className="ml-1 shrink-0 text-muted-foreground">▾</span>
      </button>

      {open && (
        <div
          className="absolute z-30 mt-1 w-60 rounded-md border border-border bg-white p-2 shadow-lg"
          role="listbox"
        >
          <div className="mb-1 px-1 font-ui text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            Common
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {COMMON_UNITS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => select(key)}
                className={chipClass(value === key)}
                role="option"
                aria-selected={value === key}
              >
                {UNIT_MAP[key]?.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => select("")}
              className={chipClass(!value)}
              role="option"
              aria-selected={!value}
            >
              none
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto border-t border-border pt-2">
            {UNIT_GROUPS.map((group) => (
              <div key={group.label} className="mb-1">
                <div className="px-1 py-1 font-ui text-[12px] uppercase tracking-wide text-faded">
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {group.units.map((unit) => (
                    <button
                      key={unit.key}
                      type="button"
                      onClick={() => select(unit.key)}
                      role="option"
                      aria-selected={value === unit.key}
                      className={`rounded-md px-2.5 py-1.5 font-ui text-[14px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        value === unit.key
                          ? "bg-accent text-white border-accent"
                          : "bg-white text-primary border-border hover:bg-secondary"
                      }`}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
