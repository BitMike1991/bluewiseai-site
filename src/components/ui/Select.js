// src/components/ui/Select.js
// Custom select dropdown — replaces all native <select> elements.
// All colors via CSS vars for multi-tenant branding support.

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

export default function Select({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  searchable = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState(-1);
  const [dropdownAlign, setDropdownAlign] = useState("left"); // 'left' or 'right'
  const ref = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const filtered = searchable && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus search on open + detect best alignment
  useEffect(() => {
    if (open && searchable && searchRef.current) searchRef.current.focus();
    if (open) {
      setHighlighted(-1);
      // Check viewport position — if button is closer to right edge, align dropdown right
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const spaceRight = window.innerWidth - rect.left;
        const spaceLeft = rect.right;
        // If less than 240px space to the right, flip to right-align
        setDropdownAlign(spaceRight < 240 && spaceLeft >= 240 ? "right" : "left");
      }
    }
    if (!open) setSearch("");
  }, [open, searchable]);

  // Scroll highlighted into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const el = listRef.current.children[searchable ? highlighted + 1 : highlighted];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, searchable]);

  const handleSelect = useCallback((val) => {
    onChange(val);
    setOpen(false);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlighted >= 0 && filtered[highlighted]) handleSelect(filtered[highlighted].value);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }, [open, highlighted, filtered, handleSelect]);

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full gap-2 rounded-xl border border-[var(--d-border,#1e1e2e)] bg-[var(--d-surface,#111119)]/60 px-3 py-2 text-sm text-left transition-colors hover:border-[var(--d-primary,#6c63ff)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--d-primary,#6c63ff)]/50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "text-[var(--d-text,#f0f0f5)]" : "text-[var(--d-muted,#8888aa)]"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--d-muted,#8888aa)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className={`absolute z-50 top-full mt-1 max-h-60 min-w-full w-max max-w-[calc(100vw-2rem)] overflow-auto rounded-xl border border-[var(--d-border,#1e1e2e)] bg-[var(--d-surface,#111119)] shadow-2xl ${dropdownAlign === "right" ? "right-0" : "left-0"}`}
        >
          {searchable && (
            <div className="sticky top-0 p-1.5 bg-[var(--d-surface,#111119)] border-b border-[var(--d-border,#1e1e2e)]/40">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setHighlighted(0); }}
                placeholder="Search..."
                className="w-full rounded-lg bg-[var(--d-bg,#0a0a12)] border border-[var(--d-border,#1e1e2e)] px-2.5 py-1.5 text-xs text-[var(--d-text,#f0f0f5)] placeholder:text-[var(--d-muted,#8888aa)] focus:outline-none"
              />
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--d-muted,#8888aa)]">No results</div>
          ) : (
            filtered.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                  opt.value === value
                    ? "bg-[var(--d-primary,#6c63ff)]/15 text-[var(--d-primary,#6c63ff)]"
                    : i === highlighted
                    ? "bg-[var(--d-border,#1e1e2e)]/50 text-[var(--d-text,#f0f0f5)]"
                    : "text-[var(--d-text,#f0f0f5)] hover:bg-[var(--d-border,#1e1e2e)]/30"
                }`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
