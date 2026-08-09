import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import GlobalSearch from "../components/common/GlobalSearch";
import NotificationCenter from "../components/common/NotificationCenter";
import ThemeToggle from "../components/common/ThemeToggle";
import {
  User,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  Truck,
  Users,
  MapPin,
  Menu,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const DispatcherLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { path: "/dispatcher/dashboard", label: "Dashboard" },
    { path: "/dispatcher/bookings", label: "Bookings" },
    { path: "/dispatcher/assign-vehicle", label: "Assign Vehicle" },
    { path: "/dispatcher/assign-driver", label: "Assign Driver" },
    { path: "/dispatcher/track-trips", label: "Track Trips" },
  ];

  const pathnames = location.pathname.split("/").filter((x) => x);

  const iconMap = {
    dashboard: <LayoutDashboard className="w-3.5 h-3.5" />,
    bookings: <Calendar className="w-3.5 h-3.5" />,
    "assign-vehicle": <Truck className="w-3.5 h-3.5" />,
    "assign-driver": <Users className="w-3.5 h-3.5" />,
    "track-trips": <MapPin className="w-3.5 h-3.5" />,
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        links={links}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
          {/* Left: Mobile Menu Trigger & Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open sidebar menu"
              className="lg:hidden p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 overflow-x-auto no-scrollbar">
              <span className="capitalize text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                Dispatcher
              </span>
              {pathnames.slice(0, 3).map((value, index) => {
                if (value === "dispatcher") return null;
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join("/")}`;

                return (
                  <div
                    key={to}
                    className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-600" />
                    <Link
                      to={to}
                      className={`hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap ${
                        last
                          ? "text-gray-900 dark:text-white font-semibold"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {iconMap[value]}
                      <span className="capitalize hidden sm:inline">
                        {value.replace("-", " ")}
                      </span>
                      <span className="capitalize sm:hidden text-[10px]">
                        {value.replace("-", " ").substring(0, 8)}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Global Search - Hidden on mobile */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            {/* Dark Mode Toggle */}
            <ThemeToggle compact />

            {/* Notification Center */}
            <NotificationCenter />

            {/* Quick Profile Widget */}
            <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-200 dark:border-gray-800 pl-2 sm:pl-3">
              <div className="text-right hidden md:block">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white leading-none">
                  {user?.name || "Dispatcher"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium capitalize mt-1">
                  {user?.role || "Dispatcher"}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-indigo-500/20 shadow-inner text-sm overflow-hidden shrink-0">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : user?.name ? (
                  user.name[0].toUpperCase()
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Pages - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-gray-50 dark:bg-gray-950 flex flex-col justify-between">
          <div className="flex-1">
            <Outlet />
          </div>

          {/* Dashboard Footer */}
          <footer className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <p>&copy; {new Date().getFullYear()} Nayab Trading PLC. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                About NTMS
              </Link>
              <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                Help & Support
              </Link>
              <Link to="/dispatcher/bookings" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                Bookings
              </Link>
              <Link to="/dispatcher/track-trips" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                Live Trips
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default DispatcherLayout;
