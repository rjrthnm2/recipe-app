import { useState, useRef, useEffect } from "react";

const MAX_MATCHES = 60; // cap how many we render for performance

// A text input with a height-capped suggestion list (scroll for more), so
// typing a common prefix doesn't fill the whole screen.
export default function IngredientCombobox({
  value,
  onChange,
  suggestions = [],
  placeholder,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const query = (value || "").trim().toLowerCase();
  const matches = (() => {
    if (suggestions.length === 0) return [];
    if (!query) return suggestions.slice(0, MAX_MATCHES);
    const starts = [];
    const includes = [];
    for (const s of suggestions) {
      const ls = s.toLowerCase();
      if (ls === query) continue; // already typed exactly; no need to suggest
      if (ls.startsWith(query)) starts.push(s);
      else if (ls.includes(query)) includes.push(s);
      if (starts.length + includes.length >= MAX_MATCHES) break;
    }
    return [...starts, ...includes];
  })();

  const choose = (s) => {
    onChange(s);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && matches[activeIndex]) {
        e.preventDefault();
        choose(matches[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        autoComplete="off"
        className="h-12 w-full rounded-md border border-border bg-white px-3 font-sans text-[16px] text-primary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {open && matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg"
          style={{ maxHeight: "25rem" }}
        >
          {matches.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-3 py-2 font-sans text-[16px] ${
                i === activeIndex
                  ? "bg-accent/10 text-primary"
                  : "text-primary hover:bg-secondary"
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
