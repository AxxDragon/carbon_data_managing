import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  // Destructure user and logout function from AuthContext
  const { user, logout } = useAuth();

  // Hook to manage navigation programmatically
  const navigate = useNavigate();

  // State to control the visibility of the dropdown menu
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Hook to get the current location (URL) for determining active link
  const location = useLocation();

  // Handle logout action by navigating to the logout route and invoking the logout function
  const handleLogout = () => {
    navigate("/logout"); // Navigate to logout page
    logout(); // Call logout function to update the auth context
  };

  return (
    <header className="bg-dark text-white shadow-sm px-3 pt-2 pb-1 fixed-top">
      {/* Container for header content */}
      <div className="container-fluid position-relative d-flex align-items-end px-2">
        {/* Left Side: Logo & Title */}
        <div
          className="d-flex align-items-center"
          style={{ minHeight: "92px" }}
        >
          <div style={{ width: "100px", height: "100px", flexShrink: 0 }}>
            {/* Logo image */}
            <img
              src="/assets/CARMA_Logo.png"
              alt="CARMA Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "50%", // Circular logo style
              }}
            />
          </div>
          <div className="ms-3 mb-1">
            {/* Title of the application */}
            <h1 className="mb-0 fw-bold">CARMA</h1>
            <p className="mb-0 small text-light">Carbon emission data</p>
            <p className="mb-0 small text-light">Management tool</p>
          </div>
        </div>

        {/* Navigation Tabs: Links to different pages of the app */}
        <nav className="position-absolute start-50 translate-middle-x">
          <ul className="nav nav-pills">
            {/* Consumption List tab */}
            <li className="nav-item">
              <Link
                to="/consumption-list"
                className={`nav-link ${
                  location.pathname === "/consumption-list"
                    ? "text-secondary disabled" // Disable link if on the current page
                    : "text-light"
                }`}
              >
                Consumption List
              </Link>
            </li>

            {/* Analyze tab */}
            <li className="nav-item">
              <Link
                to="/analyze"
                className={`nav-link ${
                  location.pathname === "/analyze"
                    ? "text-secondary disabled" // Disable link if on the current page
                    : "text-light"
                }`}
              >
                Analyze
              </Link>
            </li>

            {/* Conditional rendering of management links for company admins and admins */}
            {(user?.role === "companyadmin" || user?.role === "admin") && (
              <>
                {/* Manage Projects tab */}
                <li className="nav-item">
                  <Link
                    to="/manage-projects"
                    className={`nav-link ${
                      location.pathname === "/manage-projects"
                        ? "text-secondary disabled" // Disable link if on the current page
                        : "text-light"
                    }`}
                  >
                    Manage Projects
                  </Link>
                </li>

                {/* Manage Users tab */}
                <li className="nav-item">
                  <Link
                    to="/manage-users"
                    className={`nav-link ${
                      location.pathname === "/manage-users"
                        ? "text-secondary disabled" // Disable link if on the current page
                        : "text-light"
                    }`}
                  >
                    Manage Users
                  </Link>
                </li>

                {/* Invite tab */}
                <li className="nav-item">
                  <Link
                    to="/invite"
                    className={`nav-link ${
                      location.pathname === "/invite"
                        ? "text-secondary disabled" // Disable link if on the current page
                        : "text-light"
                    }`}
                  >
                    Invite
                  </Link>
                </li>
              </>
            )}

            {/* Conditional rendering of Manage Options link for admins */}
            {user?.role === "admin" && (
              <li className="nav-item">
                <Link
                  to="/manage-options"
                  className={`nav-link ${
                    location.pathname === "/manage-options"
                      ? "text-secondary disabled" // Disable link if on the current page
                      : "text-light"
                  }`}
                >
                  Manage Options
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Right Side: User Dropdown for profile and logout */}
        <div className="position-absolute top-0 end-0 pt-2">
          {/* Button to toggle the dropdown menu */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)} // Toggle dropdown visibility
            className="btn btn-secondary px-3"
          >
            {/* Display user's email in the dropdown button */}
            {user?.email} ▼
          </button>

          {/* Dropdown menu shown when `dropdownOpen` is true */}
          {dropdownOpen && (
            <div
              className="position-absolute end-0 mt-2 shadow-sm rounded border"
              style={{ minWidth: "150px", backgroundColor: "#6c757d" }}
            >
              {/* Logout button inside the dropdown */}
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
    </header>
  );
};

export default Header;
