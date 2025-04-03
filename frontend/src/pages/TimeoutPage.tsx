import { useNavigate } from "react-router-dom";

const TimeoutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center p-4">
      <h2>You have been logged out due to inactivity.</h2>
      <p>Click below to log back in:</p>
      <button onClick={() => navigate("/login")} className="px-4 py-2 bg-blue-500 text-white">
        Go to Login
      </button>
    </div>
  );
};

export default TimeoutPage;
