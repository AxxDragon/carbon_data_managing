import { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Hook to programmatically navigate to different routes

const LogoutPage = () => {
  const navigate = useNavigate(); // Navigation function to change routes

  // useEffect hook to handle the redirect after the logout process
  useEffect(() => {
    // Set a timeout to redirect to the login page
    const timeout = setTimeout(() => {
      navigate("/login"); // Navigate to the login page
    }, 2000); // Redirect after 2 seconds

    return () => clearTimeout(timeout); // Cleanup timeout if component unmounts
  }, [navigate]); // Dependency array with navigate to ensure proper effect handling

  return (
    // Flexbox layout to center the content vertically and horizontally
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-dark text-white">
      <div className="text-center p-5">
        {/* Display logout confirmation message */}
        <h2 className="mb-4 fw-bold">You have been logged out</h2>
        <p className="text-light mb-4">Redirecting to the login page...</p>

        {/* Display loading spinner while redirecting */}
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
