import React from "react";

const LoadingSkeleton = ({ type = "text", rows = 4, className = "" }) => {
  const baseStyles = "animate-pulse bg-gray-200 dark:bg-gray-700 rounded";

  if (type === "table") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded-lg w-full"></div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/12"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/12"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/12"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/12"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/12"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className={`border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4 bg-white dark:bg-gray-900 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mt-4"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className={`${baseStyles} h-4`}
          style={{ width: `${Math.floor(Math.random() * (95 - 40) + 40)}%` }}
        ></div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
