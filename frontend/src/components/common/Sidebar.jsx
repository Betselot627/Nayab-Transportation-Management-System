import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Truck,
  Package,
  DollarSign,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  User,
  FileText,
  Wrench,
  BarChart3,
  MapPin,
  Calendar,
  BookOpen,
  Map,
  Activity,
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
  Settings: Settings,
};

const Sidebar = ({ links }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen text-white flex flex-col shadow-2xl">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link, index) => {
          const Icon = iconMap[link.label] || LayoutDashboard;
          return (
            <NavLink
              key={index}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}
                  />
                  <span className="flex-1 font-medium">{link.label}</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${isActive ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`}
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
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5" />
          <span className="flex-1 font-medium text-left">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
