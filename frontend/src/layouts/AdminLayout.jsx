import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import GlobalSearch from "../components/common/GlobalSearch";
import NotificationCenter from "../components/common/NotificationCenter";
import { User, LogOut, ChevronRight, LayoutDashboard, Truck, Users, Calendar, Wrench, BarChart3, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const links = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/vehicles", label: "Vehicles" },
    { path: "/admin/drivers", label: "Drivers" },
    { path: "/admin/customers", label: "Customers" },
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
    dashboard: <LayoutDashboard className="w-4 h-4" />,
    vehicles: <Truck className="w-4 h-4" />,
    drivers: <Users className="w-4 h-4" />,
    customers: <Users className="w-4 h-4" />,
    bookings: <Calendar className="w-4 h-4" />,
    calendar: <Calendar className="w-4 h-4" />,
    tracking: <Truck className="w-4 h-4" />,
    maintenance: <Wrench className="w-4 h-4" />,
    reports: <BarChart3 className="w-4 h-4" />,
    settings: <SettingsIcon className="w-4 h-4" />,
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar links={links} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-3 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-150 dark:border-gray-800 shadow-sm transition-all">
          
          {/* Left: Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              Admin
            </span>
            {pathnames.map((value, index) => {
              if (value === "admin") return null;
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join("/")}`;
              
              return (
                <div key={to} className="flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  <Link
                    to={to}
                    className={`hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors ${
                      last ? "text-gray-900 dark:text-white font-semibold" : ""
                    }`}
                  >
                    {iconMap[value]}
                    <span className="capitalize">{value.replace("-", " ")}</span>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Right: Global Search & Alerts Center & Quick Profile */}
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationCenter />
            
            {/* Quick Profile Widget */}
            <div className="flex items-center gap-3 border-l border-gray-150 dark:border-gray-800 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium capitalize mt-1">
                  {user?.role || "Administrator"}
                </p>
              </div>
              <div className="w-9 h-9 bg-blue-600 dark:bg-blue-700 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-blue-500/20 shadow-inner">
                {user?.name ? user.name[0].toUpperCase() : <User className="w-5 h-5" />}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Pages */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gray-50/50 dark:bg-gray-900/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
