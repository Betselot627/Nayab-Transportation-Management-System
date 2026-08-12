import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  FileText,
  Search,
  Loader,
  CreditCard,
  Building2,
  TrendingUp,
} from "lucide-react";
import { paymentService } from "../../services/paymentService";
import ReceiptModal from "../../components/payment/ReceiptModal";
import toast, { Toaster } from "react-hot-toast";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
  });
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchPayments(false);
  }, [filter]);

  const fetchPayments = async (force = false) => {
    try {
      if (payments.length === 0) setLoading(true);
      const params = {};
      if (filter !== "all") params.status = filter;
      if (searchTerm) params.search = searchTerm;

      const res = await paymentService.getAllPayments(params, { force, ttl: 30000 });
      if (res && res.data) {
        setPayments(res.data);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleOpenReceipt = async (txRef) => {
    try {
      const res = await paymentService.getReceipt(txRef);
      if (res && res.data) {
        setSelectedReceipt(res.data);
        setIsReceiptOpen(true);
      } else {
        toast.error("Receipt details not found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load receipt");
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "PAID") {
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    if (s === "PENDING") {
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
    if (s === "FAILED") {
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
    if (s === "CANCELLED") {
      return "bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/20";
    }
    return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20";
  };

  return (
    <div className="space-y-6 p-1 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial & Payment Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time Chapa revenue, transactions, receipts, and customer settlements.
          </p>
        </div>
      </div>

      {/* Financial Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-5 rounded-2xl text-white shadow-lg shadow-purple-600/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-200">Total Revenue</span>
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
            {Number(stats.totalRevenue || 0).toLocaleString()} <span className="text-sm font-sans font-normal text-purple-200">ETB</span>
          </p>
          <p className="text-[11px] text-purple-200">Settled through Chapa Gateway</p>
        </div>

        {/* Successful Payments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paid Transactions</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {stats.paidCount || payments.filter((p) => (p.status || "").toUpperCase() === "PAID").length}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Verified & Receipts Issued</p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Invoices</span>
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {stats.pendingCount || payments.filter((p) => (p.status || "").toUpperCase() === "PENDING").length}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Awaiting Customer Payment</p>
        </div>

        {/* Failed / Cancelled */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed / Cancelled</span>
            <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {stats.failedCount || payments.filter((p) => (p.status || "").toUpperCase() === "FAILED").length}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Unsuccessful Checkout Attempts</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-stretch justify-between transition-colors">
        <form onSubmit={handleSearch} className="flex-1 relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by TxRef, Receipt #, or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {["all", "PAID", "PENDING", "FAILED", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                filter === status
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {status === "all" ? "All Payments" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 p-6">
            <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Payment Records Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              There are no transactions recorded matching the selected filter or search term.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Transaction Ref</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Shipment</th>
                  <th className="px-5 py-3.5">Amount (ETB)</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Receipt / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => {
                  const isPaid = (p.status || "").toUpperCase() === "PAID";

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {p.txRef}
                        {p.receiptNumber && (
                          <span className="block text-[10px] font-mono text-purple-600 dark:text-purple-400 font-normal">
                            Receipt: {p.receiptNumber}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {p.customerDetails?.name || p.customerId?.companyName || p.paidBy?.name || "Customer"}
                        </span>
                        {p.customerDetails?.email && (
                          <span className="block text-[11px] text-slate-400 font-mono">
                            {p.customerDetails.email}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {p.shipmentId?.shipmentNumber || "N/A"}
                        </span>
                        {p.shipmentId?.pickupLocation?.city && (
                          <span className="block text-[11px] text-slate-400">
                            {p.shipmentId.pickupLocation.city} → {p.shipmentId.destination?.city}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                        {Number(p.amount || 0).toLocaleString()} {p.currency || "ETB"}
                      </td>

                      <td className="px-5 py-4 capitalize font-semibold text-slate-700 dark:text-slate-300">
                        {p.paymentMethod || "Chapa"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize border ${getStatusBadge(
                            p.status
                          )}`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {isPaid ? (
                          <button
                            onClick={() => handleOpenReceipt(p.txRef)}
                            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-xl font-bold flex items-center gap-1.5 border border-purple-200 dark:border-purple-800/40 transition cursor-pointer text-xs ml-auto"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unsettled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
