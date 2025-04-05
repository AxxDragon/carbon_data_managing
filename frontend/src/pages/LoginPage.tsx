import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const LoginPage = () => {
  const [email, setEmail] = useState(""); // Stores the email input from the user
  const [password, setPassword] = useState(""); // Stores the password input from the user
  const [error, setError] = useState(""); // Stores any error message from the login process

  const auth = useAuth(); // Access the auth context to manage authentication
  const navigate = useNavigate(); // Used for navigating to other routes after successful login

  // Function to handle form submission and login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    try {
      // Send a POST request to the login endpoint with email and password
      const res = await api.post("/auth/login", { email, password });
      auth.login(res.data); // Store login data in context (e.g., user info, token)
      navigate("/consumption-list"); // Redirect to the consumption list page after successful login
    } catch (err) {
      // If login fails, show an error message
      setError("Invalid credentials"); // Display a user-friendly error message
    }
  };

  return (
    // Center the login form on the screen using Flexbox and set a light background color
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ width: "350px" }}>
        <h2 className="text-center mb-3">Login</h2>

        {/* Display an error message if there's an issue with login */}
        {error && <p className="text-danger text-center">{error}</p>}

        {/* Login form */}
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            {/* Input field for email */}
            <input
              className="form-control"
              type="email"
              placeholder="Enter your email"
              value={email} // Bind email input value to state
              onChange={(e) => setEmail(e.target.value)} // Update email state on input change
              required // Ensure the email field is required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            {/* Input field for password */}
            <input
              className="form-control"
              type="password"
              placeholder="Enter your password"
              value={password} // Bind password input value to state
              onChange={(e) => setPassword(e.target.value)} // Update password state on input change
              required // Ensure the password field is required
            />
          </div>

          {/* Submit button for the form */}
          <button className="btn btn-primary w-100" type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
