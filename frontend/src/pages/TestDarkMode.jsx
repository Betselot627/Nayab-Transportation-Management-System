import { useTheme } from "../context/ThemeContext";

const TestDarkMode = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dark Mode Test Page
        </h1>

        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
          <p className="text-gray-900 dark:text-white mb-4">
            Current theme: <strong>{theme}</strong>
          </p>
          <p className="text-gray-900 dark:text-white mb-4">
            Is dark mode? <strong>{isDark ? "Yes" : "No"}</strong>
          </p>

          <button
            onClick={() => {
              console.log("Toggling theme from:", theme);
              toggleTheme();
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
          >
            Toggle Theme
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-100 dark:bg-red-900 rounded">
            <p className="text-red-900 dark:text-red-100">Red Background</p>
          </div>
          <div className="p-4 bg-green-100 dark:bg-green-900 rounded">
            <p className="text-green-900 dark:text-green-100">
              Green Background
            </p>
          </div>
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded">
            <p className="text-blue-900 dark:text-blue-100">Blue Background</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDarkMode;
