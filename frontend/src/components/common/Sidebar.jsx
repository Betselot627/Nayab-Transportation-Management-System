import { Link } from "react-router-dom";

const Sidebar = ({ links }) => {
  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">NTMS</h2>
      </div>
      <nav>
        {links.map((link, index) => (
          <Link
            key={index}
            to={link.path}
            className="block py-2 px-4 hover:bg-gray-700 rounded"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
