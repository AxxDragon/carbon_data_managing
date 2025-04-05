import { useNavigate } from "react-router-dom";

// TimeoutPage component displayed when a user is logged out due to inactivity
const TimeoutPage = () => {
  // useNavigate hook from react-router-dom to programmatically navigate to different routes
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-dark text-white">
      <div className="text-center p-4">
        {/* Header text informing the user about the timeout */}
        <h2 className="fw-bold mb-3">
          You have been logged out due to inactivity
        </h2>

        {/* Informational message explaining why the user was logged out */}
        <p className="mb-4">
          For your security, we logged you out after a period of inactivity.
        </p>

        {/* Button that allows the user to navigate to the login page */}
        <button
          onClick={() => navigate("/login")} // On click, navigate the user to the login page
          className="btn btn-primary px-5 py-2"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default TimeoutPage;
