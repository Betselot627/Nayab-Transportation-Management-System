const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        {icon && <div className="text-4xl text-blue-600">{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
