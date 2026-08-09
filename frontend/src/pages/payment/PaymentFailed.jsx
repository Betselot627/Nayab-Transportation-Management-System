import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref");
  const reason = searchParams.get("reason") || "Your payment could not be confirmed or was cancelled.";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 max-w-md w-full text-center space-y-6 shadow-2xl transition-colors"
      >
        <div className="w-20 h-20 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-rose-500/20">
          <XCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
            Payment Unsuccessful
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3 tracking-tight">
            Payment Failed
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {reason}
          </p>
        </div>

        {txRef && (
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 py-2 px-3 rounded-xl border border-slate-100 dark:border-slate-800 truncate">
            Ref: {txRef}
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Link
            to="/customer/my-bookings"
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <ShoppingBag className="w-4 h-4" />
            Return to Bookings & Try Again
          </Link>

          <Link
            to="/customer/payments"
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Payment History
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentFailed;
