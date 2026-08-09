import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const ThemeToggle = ({ className = "", compact = false, showLabel = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`
        relative inline-flex items-center justify-center
        ${compact ? "p-1.5" : "p-2 sm:px-2.5 sm:py-2"}
        rounded-xl
        transition-all duration-200 ease-in-out
        bg-gray-100/80 hover:bg-gray-200/90 text-gray-700
        dark:bg-gray-800/90 dark:hover:bg-gray-700 dark:text-amber-300
        border border-gray-200/80 dark:border-gray-700/80
        shadow-sm hover:shadow active:scale-95
        cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500/40
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {isDark ? (
          <Sun className={`${compact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5"} text-amber-400 animate-spin-slow`} />
        ) : (
          <Moon className={`${compact ? "w-4 h-4" : "w-4 h-4 sm:w-5 sm:h-5"} text-slate-700`} />
        )}
        {showLabel && (
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
