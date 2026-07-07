import StatCard from "../../components/dashboard/StatCard";

const DispatcherDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dispatcher Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Pending Bookings" value="12" />
        <StatCard title="Active Trips" value="18" />
        <StatCard title="Available Vehicles" value="25" />
      </div>
    </div>
  );
};

export default DispatcherDashboard;
