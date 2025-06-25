import { useEffect, useRef, useState } from "react";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  max?: number;
}

export const MultiSelect = ({
  options,
  selected,
  onChange,
  max = 4,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (selected.length < max) {
      onChange([...selected, value]);
    }
    // Close the dropdown after selection
    setIsOpen(false);
  };

  const handleToggleDropdown = () => {
    // Disable dropdown if maximum tags are selected
    if (selected.length >= max) return;
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Tags Container */}
      <div
        className="w-full p-2 border border-gray-600 rounded-md min-h-[40px] flex flex-wrap gap-2 items-center cursor-pointer"
        onClick={handleToggleDropdown}
      >
        {selected.length > 0 ? (
          selected.map((tag) => (
            <span
              key={tag}
              className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm flex items-center"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(tag);
                }}
                className="ml-1 text-xs font-bold text-white"
              >
                &times;
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-sm">Select up to {max} tags</span>
        )}
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute mt-1 w-full max-h-40 overflow-y-auto bg-gray-800 border border-gray-600 rounded-md shadow-lg z-10">
          {options.map((option) => (
            <div
              key={option}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-700 ${
                selected.includes(option) ? "bg-blue-900" : ""
              }`}
              onClick={() => toggleOption(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
