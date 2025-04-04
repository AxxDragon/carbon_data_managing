import { useNavigate } from "react-router-dom";

const TimeoutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100 bg-dark text-white">
      <div className="text-center p-4">
        <h2 className="fw-bold mb-3">You have been logged out due to inactivity</h2>
        <p className="mb-4">For your security, we logged you out after a period of inactivity.</p>
        <button 
          onClick={() => navigate("/login")} 
          className="btn btn-primary px-5 py-2">
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default TimeoutPage;
