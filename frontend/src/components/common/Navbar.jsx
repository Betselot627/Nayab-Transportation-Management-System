import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          NTMS
        </Link>
        <div className="flex gap-4">
          <Link to="/login" className="hover:text-blue-600">
            Login
          </Link>
          <Link to="/register" className="hover:text-blue-600">
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
