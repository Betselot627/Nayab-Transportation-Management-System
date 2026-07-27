import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const DriverLayout = () => {
  const links = [
    { path: "/driver/dashboard", label: "Dashboard" },
    { path: "/driver/my-trips", label: "My Trips" },
    { path: "/driver/my-vehicles", label: "My Vehicles" },
    { path: "/driver/register-vehicle", label: "Register Vehicle" },
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
