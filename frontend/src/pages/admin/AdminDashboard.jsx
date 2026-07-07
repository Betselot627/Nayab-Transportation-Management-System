import StatCard from "../../components/dashboard/StatCard";

const AdminDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value="125" />
        <StatCard title="Active Vehicles" value="45" />
        <StatCard title="Total Drivers" value="68" />
        <StatCard title="Active Shipments" value="32" />
      </div>
    </div>
  );
};

export default AdminDashboard;
