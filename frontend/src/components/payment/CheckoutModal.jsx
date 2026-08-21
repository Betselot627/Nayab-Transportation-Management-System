import React, { useState, useEffect } from "react";
import {
  X,
  Smartphone,
  CreditCard,
  Lock,
  ArrowRight,
  ShieldCheck,
  LoaderCircle as Loader2,
  Phone,
  CircleAlert as AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { paymentService } from "../../services/paymentService";
import toast from "react-hot-toast";

const CheckoutModal = ({ isOpen, onClose, shipment }) => {
  const [step, setStep] = useState("selection"); // selection, phone, pin, processing
  const [selectedMethod, setSelectedMethod] = useState(null); // telebirr, cbe_birr, chapa
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval;
    if (step === "pin" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setStep("phone");
      setTimer(60);
      toast.error("USSD session expired. Please request again.");
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen || !shipment) return null;

  const finalAmount =
    shipment.finalPrice ||
    shipment.pricing?.totalAmount ||
    shipment.pricing?.baseAmount ||
    2500;

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    if (method === "chapa") {
      // Direct call for Chapa Checkout
      handleChapaSubmit();
    } else {
      setStep("phone");
    }
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/\s+/g, "");
    if (!/^(?:\+251|0)?[79]\d{8}$/.test(cleanPhone)) {
      toast.error("Please enter a valid Ethiopian phone number (e.g., 0912345678 or 0712345678)");
      return;
    }
    setStep("pin");
    setTimer(60);
  };

  const handlePinChange = (index, value) => {
    if (isNaN(value)) return;
    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1);
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newPin = [...pin];
        newPin[index - 1] = "";
        setPin(newPin);
      }
    }
  };

  const handleChapaSubmit = async () => {
    try {
      setLoading(true);
      setStep("processing");
      const res = await paymentService.initializePayment(shipment._id, "Chapa", false);
      if (res && res.checkoutUrl) {
        toast.success("Redirecting to secure gateway...");
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error("Invalid response from payment server");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to initialize Chapa gateway");
      setStep("selection");
      setLoading(false);
    }
  };

  const handleDirectPaymentSubmit = async () => {
    const pinCode = pin.join("");
    if (pinCode.length < 4) {
      toast.error("Please enter your 4-digit mobile wallet PIN");
      return;
    }

    try {
      setLoading(true);
      setStep("processing");

      // 1. Initialize simulated payment in backend
      const initRes = await paymentService.initializePayment(
        shipment._id,
        selectedMethod,
        true // force simulation
      );

      if (initRes && initRes.txRef) {
        // 2. Call verify immediately in the backend to approve the simulated transaction
        const verifyRes = await paymentService.verifyPayment(initRes.txRef);

        if (verifyRes && verifyRes.success) {
          toast.success("Payment completed successfully!");
          // Redirect to success page which will confirm and fetch receipt
          window.location.href = `/payment/success?tx_ref=${initRes.txRef}`;
        } else {
          throw new Error(verifyRes.message || "Simulated payment verification failed");
        }
      } else {
        throw new Error("Simulated payment initialization failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Payment process failed. Please try again.");
      setStep("phone");
      setLoading(false);
      setPin(["", "", "", ""]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-hidden z-10 text-slate-800 dark:text-slate-100 transition-colors"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-full border border-purple-200/50 dark:border-purple-800/40">
              Secure NTMS Checkout
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3">
              Payment Checkout
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Shipment Ref: <span className="font-mono font-bold">{shipment.shipmentNumber}</span>
            </p>
          </div>

          {/* Shipment Price Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-center mb-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Payment Due
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {shipment.pickupLocation?.city} to {shipment.destination?.city}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                {Number(finalAmount).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 ml-1">ETB</span>
            </div>
          </div>

          {/* Dynamic Steps */}
          {step === "selection" && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Choose Payment Method
              </p>

              {/* Telebirr Option */}
              <button
                onClick={() => handleMethodSelect("telebirr")}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 bg-white dark:bg-slate-900 hover:bg-sky-55/20 dark:hover:bg-sky-950/10 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20 font-black text-xs font-mono uppercase tracking-tighter">
                    Tele
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                      Telebirr
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pay instantly with Telebirr Mobile wallet
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition group-hover:translate-x-1" />
              </button>

              {/* CBE Birr Option */}
              <button
                onClick={() => handleMethodSelect("cbe_birr")}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 bg-white dark:bg-slate-900 hover:bg-purple-55/20 dark:hover:bg-purple-950/10 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-700 text-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-700/20 font-black text-[10px] font-mono leading-none flex-col">
                    <span className="text-amber-500">CBE</span>
                    <span>BIRR</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                      CBE Birr
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pay securely via Commercial Bank of Ethiopia
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition group-hover:translate-x-1" />
              </button>

              {/* Chapa Card Gateway */}
              <button
                onClick={() => handleMethodSelect("chapa")}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-900 hover:bg-emerald-55/20 dark:hover:bg-emerald-950/10 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      Chapa Gateway (Card/Other)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Visa, Mastercard, & Bank Redirect
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition group-hover:translate-x-1" />
              </button>

              <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                PCI-DSS Compliant Encryption
              </div>
            </div>
          )}

          {step === "phone" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <button
                onClick={() => setStep("selection")}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                â† Back to payment methods
              </button>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white capitalize">
                  Pay with {selectedMethod === "telebirr" ? "Telebirr" : "CBE Birr"}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Enter the phone number associated with your mobile wallet below.
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                      +251
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9XXXXXXXX or 7XXXXXXXX"
                      maxLength={12}
                      className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 dark:focus:border-purple-500 transition"
                      required
                      autoFocus
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Supported: Telebirr (+251 9/7...) and CBE Birr account.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Initiate Push Payment
                </button>
              </form>
            </motion.div>
          )}

          {step === "pin" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5 text-center"
            >
              <div className="text-left">
                <button
                  onClick={() => setStep("phone")}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  â† Back to phone input
                </button>
              </div>

              <div>
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-purple-200/50 dark:border-purple-800/40">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Authorize payment on device
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[280px] mx-auto">
                  A USSD notification push has been sent to your phone. Enter your pin code below to authenticate.
                </p>
              </div>

              {/* Demo Helper box */}
              <div className="bg-sky-50 dark:bg-slate-800 border border-sky-100 dark:border-slate-850 rounded-xl p-3 text-left">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-sky-800 dark:text-sky-400 uppercase tracking-wide">
                      Simulation Mode Active
                    </p>
                    <p className="text-[11px] text-sky-900/80 dark:text-slate-300 mt-0.5">
                      Since this is a simulated sandbox gateway, enter any mock PIN code (e.g. <strong className="font-mono">1234</strong>) to authorize.
                    </p>
                  </div>
                </div>
              </div>

              {/* OTP pin input blocks */}
              <div className="flex justify-center gap-3.5 my-4">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`pin-input-${idx}`}
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-12 text-center text-lg font-black border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-600 dark:focus:border-purple-500 transition font-mono"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {/* Resend and timer */}
              <div className="text-xs text-slate-400 flex justify-between items-center py-1">
                <span>Verification OTP session:</span>
                <span className="font-bold font-mono text-purple-600 dark:text-purple-400">
                  {timer}s
                </span>
              </div>

              <button
                onClick={handleDirectPaymentSubmit}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Authorize & Pay
              </button>
            </motion.div>
          )}

          {step === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin" />
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Verifying Payment...
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                  Please hold on. We are securely validating your transaction with the provider database.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CheckoutModal;
