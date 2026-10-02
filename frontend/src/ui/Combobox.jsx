import { useEffect, useMemo, useRef, useState } from "react";

// A text input with a filtered suggestion list. Written once because the app
// had four hand-rolled copies of this pattern (onboarding skills, onboarding
// certifications, and the three inputs in Edit Profile), none of which closed
// on Escape or on an outside click, and none of which were keyboard navigable.
//
// The list is absolutely positioned so opening it never reflows the form, and
// sits above the surrounding card chrome - it used to render underneath the
// footer buttons.
function Combobox({
  value,
  onChange,
  options = [],
  exclude = [],
  placeholder,
  disabled = false,
  maxSuggestions = 5,
  onSelect,
  onSubmit,
  inputClassName = "",
  leadingIcon = null,
  listClassName = "",
  "aria-label": ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef(null);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    const taken = new Set(exclude.map((e) => String(e).toLowerCase()));
    return options
      .filter((o) => o.toLowerCase().includes(query) && !taken.has(o.toLowerCase()))
      .slice(0, maxSuggestions);
  }, [value, options, exclude, maxSuggestions]);

  const visible = open && suggestions.length > 0;

  useEffect(() => {
    if (!visible) return;
    const onPointerDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [visible]);

  const choose = (option) => {
    setOpen(false);
    setHighlighted(-1);
    onSelect?.(option);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      setHighlighted(-1);
      return;
    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!visible) return;
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setHighlighted((i) => {
        const next = i + delta;
        if (next < 0) return suggestions.length - 1;
        if (next >= suggestions.length) return 0;
        return next;
      });
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      // A highlighted suggestion wins; otherwise whatever was typed is taken
      // as-is, so free-text entries still work.
      if (visible && highlighted >= 0) choose(suggestions[highlighted]);
      else {
        setOpen(false);
        onSubmit?.();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {leadingIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray pointer-events-none">
          {leadingIcon}
        </span>
      )}
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={visible}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={`w-full ${leadingIcon ? "pl-10 pr-4" : "px-4"} py-3 border border-[#D0D0D0] rounded-lg font-family-poppins text-sm outline-none focus:border-teal disabled:opacity-50 ${inputClassName}`}
      />

      {visible && (
        <ul
          role="listbox"
          className={`absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto py-1 ${listClassName}`}
        >
          {suggestions.map((option, i) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlighted}
                // mousedown fires before the input's blur, so the click isn't
                // lost to the list closing first.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => choose(option)}
                className={`w-full px-4 py-2 text-left font-family-poppins text-sm transition-colors ${
                  i === highlighted ? "bg-teal/10 text-teal" : "hover:bg-teal/5"
                }`}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Combobox;
