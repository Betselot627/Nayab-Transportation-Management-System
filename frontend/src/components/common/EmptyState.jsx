import React from "react";
import { Info } from "lucide-react";

const EmptyState = ({
  icon: Icon = Info,
  title = "No data found",
  description = "There are no records matching your criteria. Try adjusting your filters.",
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 py-12 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl shadow-sm ${className}`}>
      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center mb-4 text-blue-500 dark:text-blue-400">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
