import { useState } from "react";
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  Filter,
  TrendingUp,
  Truck,
  Users,
  Wrench,
  DollarSign,
} from "lucide-react";
import Badge from "../../components/common/Badge";
import toast from "react-hot-toast";

const Reports = () => {
  const [activeReport, setActiveReport] = useState("vehicles"); // 'vehicles' | 'drivers' | 'customers' | 'bookings' | 'maintenance' | 'revenue'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Mock Database for Reports
  const reportDB = {
    vehicles: {
      stats: [
        { label: "Active Fleet", value: "28 / 45 Units" },
        { label: "Under Maintenance", value: "5 Units" },
        { label: "Average Fleet Age", value: "3.2 Years" },
      ],
      headers: ["Roll #", "Name", "Plate Number", "Type", "Status", "Mileage (km)"],
      rows: [
        ["V001", "Toyota Hiace", "AA-12345-ET", "Van", "Active", "12,450"],
        ["V002", "Isuzu Truck", "AA-67890-ET", "Truck", "Active", "45,200"],
        ["V003", "Hino 500", "AA-11223-ET", "Truck", "Active", "8,900"],
        ["V004", "Mercedes Sprinter", "AA-44556-ET", "Van", "Maintenance", "32,100"],
        ["V005", "Mitsubishi Canter", "AA-78901-ET", "Pickup", "Active", "18,650"],
      ],
    },
    drivers: {
      stats: [
        { label: "Active Shifts", value: "28 Drivers" },
        { label: "Average Rating", value: "4.8 / 5" },
        { label: "Total Completed Trips", value: "892 Trips" },
      ],
      headers: ["Roll #", "Driver Name", "License", "Mobile", "Date Joined", "Trips Run"],
      rows: [
        ["D001", "Abebe Kebede", "DL-908123", "+251911223344", "2021-04-15", "142"],
        ["D002", "Meseret Haile", "DL-671234", "+251912445566", "2022-08-10", "98"],
        ["D003", "Dawit Tesfaye", "DL-112233", "+251913778899", "2023-01-05", "74"],
        ["D004", "Tigist Alemayehu", "DL-445566", "+251914556677", "2023-06-18", "110"],
        ["D005", "Solomon Girma", "DL-789012", "+251915998877", "2020-11-20", "205"],
      ],
    },
    customers: {
      stats: [
        { label: "Total Partners", value: "156 Customers" },
        { label: "Active Invoices", value: "42 Bills" },
        { label: "Top Customer", value: "Almaz Trading Plc" },
      ],
      headers: ["Roll #", "Name", "Mobile", "Email", "Company", "Bookings Made"],
      rows: [
        ["C001", "Almaz Belay", "+251911223344", "almaz@gmail.com", "Almaz Export Plc", "42"],
        ["C002", "Bekele Zewde", "+251912445566", "bekele@gmail.com", "Bekele Transport", "31"],
        ["C003", "Marta Kassa", "+251913778899", "marta@gmail.com", "N/A", "12"],
        ["C004", "Yonas Alemu", "+251914556677", "yonas@gmail.com", "Alemu Grain S.C.", "18"],
        ["C005", "Helen Solomon", "+251915998877", "helen@gmail.com", "N/A", "9"],
      ],
    },
    bookings: {
      stats: [
        { label: "Total Dispatched", value: "892 Trips" },
        { label: "Completed Success", value: "98.4%" },
        { label: "Cancelled Dispatches", value: "12 Trips" },
      ],
      headers: ["Booking #", "Customer", "Route Details", "Assigned Driver", "Status", "Fare (ETB)"],
      rows: [
        ["B001", "Almaz Belay", "Addis Ababa → Adama", "Abebe Kebede", "Assigned", "8,500"],
        ["B002", "Bekele Zewde", "Adama → Hawassa", "Meseret Haile", "Running", "14,000"],
        ["B003", "Marta Kassa", "Hawassa → Addis Ababa", "Dawit Tesfaye", "Completed", "9,800"],
        ["B004", "Yonas Alemu", "Bahir Dar → Gondar", "Tigist Alemayehu", "Pending", "11,500"],
        ["B005", "Helen Solomon", "Mekelle → Addis Ababa", "Solomon Girma", "Cancelled", "18,200"],
      ],
    },
    maintenance: {
      stats: [
        { label: "Log Count", value: "64 Incidents" },
        { label: "Total Expenses", value: "324,500 ETB" },
        { label: "Highest Garage bill", value: "15,500 ETB" },
      ],
      headers: ["Roll #", "Vehicle Details", "Maintenance Type", "Garage", "Cost (ETB)", "Date Done"],
      rows: [
        ["M001", "Toyota Hiace (V001)", "Oil & Filter Change", "Sheger Auto Care", "4,500", "2026-07-28"],
        ["M002", "Isuzu Truck (V002)", "Tire Rotation", "Bole Garage", "12,000", "2026-07-30"],
        ["M003", "Mercedes Sprinter (V004)", "Engine Diagnostics", "Bole Garage", "8,500", "2026-07-31"],
        ["M004", "Hino 500 (V003)", "Brake Pad Change", "Adama Repairs", "9,800", "2026-07-25"],
        ["M005", "Mitsubishi Canter (V005)", "Gearbox Service", "Tana Mechanical", "15,500", "2026-07-20"],
      ],
    },
    revenue: {
      stats: [
        { label: "Gross Income", value: "1,245,600 ETB" },
        { label: "Net Profit Margin", value: "34.5%" },
        { label: "Active Revenue", value: "85,400 ETB" },
      ],
      headers: ["Receipt #", "Trip Ref", "Date Paid", "Payer (Shipper)", "Payment Mode", "Total Paid (ETB)"],
      rows: [
        ["R001", "B001", "2026-07-28", "Almaz Trading Plc", "Bank Transfer", "8,500"],
        ["R002", "B002", "2026-07-30", "Bekele Transport Group", "Cash", "14,000"],
        ["R003", "B003", "2026-07-31", "Marta Kassa", "Mobile Money", "9,800"],
        ["R004", "B004", "2026-07-25", "Yonas Alemu", "Bank Transfer", "11,500"],
        ["R005", "B005", "2026-07-20", "Helen Solomon", "Cash", "18,200"],
      ],
    },
  };

  const getReportIcon = (type) => {
    switch (type) {
      case "vehicles":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "drivers":
        return <Users className="w-5 h-5 text-green-500" />;
      case "customers":
        return <Users className="w-5 h-5 text-purple-500" />;
      case "bookings":
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case "maintenance":
        return <Wrench className="w-5 h-5 text-red-500" />;
      default:
        return <DollarSign className="w-5 h-5 text-green-600" />;
    }
  };

  const currentReport = reportDB[activeReport];

  // CSV Exporter
  const exportCSV = () => {
    const headers = currentReport.headers.join(",");
    const rows = currentReport.rows.map((r) => r.join(",")).join("\n");
    const content = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    
    const link = document.createElement("a");
    link.href = encodeURI(content);
    link.download = `ntms_${activeReport}_report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded!");
  };

  // Excel simulated exporter
  const exportExcel = () => {
    // Generate simple tab separated values for Excel compatibility
    const headers = currentReport.headers.join("\t");
    const rows = currentReport.rows.map((r) => r.join("\t")).join("\n");
    const content = "data:application/vnd.ms-excel;charset=utf-8," + headers + "\n" + rows;
    
    const link = document.createElement("a");
    link.href = encodeURI(content);
    link.download = `ntms_${activeReport}_report_${new Date().toISOString().split("T")[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel report exported!");
  };

  // PDF Print preview exporter
  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>NTMS ${activeReport.toUpperCase()} Report</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #333; }
            h2 { color: #1e3a8a; text-transform: uppercase; margin-bottom: 4px; }
            p { font-size: 12px; color: #666; margin-bottom: 24px; }
            .stats-container { display: flex; gap: 16px; margin-bottom: 24px; }
            .stat-card { border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 8px; flex: 1; }
            .stat-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: bold; }
            .stat-value { font-size: 18px; font-weight: bold; margin-top: 4px; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f9fafb; font-weight: bold; color: #4b5563; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <h2>NTMS Administrative ${activeReport} Report</h2>
          <p>Generated on: ${new Date().toLocaleString()} | Date Range: ${startDate || "All"} to ${endDate || "All"}</p>
          
          <div class="stats-container">
            ${currentReport.stats
              .map(
                (s) => `
              <div class="stat-card">
                <div class="stat-label">${s.label}</div>
                <div class="stat-value">${s.value}</div>
              </div>
            `
              )
              .join("")}
          </div>

          <table>
            <thead>
              <tr>
                ${currentReport.headers.map((h) => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${currentReport.rows
                .map(
                  (row) => `
                <tr>
                  ${row.map((val) => `<td>${val}</td>`).join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Analyze, compile and export administrative records of the fleet.
          </p>
        </div>
      </div>

      {/* Tabs and Filters Panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-250 dark:border-gray-800 overflow-x-auto whitespace-nowrap scrollbar-none select-none">
          {Object.keys(reportDB).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveReport(tab)}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeReport === tab
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {getReportIcon(tab)}
              {tab}
            </button>
          ))}
        </div>

        {/* Date Filter & Export Panel */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pt-2">
          {/* Date range picker */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4 text-gray-400" /> Date Range:
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-xl text-xs bg-transparent focus:outline-none text-gray-700 dark:text-gray-300"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-xl text-xs bg-transparent focus:outline-none text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Exporters */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={exportCSV}
              className="px-4 py-2 border border-gray-400 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={exportExcel}
              className="px-4 py-2 border border-gray-400 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {currentReport.stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {stat.label}
              </span>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {stat.value}
              </h4>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-800 rounded-xl">
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Render Data List Grid */}
      <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-250 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white capitalize">
            {activeReport} Database Records
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 dark:bg-gray-900/50 border-b border-gray-250 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase select-none">
                {currentReport.headers.map((h, i) => (
                  <th key={i} className="py-4 px-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-250 dark:divide-gray-800 text-sm">
              {currentReport.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                  {row.map((cell, i) => {
                    const isStatus = currentReport.headers[i]?.toLowerCase().includes("status");
                    
                    return (
                      <td key={i} className={`py-4 px-6 ${i === 0 ? "font-semibold text-gray-900 dark:text-white" : "text-gray-650 dark:text-gray-400"}`}>
                        {isStatus ? (
                          <Badge variant={cell.toLowerCase() === "active" || cell.toLowerCase() === "completed" || cell.toLowerCase() === "assigned" ? "success" : cell.toLowerCase() === "maintenance" || cell.toLowerCase() === "pending" || cell.toLowerCase() === "running" ? "warning" : "error"}>
                            {cell}
                          </Badge>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
export { Reports };
