import StatCard from "../../components/dashboard/StatCard";

const DriverDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Driver Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Assigned Trips" value="5" />
        <StatCard title="Completed Trips" value="42" />
        <StatCard title="Pending Deliveries" value="3" />
      </div>
    </div>
  );
};

export default DriverDashboard;
