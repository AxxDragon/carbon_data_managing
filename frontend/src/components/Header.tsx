import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Header = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-gray-900 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Website Name */}
        <h1 className="text-xl font-bold">Carbon Data Manager</h1>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-gray-700 px-4 py-2 rounded"
          >
            {user?.email} ▼
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-md rounded">
              <button 
                onClick={logout} 
                className="block px-4 py-2 hover:bg-gray-200 w-full text-left"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="mt-4">
        <ul className="flex space-x-4">
          <li><Link to="/consumption-list" className="hover:underline">List</Link></li>
          <li><Link to="/analyze" className="hover:underline">Analyze</Link></li>
          {user?.role === "companyadmin" || user?.role === "admin" ? (
            <>
              <li><Link to="/manage-projects" className="hover:underline">Manage Projects</Link></li>
              <li><Link to="/manage-users" className="hover:underline">Manage Users</Link></li>
              <li><Link to="/invite" className="hover:underline">Invite</Link></li>
            </>
          ) : null}
          {user?.role === "admin" && (
            <>
              <li><Link to="/manage-options" className="hover:underline">Manage Options</Link></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;