import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/login");
    }, 3000); // Redirect after 3 seconds

    return () => clearTimeout(timeout); // Cleanup timeout if component unmounts
  }, [navigate]);

  return (
    <div className="flex flex-col items-center mt-10">
      <h2 className="text-2xl mb-4">You have been logged out</h2>
      <p>Redirecting to login...</p>
    </div>
  );
};

export default LogoutPage;
