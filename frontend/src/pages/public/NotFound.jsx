import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Truck, House as Home, ArrowLeft } from "lucide-react";
import ThemeToggle from "../../components/common/ThemeToggle";

const NotFound = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!isAuthenticated) return "/";
    if (user?.role === "admin") return "/admin/dashboard";
    if (user?.role === "driver") return "/driver/dashboard";
    if (user?.role === "dispatcher") return "/dispatcher/dashboard";
    if (user?.role === "customer") return "/customer/dashboard";
    return "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center justify-center p-4 text-center transition-colors duration-300">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle compact />
      </div>

      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 animate-slide-up">
        {/* Animated icon */}
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner ring-8 ring-blue-500/10">
          <Truck className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
            Error 404
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            The page or route you are trying to access does not exist, or might have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm cursor-pointer text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to={getDashboardPath()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition shadow hover:shadow-md cursor-pointer text-sm"
          >
            <Home className="w-4 h-4" />
            {isAuthenticated ? "Dashboard" : "Home"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
