import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const DriverLayout = () => {
  const links = [
    { path: "/driver/dashboard", label: "Dashboard" },
    { path: "/driver/my-trips", label: "My Trips" },
    { path: "/driver/trip-details", label: "Trip Details" },
    { path: "/driver/update-status", label: "Update Status" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar links={links} />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default DriverLayout;
