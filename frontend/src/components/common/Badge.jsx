import React from "react";

const Badge = ({ variant = "default", children, className = "" }) => {
  const baseStyles = "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 inline-flex items-center gap-1.5";
  
  const variants = {
    default: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700",
    success: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/50",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
    error: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50",
    info: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50",
    purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/50",
    orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50",
  };

  const currentVariant = variants[variant] || variants.default;

  return (
    <span className={`${baseStyles} ${currentVariant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
