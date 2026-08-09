import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Truck } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-slate-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight hover:opacity-90 transition"
        >
          <div className="bg-blue-950 text-white p-1.5 rounded-lg shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <span>
            NTMS<span className="text-amber-500">.</span>
          </span>
        </Link>

        {/* Center Navigation - Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? "text-blue-950 dark:text-blue-400 font-semibold"
                  : "text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Navigation & Dark Mode Toggle - Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />

          <Link
            to="/login"
            className="text-sm font-medium text-slate-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-white px-3 py-2 transition"
          >
            Sign In
          </Link>

          <Link
            to="/register"
            className="text-sm font-medium bg-blue-950 hover:bg-black text-white px-4 py-2 rounded-xl shadow-sm hover:shadow active:scale-95 transition duration-200"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Header Actions (ThemeToggle + Hamburger) */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle compact />

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-4 space-y-3 animate-slide-down">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2 rounded-lg text-base font-medium transition ${
                  isActive(link.path)
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
