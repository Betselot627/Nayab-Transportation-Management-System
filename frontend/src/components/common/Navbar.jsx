import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="container mx-auto px-6 h-16 flex justify-between items-center">
        {/* Brand Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold text-slate-900 tracking-tight hover:opacity-90 transition"
        >
          NTMS<span className="text-amber-500">.</span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Home
          </Link>
          <Link
            to="/about"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Contact
          </Link>
        </div>

        {/* Authentication Navigation */}
        <div className="flex items-center gap-6">
          <Link
            to="/login"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Sign In
          </Link>

          <Link
            to="/register"
            className="text-sm font-medium bg-slate-950 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-slate-800 hover:scale-105 active:scale-95 transition duration-200"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
