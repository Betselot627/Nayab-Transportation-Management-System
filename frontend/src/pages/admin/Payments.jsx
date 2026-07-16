import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Download,
} from "lucide-react";
import { paymentService } from "../../services/paymentService";
import toast from "react-hot-toast";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await paymentService.getAllPayments();
      setPayments(data);
    } catch (error) {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    if (filter === "all") return true;
    return payment.status === filter;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      refunded: "bg-blue-100 text-blue-700",
    };
    return colors[status] || colors.pending;
  };

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Payment Management
        </h1>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
          <DollarSign className="w-8 h-8 mb-2" />
          <p className="text-sm">Total Revenue</p>
          <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <CheckCircle className="w-8 h-8 mb-2" />
          <p className="text-sm">Completed</p>
          <p className="text-3xl font-bold">
            {payments.filter((p) => p.status === "completed").length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl text-white">
          <Clock className="w-8 h-8 mb-2" />
          <p className="text-sm">Pending</p>
          <p className="text-3xl font-bold">
            {payments.filter((p) => p.status === "pending").length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl text-white">
          <XCircle className="w-8 h-8 mb-2" />
          <p className="text-sm">Failed</p>
          <p className="text-3xl font-bold">
            {payments.filter((p) => p.status === "failed").length}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "completed", "failed", "refunded"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium ${filter === status ? "bg-amber-500 text-white" : "bg-white text-slate-700 border border-slate-300 hover:border-amber-500"}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredPayments.map((payment) => (
              <tr key={payment._id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-mono text-slate-600">
                  #{payment._id.slice(-6)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  {payment.customer?.name || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                  ${payment.amount?.toFixed(2) || "0.00"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {payment.paymentMethod || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(payment.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}
                  >
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Invoice
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
