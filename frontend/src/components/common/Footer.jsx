import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-slate-950 text-slate-400 border-t border-slate-900">
      {/* Main Footer Links */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Identity */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="text-xl font-bold text-white tracking-tight">
              NTMS<span className="text-blue-500">.</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Streamlining logistics and modern fleet operations through robust digital architecture.
            </p>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><button className="hover:text-white transition bg-transparent border-0 p-0 cursor-pointer">Features</button></li>
              <li><button className="hover:text-white transition bg-transparent border-0 p-0 cursor-pointer">Services</button></li>
            </ul>
          </div>

          {/* Account/Auth Column */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="hover:text-white transition">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Get Started</Link></li>
            </ul>
          </div>

          {/* Legal/Support Column */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><button className="hover:text-white transition bg-transparent border-0 p-0 cursor-pointer">Contact Us</button></li>
              <li><button className="hover:text-white transition bg-transparent border-0 p-0 cursor-pointer">Privacy Policy</button></li>
              <li><button className="hover:text-white transition bg-transparent border-0 p-0 cursor-pointer">Terms of Service</button></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-900 bg-slate-950/50 py-6">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {currentYear} NTMS. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 transition cursor-default">Security</span>
            <span className="hover:text-slate-400 transition cursor-default">Status</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;