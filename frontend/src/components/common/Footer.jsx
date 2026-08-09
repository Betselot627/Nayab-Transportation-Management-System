import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Truck,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Globe,
  Clock,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const location = useLocation();

  const handleScrollToSection = (sectionId) => {
    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="mt-auto bg-slate-950 text-slate-400 border-t border-slate-900 font-sans transition-colors">
      {/* Main Footer Links */}
      <div className="container mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Identity & Overview */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-extrabold text-white tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                <Truck className="w-4 h-4" />
              </div>
              <span>NTMS<span className="text-purple-500">.</span></span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Nayab Transportation Management System (NTMS) by Nayab Trading PLC. Streamlining cargo delivery, fleet optimization, and digital settlements across Ethiopia.
            </p>
            <div className="pt-1 flex items-center gap-3 text-slate-400 text-xs">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Chapa Verified
              </span>
              <span className="inline-flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Ethiopia Wide
              </span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-purple-500 pl-2">
              Platform & Features
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <button
                  onClick={() => handleScrollToSection("services")}
                  className="hover:text-purple-400 transition-colors bg-transparent border-0 p-0 text-left cursor-pointer"
                >
                  Our Services
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleScrollToSection("features")}
                  className="hover:text-purple-400 transition-colors bg-transparent border-0 p-0 text-left cursor-pointer"
                >
                  System Features
                </button>
              </li>
              <li>
                <Link to="/about" className="hover:text-purple-400 transition-colors">
                  About Us & Mission
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Access / Portal Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-purple-500 pl-2">
              Portals & Tracking
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/login" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                  <span>User Login / Portal</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-purple-400 transition-colors">
                  Create Customer Account
                </Link>
              </li>
              <li>
                <Link to="/customer/track-shipment" className="hover:text-purple-400 transition-colors">
                  Live GPS Track Shipment
                </Link>
              </li>
              <li>
                <Link to="/customer/book-shipment" className="hover:text-purple-400 transition-colors">
                  Book Cargo Shipment
                </Link>
              </li>
              <li>
                <Link to="/customer/payments" className="hover:text-purple-400 transition-colors">
                  Payment History & Receipts
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-purple-500 pl-2">
              Contact & Support
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>Bole Sub-City, Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                <a href="tel:+251116620000" className="hover:text-white transition">
                  +251 11 662 0000
                </a>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <a href="mailto:support@nayabtrading.com" className="hover:text-white transition">
                  support@nayabtrading.com
                </a>
              </li>
              <li className="pt-1">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-lg text-xs font-bold transition border border-purple-500/30"
                >
                  <span>Open Contact Form</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-900 bg-slate-950/70 py-6">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {currentYear} Nayab Trading PLC. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="hover:text-slate-300 transition">
              About NTMS
            </Link>
            <Link to="/contact" className="hover:text-slate-300 transition">
              Support
            </Link>
            <Link to="/customer/track-shipment" className="hover:text-slate-300 transition">
              Track Cargo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;