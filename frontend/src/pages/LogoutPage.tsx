import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/login");
    }, 2000); // Redirect after 2 seconds

    return () => clearTimeout(timeout); // Cleanup timeout if component unmounts
  }, [navigate]);

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-dark text-white">
      <div className="text-center p-5">
        <h2 className="mb-4 fw-bold">You have been logged out</h2>
        <p className="text-light mb-4">Redirecting to the login page...</p>
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
