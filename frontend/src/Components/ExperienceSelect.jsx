import { useState, useRef, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { FiSearch, FiChevronDown, FiX } from "react-icons/fi";
import { Check } from "lucide-react";

const EXPERIENCE_OPTIONS = [
  {
    value: "",
    label: "All Experience",
    subtitle: "Show all jobs regardless of experience",
    shortLabel: "All Experience",
  },
  {
    value: "0-1 years",
    label: "0–1 years",
    subtitle: "Freshers and entry level",
    shortLabel: "0–1 years",
  },
  {
    value: "1-3 years",
    label: "1–3 years",
    subtitle: "",
    shortLabel: "1–3 years",
  },
  {
    value: "3-5 years",
    label: "3–5 years",
    subtitle: "",
    shortLabel: "3–5 years",
  },
  {
    value: "5+ years",
    label: "5+ years",
    subtitle: "Senior and lead roles",
    shortLabel: "5+ years",
  },
];

const ExperienceSelect = ({
  value = "",
  onChange,
  placeholder = "All Experience",
  className = "",
  borderless = false,
  compact = false,
  "aria-label": ariaLabel = "Filter by experience",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize current value to match an option
  const normalizedValue = useMemo(() => {
    if (!value || value === "All" || value === "All Experience") return "";
    const vLower = value.toLowerCase();
    if (vLower.includes("0-1") || vLower.includes("0–1") || vLower === "fresher") return "0-1 years";
    if (vLower.includes("1-3") || vLower.includes("1–3")) return "1-3 years";
    if (vLower.includes("3-5") || vLower.includes("3–5")) return "3-5 years";
    if (vLower.includes("5+")) return "5+ years";
    if (vLower === "0-2 years") return "0-1 years";
    if (vLower === "2-5 years") return "3-5 years";
    return value;
  }, [value]);

  const selectedOption = useMemo(() => {
    return EXPERIENCE_OPTIONS.find((opt) => opt.value === normalizedValue) || EXPERIENCE_OPTIONS[0];
  }, [normalizedValue]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return EXPERIENCE_OPTIONS;
    const term = searchTerm.toLowerCase();
    return EXPERIENCE_OPTIONS.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(term);
      const matchSubtitle = opt.subtitle ? opt.subtitle.toLowerCase().includes(term) : false;
      const matchValue = opt.value.toLowerCase().includes(term);
      return matchLabel || matchSubtitle || matchValue;
    });
  }, [searchTerm]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (onChange) {
      onChange({ target: { name: "experienceRequired", value: optValue } });
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ target: { name: "experienceRequired", value: "" } });
    }
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between text-left transition-all ${
          compact
            ? "h-11 px-3.5 bg-amber-50/40 hover:bg-amber-50 border border-amber-200/80 rounded-xl text-sm"
            : borderless
            ? "h-10 px-1 bg-transparent border-0 outline-none text-sm cursor-pointer"
            : "h-11 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm shadow-sm"
        }`}
      >
        <span
          className={`truncate font-medium ${
            selectedOption.value ? "text-slate-900 font-semibold" : "text-slate-500"
          }`}
        >
          {selectedOption.value ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {selectedOption.value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e);
                }
              }}
              title="Clear experience filter"
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <FiX size={14} />
            </span>
          )}
          <FiChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-brand-600" : ""
            }`}
          />
        </div>
      </button>

      {/* Floating Popover matching the exact screenshot design */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          style={{
            boxShadow: "0 20px 40px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)",
          }}
        >
          {/* Top Search Input with divider */}
          <div className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-100 mb-1.5">
            <FiSearch className="text-slate-400 text-lg shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search experience..."
              className="w-full bg-transparent border-0 outline-none text-sm text-slate-800 placeholder:text-slate-400 font-normal"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          {/* Experience Options List */}
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-0.5">
            {filteredOptions.map((opt) => {
              const isSelected = normalizedValue === opt.value;
              return (
                <button
                  key={opt.value || "all"}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[#00acc1] text-slate-900 shadow-sm"
                      : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Checkmark icon for selected option */}
                    {isSelected ? (
                      <Check
                        className="text-slate-900 shrink-0 mt-0.5"
                        size={18}
                        strokeWidth={2.75}
                        aria-hidden="true"
                      />
                    ) : (
                      <div className="w-4 shrink-0" />
                    )}

                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-sm leading-tight truncate ${
                          isSelected ? "font-semibold text-slate-900" : "font-medium text-slate-800"
                        }`}
                      >
                        {opt.label}
                      </span>
                      {opt.subtitle && (
                        <span
                          className={`text-xs mt-0.5 leading-tight truncate ${
                            isSelected ? "text-slate-800/80 font-normal" : "text-slate-400"
                          }`}
                        >
                          {opt.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                No experience levels found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

ExperienceSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  borderless: PropTypes.bool,
  compact: PropTypes.bool,
  "aria-label": PropTypes.string,
};

export default ExperienceSelect;
