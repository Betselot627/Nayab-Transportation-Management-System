import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const CustomerLayout = () => {
  const links = [
    { path: "/customer/dashboard", label: "Dashboard" },
    { path: "/customer/book-shipment", label: "Book Shipment" },
    { path: "/customer/my-bookings", label: "My Bookings" },
    { path: "/customer/track-shipment", label: "Track Shipment" },
    { path: "/customer/profile", label: "Profile" },
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

export default CustomerLayout;
