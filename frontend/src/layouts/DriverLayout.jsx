import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const DriverLayout = () => {
  const links = [
    { path: "/driver/dashboard", label: "Dashboard" },
    { path: "/driver/my-trips", label: "My Trips" },
    { path: "/driver/update-status", label: "Update Status" },
  ];

  return (
    <div className="flex">
      <Sidebar links={links} />
      <main className="flex-grow p-6 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default DriverLayout;
