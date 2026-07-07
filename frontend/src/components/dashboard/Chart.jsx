const Chart = ({ title, data }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center text-gray-500">
        Chart Component - Integrate charting library
      </div>
    </div>
  );
};

export default Chart;
