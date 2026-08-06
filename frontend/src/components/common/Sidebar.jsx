import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
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
  Menu,
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
  Payments: DollarSign,
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

const Sidebar = ({ links }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          w-64 bg-gradient-to-b from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900
          text-white flex flex-col shadow-2xl
          transform transition-transform duration-300 ease-in-out
          z-40
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo & Brand */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`${themeColor} p-2 rounded-lg`}>
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">NTMS</h1>
              <p className="text-xs text-gray-400">Transportation System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-700">
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
              closeMobileMenu();
            }}
            className="flex items-center gap-3 w-full hover:bg-gray-700/50 rounded-lg p-2 transition-colors duration-200 cursor-pointer"
          >
            <div
              className={`w-10 h-10 ${themeColor} rounded-full flex items-center justify-center shrink-0 overflow-hidden`}
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {user?.role || "Role"}
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Links - Scrollable */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link, index) => {
            const Icon = iconMap[link.label] || LayoutDashboard;
            return (
              <NavLink
                key={index}
                to={link.path}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? `${themeColor} text-white shadow-lg`
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}
                    />
                    <span className="flex-1 font-medium text-sm">
                      {link.label}
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform ${isActive ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              handleLogout();
              closeMobileMenu();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="flex-1 font-medium text-left text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
