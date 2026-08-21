import React, { useRef } from "react";
import { X, Printer, Download, CircleCheck as CheckCircle, ShieldCheck, Truck, Package, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ReceiptModal = ({ isOpen, onClose, receipt }) => {
  const receiptRef = useRef(null);

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Open a formatted print-friendly window for quick PDF saving
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.receiptNumber || receipt.transactionReference}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .receipt-box { max-width: 650px; margin: auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 32px; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 24px; }
            .logo { font-size: 20px; font-weight: 800; color: #7e22ce; letter-spacing: 1px; }
            .sub { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 2px; }
            .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
            .label { color: #64748b; }
            .val { font-weight: 600; color: #0f172a; text-align: right; }
            .paid-badge { display: inline-block; background: #ecfdf5; color: #047857; font-weight: 800; padding: 4px 12px; border-radius: 9999px; border: 1px solid #a7f3d0; font-size: 12px; }
            .total-box { background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 20px; border: 1px solid #e2e8f0; }
            .total-amount { font-size: 22px; font-weight: 800; color: #7e22ce; }
            .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <div class="receipt-box">
            <div class="header">
              <div class="logo">NAYAB TRADING PLC</div>
              <div class="sub">Transportation Management System (NTMS)</div>
              <p style="font-size: 12px; color: #64748b; margin: 6px 0 0 0;">Official Payment Receipt</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <div class="row">
                <span class="label">Receipt Number:</span>
                <span class="val" style="font-family: monospace; font-weight: 700;">${receipt.receiptNumber || "N/A"}</span>
              </div>
              <div class="row">
                <span class="label">Transaction Reference:</span>
                <span class="val" style="font-family: monospace;">${receipt.transactionReference || "N/A"}</span>
              </div>
              <div class="row">
                <span class="label">Payment Date:</span>
                <span class="val">${new Date(receipt.paymentDate || Date.now()).toLocaleString()}</span>
              </div>
              <div class="row">
                <span class="label">Status:</span>
                <span class="val"><span class="paid-badge">PAID</span></span>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div class="section-title">Customer Information</div>
              <div class="row">
                <span class="label">Name:</span>
                <span class="val">${receipt.customer?.name || "Customer"}</span>
              </div>
              <div class="row">
                <span class="label">Email / Contact:</span>
                <span class="val">${receipt.customer?.email || ""} ${receipt.customer?.phone ? `(${receipt.customer.phone})` : ""}</span>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <div class="section-title">Shipment Details</div>
              <div class="row">
                <span class="label">Shipment Number:</span>
                <span class="val" style="font-family: monospace;">${receipt.shipment?.shipmentNumber || "N/A"}</span>
              </div>
              <div class="row">
                <span class="label">Route:</span>
                <span class="val">${receipt.shipment?.pickupCity || receipt.shipment?.pickup} â†’ ${receipt.shipment?.destinationCity || receipt.shipment?.destination}</span>
              </div>
              <div class="row">
                <span class="label">Cargo & Weight:</span>
                <span class="val">${receipt.shipment?.cargoType || "Standard"} (${receipt.shipment?.weight || "N/A"})</span>
              </div>
            </div>

            <div class="total-box">
              <div class="row" style="align-items: center; margin-bottom: 0;">
                <div>
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b;">Total Amount Paid</div>
                  <div style="font-size: 11px; color: #64748b;">Method: ${receipt.payment?.paymentMethod || "Chapa"}</div>
                </div>
                <div class="total-amount">${Number(receipt.payment?.amount || 0).toLocaleString()} ${receipt.payment?.currency || "ETB"}</div>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing Nayab Trading PLC for your cargo transportation.</p>
              <p>For inquiries: finance@nayabtrading.com | +251 11 662 0000</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Receipt Printable Container */}
          <div ref={receiptRef} className="space-y-6 print:p-0">
            {/* Header / Brand */}
            <div className="text-center space-y-1 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold tracking-tight text-lg">
                <Truck className="w-5 h-5" />
                NAYAB TRADING PLC
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Transportation Management System
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold rounded-full border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5" />
                  PAYMENT RECEIPT (PAID)
                </span>
              </div>
            </div>

            {/* Receipt Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Receipt Number</p>
                <p className="font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {receipt.receiptNumber || "RCPT-PENDING"}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Transaction Ref</p>
                <p className="font-bold text-slate-900 dark:text-white font-mono truncate mt-0.5" title={receipt.transactionReference}>
                  {receipt.transactionReference}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Payment Date</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                  {new Date(receipt.paymentDate || Date.now()).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Payment Method</p>
                <p className="font-semibold text-slate-700 dark:text-slate-300 capitalize mt-0.5">
                  {receipt.payment?.paymentMethod || "Chapa"}
                </p>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-1.5 text-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</p>
              <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                <span className="text-slate-500 dark:text-slate-400">Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{receipt.customer?.name || "Customer"}</span>
              </div>
              {receipt.customer?.email && (
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                  <span className="text-slate-500 dark:text-slate-400">Email:</span>
                  <span className="font-mono">{receipt.customer?.email}</span>
                </div>
              )}
            </div>

            {/* Shipment Route & Cargo */}
            <div className="space-y-1.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shipment Summary</p>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Shipment #:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{receipt.shipment?.shipmentNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Delivery Route:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {receipt.shipment?.pickupCity || receipt.shipment?.pickup} â†’ {receipt.shipment?.destinationCity || receipt.shipment?.destination}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Cargo Specification:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {receipt.shipment?.cargoType} ({receipt.shipment?.weight})
                </span>
              </div>
            </div>

            {/* Amount Banner */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Total Paid
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tax & handling included</p>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 dark:text-purple-400 tracking-tight font-mono">
                {Number(receipt.payment?.amount || 0).toLocaleString()} {receipt.payment?.currency || "ETB"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReceiptModal;
