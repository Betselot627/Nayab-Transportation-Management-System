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
  Truck,
  Users,
  Calendar,
  Wrench,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/vehicles", label: "Vehicles" },
    { path: "/admin/drivers", label: "Drivers" },
    { path: "/admin/customers", label: "Customers" },
    { path: "/admin/shipments", label: "Shipments" },
    { path: "/admin/bookings", label: "Bookings" },
    { path: "/admin/calendar", label: "Availability" },
    { path: "/admin/tracking/live", label: "Live Tracking" },
    { path: "/admin/tracking/history", label: "Tracking History" },
    { path: "/admin/maintenance", label: "Maintenance" },
    { path: "/admin/reports", label: "Reports" },
    { path: "/admin/settings", label: "Settings" },
  ];

  const pathnames = location.pathname.split("/").filter((x) => x);

  const iconMap = {
    dashboard: <LayoutDashboard className="w-3.5 h-3.5" />,
    vehicles: <Truck className="w-3.5 h-3.5" />,
    drivers: <Users className="w-3.5 h-3.5" />,
    customers: <Users className="w-3.5 h-3.5" />,
    shipments: <LayoutDashboard className="w-3.5 h-3.5" />,
    bookings: <Calendar className="w-3.5 h-3.5" />,
    calendar: <Calendar className="w-3.5 h-3.5" />,
    tracking: <Truck className="w-3.5 h-3.5" />,
    maintenance: <Wrench className="w-3.5 h-3.5" />,
    reports: <BarChart3 className="w-3.5 h-3.5" />,
    settings: <SettingsIcon className="w-3.5 h-3.5" />,
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
              <span className="capitalize text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 whitespace-nowrap">
                Admin
              </span>
              {pathnames.slice(0, 3).map((value, index) => {
                if (value === "admin") return null;
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
            {/* Global Search - Hidden on small mobile */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            {/* Dark Mode Toggle */}
            <ThemeToggle compact />

            {/* Notification Center */}
            <NotificationCenter />

            {/* Quick Profile Widget */}
            <Link
              to="/admin/settings"
              className="flex items-center gap-2 sm:gap-3 border-l border-gray-200 dark:border-gray-800 pl-2 sm:pl-3 hover:opacity-90 transition"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white leading-none">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium capitalize mt-1">
                  {user?.role || "Administrator"}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-blue-500/20 shadow-inner text-sm overflow-hidden shrink-0">
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
            </Link>
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
              <Link to="/admin/payments" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                Financials
              </Link>
              <Link to="/admin/settings" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                Settings
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
