import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const DispatcherLayout = () => {
  const links = [
    { path: "/dispatcher/dashboard", label: "Dashboard" },
    { path: "/dispatcher/bookings", label: "Bookings" },
    { path: "/dispatcher/assign-vehicle", label: "Assign Vehicle" },
    { path: "/dispatcher/assign-driver", label: "Assign Driver" },
    { path: "/dispatcher/track-trips", label: "Track Trips" },
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

export default DispatcherLayout;
