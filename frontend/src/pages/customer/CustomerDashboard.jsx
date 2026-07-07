import StatCard from "../../components/dashboard/StatCard";

const CustomerDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Customer Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Shipments" value="3" />
        <StatCard title="Delivered" value="15" />
        <StatCard title="Pending" value="2" />
      </div>
    </div>
  );
};

export default CustomerDashboard;
