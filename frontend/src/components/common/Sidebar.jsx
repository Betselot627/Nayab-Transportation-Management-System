import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  DollarSign,
  Settings,
  LogOut,
  ChevronRight,
  User,
  FileText,
  Wrench,
  BarChart3,
  MapPin,
  Calendar,
  BookOpen,
  Map,
  Activity,
  CreditCard,
  X,
} from "lucide-react";

const iconMap = {
  Dashboard: LayoutDashboard,
  Users: Users,
  Vehicles: Truck,
  Drivers: Users,
  Customers: Users,
  Bookings: Calendar,
  Availability: Calendar,
  "Live Tracking": MapPin,
  "Tracking History": Map,
  Maintenance: Wrench,
  Payments: CreditCard,
  Reports: BarChart3,
  "My Bookings": BookOpen,
  "Book Shipment": Package,
  "Track Shipment": MapPin,
  Profile: User,
  "My Trips": Map,
  "Trip Details": FileText,
  "Update Status": Activity,
  "Register Vehicle": Truck,
  "My Vehicles": Truck,
  Shipments: Package,
  Settings: Settings,
};

const Sidebar = ({ links, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isDriver = user?.role === "driver";
  const isCustomer = user?.role === "customer";
  const themeColor = isCustomer
    ? "bg-purple-600"
    : isDriver
      ? "bg-green-600"
      : "bg-blue-600";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          w-64 bg-slate-900 dark:bg-gray-950
          border-r border-slate-800 dark:border-gray-800
          text-white flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          z-50 lg:z-30
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo & Brand */}
        <div className="p-4 sm:p-6 border-b border-slate-800 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${themeColor} p-2 rounded-xl shadow-sm text-white`}>
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">NTMS</h1>
              <p className="text-[11px] text-gray-400">Transport Management</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-800 dark:border-gray-800">
          <button
            onClick={() => {
              const profilePath =
                user?.role === "admin"
                  ? "/admin/settings"
                  : user?.role === "driver"
                    ? "/driver/profile"
                    : user?.role === "customer"
                      ? "/customer/profile"
                      : "/";
              navigate(profilePath);
              handleLinkClick();
            }}
            className="flex items-center gap-3 w-full hover:bg-slate-800/80 rounded-xl p-2 transition-colors duration-200 cursor-pointer"
          >
            <div
              className={`w-10 h-10 ${themeColor} rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white/10`}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : user?.name ? (
                <span className="font-bold text-sm text-white">
                  {user.name[0].toUpperCase()}
                </span>
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate text-white">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {user?.role || "Role"}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Links - Scrollable */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
          {links.map((link, index) => {
            const Icon = iconMap[link.label] || LayoutDashboard;
            return (
              <NavLink
                key={index}
                to={link.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium ${
                    isActive
                      ? `${themeColor} text-white shadow-md font-semibold`
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}
                    />
                    <span className="flex-1 truncate">{link.label}</span>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "translate-x-0.5 opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Theme Toggle & Logout */}
        <div className="p-3 sm:p-4 border-t border-slate-800 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between px-2 py-1 bg-slate-800/40 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Theme Mode</span>
            <ThemeToggle compact />
          </div>

          <button
            onClick={() => {
              handleLogout();
              handleLinkClick();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:bg-red-600/90 hover:text-white transition-all duration-200 group text-sm font-medium cursor-pointer"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
