import React from "react";
import { Truck, Users, Award, Globe, Target, TrendingUp } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-900 dark:text-gray-100 transition-colors duration-200">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About NTMS</h1>
            <p className="text-xl text-slate-300 leading-relaxed">
              Leading the future of transportation management with innovative
              solutions that empower businesses to optimize their logistics
              operations.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white dark:bg-gray-900 border-b border-slate-200/60 dark:border-gray-800 transition-colors">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed mb-4">
                At Nayab Transportation Management System, we're committed to
                revolutionizing the logistics industry through cutting-edge
                technology and innovative solutions.
              </p>
              <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed">
                We believe that efficient transportation management should be
                accessible to businesses of all sizes, which is why we've built
                a platform that combines powerful features with intuitive
                design.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <StatsCard
                icon={<Truck />}
                value="500+"
                label="Active Vehicles"
              />
              <StatsCard
                icon={<Users />}
                value="200+"
                label="Professional Drivers"
              />
              <StatsCard icon={<Globe />} value="50+" label="Cities Covered" />
              <StatsCard
                icon={<Award />}
                value="10K+"
                label="Deliveries Completed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-slate-50 dark:bg-gray-950 transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-slate-600 dark:text-gray-400">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <ValueCard
              icon={<Target />}
              title="Excellence"
              description="We strive for excellence in every aspect of our service, from technology to customer support."
            />
            <ValueCard
              icon={<TrendingUp />}
              title="Innovation"
              description="Constantly evolving and improving our platform to meet the changing needs of the industry."
            />
            <ValueCard
              icon={<Users />}
              title="Customer Focus"
              description="Your success is our success. We're dedicated to providing solutions that drive real results."
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white dark:bg-gray-900 border-t border-slate-200/60 dark:border-gray-800 transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose Us
            </h2>
            <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
              With years of experience in logistics and technology, we
              understand the challenges you face and have built solutions to
              overcome them.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              title="24/7 Support"
              description="Round-the-clock assistance to keep your operations running smoothly."
            />
            <FeatureCard
              title="Real-time Tracking"
              description="Monitor your fleet and shipments with live GPS tracking."
            />
            <FeatureCard
              title="Advanced Analytics"
              description="Make data-driven decisions with comprehensive reports."
            />
            <FeatureCard
              title="Scalable Solution"
              description="Grow your business without worrying about system limitations."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const StatsCard = ({ icon, value, label }) => (
  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 rounded-xl text-white shadow-lg">
    <div className="flex justify-center mb-3">
      {React.cloneElement(icon, { className: "w-8 h-8" })}
    </div>
    <div className="text-3xl font-bold text-center mb-1">{value}</div>
    <div className="text-sm text-center text-amber-100">{label}</div>
  </div>
);

const ValueCard = ({ icon, title, description }) => (
  <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-slate-200/80 dark:border-gray-700 hover:shadow-md transition">
    <div className="flex justify-center text-amber-500 mb-4">
      {React.cloneElement(icon, { className: "w-12 h-12" })}
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-3">
      {title}
    </h3>
    <p className="text-slate-600 dark:text-gray-300 text-center leading-relaxed">{description}</p>
  </div>
);

const FeatureCard = ({ title, description }) => (
  <div className="bg-slate-50 dark:bg-gray-800 p-6 rounded-xl border border-slate-200/80 dark:border-gray-700">
    <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h4>
    <p className="text-slate-600 dark:text-gray-400 text-sm">{description}</p>
  </div>
);

export default About;
