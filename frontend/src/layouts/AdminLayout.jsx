import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

const AdminLayout = () => {
  const links = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/users", label: "Users" },
    { path: "/admin/vehicles", label: "Vehicles" },
    { path: "/admin/drivers", label: "Drivers" },
    { path: "/admin/shipments", label: "Shipments" },
    { path: "/admin/maintenance", label: "Maintenance" },
    { path: "/admin/payments", label: "Payments" },
    { path: "/admin/reports", label: "Reports" },
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

export default AdminLayout;
