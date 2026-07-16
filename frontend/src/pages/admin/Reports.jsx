import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Users,
} from "lucide-react";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { reportService } from "../../services/reportService";
import toast from "react-hot-toast";

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await reportService.getDashboardStats();
      setReportData(data);
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const monthlyData = [
    { name: "Jan", revenue: 12000, shipments: 45 },
    { name: "Feb", revenue: 15000, shipments: 52 },
    { name: "Mar", revenue: 18000, shipments: 61 },
    { name: "Apr", revenue: 22000, shipments: 73 },
    { name: "May", revenue: 25000, shipments: 85 },
    { name: "Jun", revenue: 28000, shipments: 92 },
  ];

  const handleExport = (type) => {
    toast.success(`${type} report exported successfully`);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Reports & Analytics
          </h1>
          <p className="text-slate-600 mt-1">Comprehensive business insights</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("PDF")}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => handleExport("Excel")}
            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
          <DollarSign className="w-8 h-8 mb-2" />
          <p className="text-sm">Total Revenue</p>
          <p className="text-3xl font-bold">
            ${reportData?.totalRevenue?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <Package className="w-8 h-8 mb-2" />
          <p className="text-sm">Total Shipments</p>
          <p className="text-3xl font-bold">
            {reportData?.totalShipments || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <Truck className="w-8 h-8 mb-2" />
          <p className="text-sm">Active Vehicles</p>
          <p className="text-3xl font-bold">
            {reportData?.activeVehicles || 0}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl text-white">
          <Users className="w-8 h-8 mb-2" />
          <p className="text-sm">Total Customers</p>
          <p className="text-3xl font-bold">
            {reportData?.totalCustomers || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-amber-500" />
          Revenue & Shipments Trend
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <RechartsBar data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="#f59e0b"
              name="Revenue ($)"
            />
            <Bar
              yAxisId="right"
              dataKey="shipments"
              fill="#3b82f6"
              name="Shipments"
            />
          </RechartsBar>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <ReportCard
          title="Revenue Report"
          description="Monthly revenue breakdown"
          icon={<DollarSign />}
          onClick={() => handleExport("Revenue")}
        />
        <ReportCard
          title="Shipment Report"
          description="Delivery performance metrics"
          icon={<Package />}
          onClick={() => handleExport("Shipment")}
        />
        <ReportCard
          title="Vehicle Report"
          description="Fleet utilization statistics"
          icon={<Truck />}
          onClick={() => handleExport("Vehicle")}
        />
        <ReportCard
          title="Driver Report"
          description="Driver performance analysis"
          icon={<Users />}
          onClick={() => handleExport("Driver")}
        />
        <ReportCard
          title="Customer Report"
          description="Customer activity insights"
          icon={<Users />}
          onClick={() => handleExport("Customer")}
        />
        <ReportCard
          title="Financial Report"
          description="Profit and expense summary"
          icon={<BarChart />}
          onClick={() => handleExport("Financial")}
        />
      </div>
    </div>
  );
};

const ReportCard = ({ title, description, icon, onClick }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center gap-4 mb-3">
      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    </div>
    <p className="text-slate-600 text-sm mb-4">{description}</p>
    <button className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
      <FileText className="w-4 h-4" />
      Generate Report
    </button>
  </motion.div>
);

export default Reports;
