import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    navigate("/logout");
    logout();
  };

  return (
    <header className="bg-dark text-white shadow-sm px-3 py-2 fixed-top">
      <div className="container-fluid d-flex justify-content-between align-items-center px-2">
        
        {/* Left Side: Logo & Title */}
        <div className="d-flex align-items-center">
          <img
            src="/assets/CARMA_Logo.png"
            alt="CARMA Logo"
            className="me-0"
            style={{ width: 92, height: 92, objectFit: "contain", borderRadius: "50%" }}
          />
          <div>
            <h1 className="mb-0 fw-bold">CARMA</h1>
            <p className="mb-0 small text-light">Carbon emission data</p>
            <p className="mb-0 small text-light">Managing tool</p>
          </div>
        </div>

        {/* Right Side: User Dropdown */}
        <div className="position-relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn btn-secondary px-3"
          >
            {user?.email} ▼
          </button>
          {dropdownOpen && (
            <div 
              className="position-absolute end-0 mt-2 shadow-sm rounded border"
              style={{ minWidth: "150px", backgroundColor: "#6c757d" }} // Matches Bootstrap's btn-secondary
            >
              <button
                onClick={handleLogout}
                className="btn btn-secondary w-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="mt-2">
        <ul className="nav nav-pills justify-content-center">
          <li className="nav-item">
            <Link
              to="/consumption-list"
              className={`nav-link ${location.pathname === "/consumption-list" ? "text-secondary disabled" : "text-light"}`}
            >
              Consumption List
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/analyze"
              className={`nav-link ${location.pathname === "/analyze" ? "text-secondary disabled" : "text-light"}`}
            >
              Analyze
            </Link>
          </li>
          {(user?.role === "companyadmin" || user?.role === "admin") && (
            <>
              <li className="nav-item">
                <Link
                  to="/manage-projects"
                  className={`nav-link ${location.pathname === "/manage-projects" ? "text-secondary disabled" : "text-light"}`}
                >
                  Manage Projects
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/manage-users"
                  className={`nav-link ${location.pathname === "/manage-users" ? "text-secondary disabled" : "text-light"}`}
                >
                  Manage Users
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/invite"
                  className={`nav-link ${location.pathname === "/invite" ? "text-secondary disabled" : "text-light"}`}
                >
                  Invite
                </Link>
              </li>
            </>
          )}
          {user?.role === "admin" && (
            <li className="nav-item">
              <Link
                to="/manage-options"
                className={`nav-link ${location.pathname === "/manage-options" ? "text-secondary disabled" : "text-light"}`}
              >
                Manage Options
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
