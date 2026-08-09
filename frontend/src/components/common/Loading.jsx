import React from "react";

const Loading = ({ fullScreen = false }) => {
  return (
    <div
      className={`flex flex-col justify-center items-center ${
        fullScreen ? "h-screen" : "min-h-[40vh] py-12"
      } bg-transparent transition-all duration-200`}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer pulsating glow */}
        <div className="w-12 h-12 rounded-full border-2 border-purple-500/20 animate-ping absolute"></div>

        {/* Fast spinning gradient ring */}
        <div className="w-10 h-10 rounded-full border-2 border-t-purple-600 border-r-transparent border-b-purple-400 border-l-transparent animate-spin"></div>

        {/* Center dot */}
        <div className="w-2.5 h-2.5 bg-purple-600 rounded-full absolute"></div>
      </div>
      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-3">
        Loading NTMS...
      </span>
    </div>
  );
};

export default Loading;
