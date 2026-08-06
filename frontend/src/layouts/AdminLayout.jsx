import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import GlobalSearch from "../components/common/GlobalSearch";
import NotificationCenter from "../components/common/NotificationCenter";
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
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const AdminLayout = () => {
  const { user } = useAuth();
  const location = useLocation();

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

  // Dynamic Breadcrumb generation
  const pathnames = location.pathname.split("/").filter((x) => x);

  const iconMap = {
    dashboard: <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4" />,
    vehicles: <Truck className="w-3 h-3 sm:w-4 sm:h-4" />,
    drivers: <Users className="w-3 h-3 sm:w-4 sm:h-4" />,
    customers: <Users className="w-3 h-3 sm:w-4 sm:h-4" />,
    shipments: <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4" />,
    bookings: <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />,
    calendar: <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />,
    tracking: <Truck className="w-3 h-3 sm:w-4 sm:h-4" />,
    maintenance: <Wrench className="w-3 h-3 sm:w-4 sm:h-4" />,
    reports: <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />,
    settings: <SettingsIcon className="w-3 h-3 sm:w-4 sm:h-4" />,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <Sidebar links={links} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 overflow-x-auto">
            <span className="capitalize text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 whitespace-nowrap">
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
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                  <Link
                    to={to}
                    className={`hover:text-blue-600 flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap ${
                      last ? "text-gray-900 font-semibold" : ""
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

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Global Search - Hidden on mobile */}
            <div className="hidden md:block">
              <GlobalSearch />
            </div>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Quick Profile Widget */}
            <div className="flex items-center gap-2 sm:gap-3 border-l border-gray-200 pl-2 sm:pl-4">
              <div className="text-right hidden md:block">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-none">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium capitalize mt-1">
                  {user?.role || "Administrator"}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-blue-500/20 shadow-inner text-sm">
                {user?.name ? (
                  user.name[0].toUpperCase()
                ) : (
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Pages - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
