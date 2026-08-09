import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import {
  Truck,
  MapPin,
  Users,
  ShieldCheck,
  Clock,
  BarChart3,
  PackageCheck,
  Route,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vehiclesManaged: "500+",
    registeredDrivers: "200+",
    completedShipments: "10K+",
    activeRoutes: "50+",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authService.getPublicStats();
        if (res && res.success && res.data) {
          setStats({
            vehiclesManaged: String(res.data.vehiclesManaged),
            registeredDrivers: String(res.data.registeredDrivers),
            completedShipments: String(res.data.completedShipments),
            activeRoutes: String(res.data.activeRoutes),
          });
        }
      } catch (err) {
        console.warn("Failed to fetch real-time public stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-gray-100 font-sans antialiased overflow-x-hidden transition-colors duration-200">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .anim-fade-up {
          opacity: 0;
          animation: fadeInUp 0.7s ease-out forwards;
        }
        .anim-fade {
          opacity: 0;
          animation: fadeIn 0.9s ease-out forwards;
        }
        .anim-scale {
          opacity: 0;
          animation: scaleIn 0.7s ease-out forwards;
        }
        .anim-float {
          animation: float 5s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="container mx-auto px-6 py-20 lg:py-32">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Left Content */}
            <div className="space-y-6 text-center md:text-left">
              <span className="anim-fade-up inline-block text-xs font-semibold tracking-widest text-amber-400 uppercase">
                Enterprise Transportation Platform
              </span>
              <h1 className="anim-fade-up delay-100 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Smart Transportation
                <span className="block text-slate-300 mt-1">Management</span>
              </h1>
              <p className="anim-fade-up delay-200 max-w-xl text-lg text-slate-400 leading-relaxed mx-auto md:mx-0">
                Nayab Transportation Management System helps businesses manage
                vehicles, drivers, shipments, and deliveries efficiently through
                one powerful, unified digital platform.
              </p>
              <div className="anim-fade-up delay-300 flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                <button
                  onClick={() => navigate("/login")}
                  className="bg-amber-500 text-slate-950 px-8 py-3.5 rounded-lg font-semibold shadow-lg shadow-amber-900/20 hover:bg-amber-400 hover:scale-105 active:scale-95 transition duration-200 cursor-pointer"
                >
                  Book Shipment
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="border border-slate-700 bg-white/5 backdrop-blur-sm text-white px-8 py-3.5 rounded-lg font-medium hover:bg-white/10 hover:scale-105 active:scale-95 transition duration-200 cursor-pointer"
                >
                  Track Delivery
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex justify-center anim-scale delay-200">
              <div className="anim-float relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=900&q=80"
                  alt="Fleet of transportation trucks parked in a logistics yard"
                  className="w-full h-80 sm:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-white">
                    Live Fleet Overview
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 -mt-8 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl border border-slate-100 dark:border-gray-800 transition-colors">
            <div className="anim-fade-up delay-100">
              <StatCard
                icon={<Truck />}
                number={stats.vehiclesManaged}
                text="Vehicles Managed"
              />
            </div>
            <div className="anim-fade-up delay-200">
              <StatCard
                icon={<Users />}
                number={stats.registeredDrivers}
                text="Registered Drivers"
              />
            </div>
            <div className="anim-fade-up delay-300">
              <StatCard
                icon={<PackageCheck />}
                number={stats.completedShipments}
                text="Completed Shipments"
              />
            </div>
            <div className="anim-fade-up delay-400">
              <StatCard icon={<Route />} number={stats.activeRoutes} text="Active Routes" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-slate-50 dark:bg-gray-950 transition-colors scroll-mt-12">
        <div className="container mx-auto px-6">
          <div className="anim-fade-up max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Our Transportation Services
            </h2>
            <p className="text-lg text-slate-600 dark:text-gray-400 mt-4">
              Complete solutions designed to streamline modern logistics and
              fleet operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="anim-fade-up delay-100">
              <ServiceCard
                icon={<Truck />}
                title="Fleet Management"
                description="Manage vehicles, availability, maintenance logs, and performance from a single centralized dashboard."
                onClick={() => navigate("/login")}
              />
            </div>
            <div className="anim-fade-up delay-200">
              <ServiceCard
                icon={<MapPin />}
                title="Shipment Tracking"
                description="Monitor precise delivery locations and track active transportation routes accurately in real time."
                onClick={() => navigate("/login")}
              />
            </div>
            <div className="anim-fade-up delay-300">
              <ServiceCard
                icon={<BarChart3 />}
                title="Reports & Analytics"
                description="Generate detailed operations reports and make smarter business decisions based on real data."
                onClick={() => navigate("/login")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us / Features Section */}
      <section id="features" className="bg-slate-950 text-white py-24 scroll-mt-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Info Side */}
            <div className="anim-fade-up space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Why Choose NTMS?
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Our platform eliminates manual paperwork, optimizes team
                  communication, and hands transportation providers absolute
                  control over their dynamic assets.
                </p>
              </div>

              <div className="space-y-5">
                <Feature
                  icon={<ShieldCheck />}
                  text="Secure and reliable enterprise-grade operations"
                />
                <Feature
                  icon={<Clock />}
                  text="Save valuable hours with fully automated workflows"
                />
                <Feature
                  icon={<BarChart3 />}
                  text="Deep analytical tools for performance tracking"
                />
              </div>
            </div>

            {/* CTA Card */}
            <div className="anim-fade-up delay-200 bg-slate-900 rounded-2xl p-8 lg:p-12 shadow-xl border border-slate-800 space-y-6">
              <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
                Ready to optimize your transportation ecosystem?
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Join NTMS today to transition your logistics architecture to the
                cloud and boost efficiency.
              </p>
              <button
                onClick={() => navigate("/register")}
                className="w-full sm:w-auto bg-amber-500 text-slate-950 px-8 py-3.5 rounded-lg font-semibold shadow hover:bg-amber-400 hover:scale-105 active:scale-95 transition duration-200 cursor-pointer"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Sub-components

const StatCard = ({ icon, number, text }) => (
  <div className="flex flex-col items-center text-center p-4">
    <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 w-12 h-12 rounded-xl mb-4">
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </div>
    <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
      {number}
    </span>
    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{text}</span>
  </div>
);

const ServiceCard = ({ icon, title, description, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-slate-200/60 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300 cursor-pointer"
  >
    <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 w-14 h-14 rounded-xl mb-5">
      {React.cloneElement(icon, { className: "w-7 h-7" })}
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
    <p className="text-slate-600 dark:text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const Feature = ({ icon, text }) => (
  <div className="flex items-start gap-4">
    <div className="flex items-center justify-center text-amber-400 bg-amber-500/10 w-10 h-10 rounded-lg flex-shrink-0">
      {React.cloneElement(icon, { className: "w-5 h-5" })}
    </div>
    <p className="text-slate-300 leading-relaxed pt-1.5">{text}</p>
  </div>
);

export default Home;
