import React from "react";
import {
  Truck,
  MapPin,
  Users,
  ShieldCheck,
  Clock,
  BarChart3,
  PackageCheck,
  Route
} from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-white">
        <div className="container mx-auto px-6 py-20 lg:py-32">
          <div className="grid items-center gap-12 md:grid-cols-2">
            
            {/* Left Content */}
            <div className="space-y-6 text-center md:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Smart Transportation 
                <span className="block text-blue-400 mt-1">Management</span>
              </h1>
              <p className="max-w-xl text-lg text-slate-300 leading-relaxed mx-auto md:mx-0">
                Nayab Transportation Management System helps businesses manage vehicles, 
                drivers, shipments, and deliveries efficiently through one powerful, unified digital platform.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                <button className="bg-blue-600 text-white px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-blue-900/30 hover:bg-blue-500 transition duration-200">
                  Book Shipment
                </button>
                <button className="border border-slate-500 bg-white/5 backdrop-blur-sm text-white px-8 py-3.5 rounded-lg font-medium hover:bg-white/10 transition duration-200">
                  Track Delivery
                </button>
              </div>
            </div>

            {/* Right Graphic */}
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-12 shadow-2xl border border-white/10 w-72 h-72 sm:w-80 sm:h-80">
                <Truck className="w-40 h-40 text-blue-300 drop-shadow-md" strokeWidth={1.2} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 -mt-8 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
            <StatCard icon={<Truck />} number="500+" text="Vehicles Managed" />
            <StatCard icon={<Users />} number="200+" text="Registered Drivers" />
            <StatCard icon={<PackageCheck />} number="10K+" text="Completed Shipments" />
            <StatCard icon={<Route />} number="50+" text="Active Routes" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Our Transportation Services
            </h2>
            <p className="text-lg text-slate-600 mt-4">
              Complete solutions designed to streamline modern logistics and fleet operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={<Truck />}
              title="Fleet Management"
              description="Manage vehicles, availability, maintenance logs, and performance from a single centralized dashboard."
            />
            <ServiceCard
              icon={<MapPin />}
              title="Shipment Tracking"
              description="Monitor precise delivery locations and track active transportation routes accurately in real time."
            />
            <ServiceCard
              icon={<BarChart3 />}
              title="Reports & Analytics"
              description="Generate detailed operations reports and make smarter business decisions based on real data."
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-slate-950 text-white py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            
            {/* Info Side */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Why Choose NTMS?
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Our platform eliminates manual paperwork, optimizes team communication, 
                  and hands transportation providers absolute control over their dynamic assets.
                </p>
              </div>

              <div className="space-y-5">
                <Feature icon={<ShieldCheck />} text="Secure and reliable enterprise-grade operations" />
                <Feature icon={<Clock />} text="Save valuable hours with fully automated workflows" />
                <Feature icon={<BarChart3 />} text="Deep analytical tools for performance tracking" />
              </div>
            </div>

            {/* CTA Card */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-8 lg:p-12 shadow-xl border border-blue-600/30 space-y-6">
              <h3 className="text-2xl lg:text-3xl font-bold tracking-tight">
                Ready to optimize your transportation ecosystem?
              </h3>
              <p className="text-blue-100/90 leading-relaxed">
                Join NTMS today to transition your logistics architecture to the cloud and boost efficiency.
              </p>
              <button className="w-full sm:w-auto bg-white text-blue-900 px-8 py-3.5 rounded-lg font-semibold shadow hover:bg-slate-100 transition duration-200">
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
    <div className="flex items-center justify-center text-blue-600 bg-blue-50 w-12 h-12 rounded-xl mb-4">
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </div>
    <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{number}</span>
    <span className="text-sm font-medium text-slate-500 mt-1">{text}</span>
  </div>
);

const ServiceCard = ({ icon, title, description }) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition duration-300">
    <div className="flex items-center justify-center text-blue-600 bg-blue-50 w-12 h-12 rounded-xl mb-6">
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
  </div>
);

const Feature = ({ icon, text }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 text-blue-400 bg-white/5 p-1.5 rounded-lg mt-0.5">
      {React.cloneElement(icon, { className: "w-5 h-5" })}
    </div>
    <p className="text-slate-300 font-medium">{text}</p>
  </div>
);

export default Home;