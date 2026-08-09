import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Loader,
  ArrowUpRight,
  Search,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { paymentService } from "../../services/paymentService";
import ReceiptModal from "../../components/payment/ReceiptModal";
import toast, { Toaster } from "react-hot-toast";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [initializingId, setInitializingId] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getMyPayments();
      if (res && res.data) {
        setPayments(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (shipmentId) => {
    try {
      setInitializingId(shipmentId);
      const res = await paymentService.initializePayment(shipmentId);
      if (res && res.checkoutUrl) {
        toast.success("Redirecting to Chapa checkout...");
        window.location.href = res.checkoutUrl;
      } else {
        toast.error("Failed to retrieve checkout URL");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to initialize payment");
    } finally {
      setInitializingId(null);
    }
  };

  const handleOpenReceipt = async (txRef) => {
    try {
      const res = await paymentService.getReceipt(txRef);
      if (res && res.data) {
        setSelectedReceipt(res.data);
        setIsReceiptOpen(true);
      } else {
        toast.error("Receipt data not found");
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
    return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20";
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.txRef || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.receiptNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.shipmentId?.shipmentNumber || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || (p.status || "").toUpperCase() === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-1 max-w-6xl mx-auto">
      <Toaster position="top-right" />
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Payment History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View all your transportation transactions, receipts, and pending invoices.
          </p>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between transition-colors">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by TxRef or Shipment #..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {["ALL", "PAID", "PENDING", "FAILED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                filterStatus === status
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                  : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table / Card List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-16 p-6">
            <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Transactions Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              You do not have any payments matching your active search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Transaction Ref</th>
                  <th className="px-5 py-3.5">Shipment</th>
                  <th className="px-5 py-3.5">Amount (ETB)</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => {
                  const isPaid = (p.status || "").toUpperCase() === "PAID";
                  const isPending = (p.status || "").toUpperCase() === "PENDING";
                  const shipmentId = p.shipmentId?._id || p.shipmentId;

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
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {p.shipmentId?.shipmentNumber || "N/A"}
                        </span>
                        {p.shipmentId?.pickupLocation?.city && (
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                            {p.shipmentId.pickupLocation.city} → {p.shipmentId.destination?.city}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                        {Number(p.amount || 0).toLocaleString()} {p.currency || "ETB"}
                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300 capitalize font-medium">
                        {p.paymentMethod || "Chapa"}
                      </td>

                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
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

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPaid ? (
                            <button
                              onClick={() => handleOpenReceipt(p.txRef)}
                              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-xl font-bold flex items-center gap-1 border border-purple-200 dark:border-purple-800/40 transition cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Receipt
                            </button>
                          ) : isPending ? (
                            <button
                              onClick={() => handlePayNow(shipmentId)}
                              disabled={initializingId === shipmentId}
                              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-xs transition cursor-pointer disabled:opacity-50"
                            >
                              {initializingId === shipmentId ? (
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <span>Pay Now</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          ) : null}

                          {shipmentId && (
                            <Link
                              to={`/customer/shipment-details/${shipmentId}`}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="View Shipment"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
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

export default PaymentHistory;
