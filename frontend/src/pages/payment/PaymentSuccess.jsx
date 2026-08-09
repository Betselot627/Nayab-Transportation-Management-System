import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader, ArrowRight, FileText, ShoppingBag, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { paymentService } from "../../services/paymentService";
import ReceiptModal from "../../components/payment/ReceiptModal";
import toast, { Toaster } from "react-hot-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [verificationData, setVerificationData] = useState(null);
  const [error, setError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref");

  useEffect(() => {
    if (!txRef) {
      setError("No transaction reference found in return URL.");
      setLoading(false);
      return;
    }

    verifyPayment();
  }, [txRef]);

  const verifyPayment = async () => {
    try {
      setLoading(true);
      const res = await paymentService.verifyPayment(txRef);
      if (res && res.success) {
        setVerificationData(res.data);
        toast.success("Payment verified successfully!");
        
        // Auto-fetch receipt
        try {
          const receiptRes = await paymentService.getReceipt(txRef);
          if (receiptRes && receiptRes.data) {
            setReceiptData(receiptRes.data);
          }
        } catch (receiptErr) {
          console.error("Could not fetch receipt details:", receiptErr);
        }
      } else {
        setError(res.message || "Payment could not be verified.");
      }
    } catch (err) {
      console.error("Payment Verification Error:", err);
      setError(err?.response?.data?.message || "Failed to verify transaction with Chapa.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async () => {
    if (!receiptData && txRef) {
      try {
        const receiptRes = await paymentService.getReceipt(txRef);
        if (receiptRes && receiptRes.data) {
          setReceiptData(receiptRes.data);
        }
      } catch (err) {
        toast.error("Failed to load receipt");
        return;
      }
    }
    setIsReceiptOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl"
        >
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto">
            <Loader className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verifying Payment with Chapa...</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please wait while we confirm your transaction securely with the bank gateway.
          </p>
          <div className="font-mono text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 py-1.5 px-3 rounded-lg">
            Ref: {txRef}
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <Toaster position="top-right" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-xl"
        >
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Payment Unconfirmed</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{error}</p>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={verifyPayment}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-500/20 cursor-pointer"
            >
              Retry Verification
            </button>
            <Link
              to="/customer/my-bookings"
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition text-center"
            >
              Return to My Bookings
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <Toaster position="top-right" />
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receiptData}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center space-y-6 shadow-2xl transition-colors"
      >
        {/* Animated Check Icon */}
        <div className="w-20 h-20 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-emerald-500/20">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Payment Completed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your cargo transportation payment has been verified and confirmed.
          </p>
        </div>

        {/* Transaction Info Box */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-left space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Amount Paid:</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-base font-mono text-purple-600 dark:text-purple-400">
              {Number(verificationData?.amount || 0).toLocaleString()} {verificationData?.currency || "ETB"}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Transaction Reference:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-[200px]" title={txRef}>
              {txRef}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Payment Gateway:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Chapa ({verificationData?.paymentMethod || "Telebirr / Card"})
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Payment Status:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
              PAID
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleOpenReceipt}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            View Official Receipt
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/customer/my-bookings"
              className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              My Bookings
            </Link>

            <Link
              to="/customer/payments"
              className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              Payment History
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
