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
          NTMS<span className="text-blue-600">.</span>
        </Link>

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
            className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-500 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;