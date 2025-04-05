import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";

// Component to handle the completion of account setup
const CompleteAccountSetup = () => {
  const { inviteToken } = useParams(); // Extract invite token from URL params
  const navigate = useNavigate(); // Navigate function to programmatically redirect
  const [userDetails, setUserDetails] = useState<{
    email: string;
    firstName: string;
    lastName: string;
  } | null>(null); // State to store user details from invite
  const [password, setPassword] = useState(""); // State to store password input
  const [confirmPassword, setConfirmPassword] = useState(""); // State to store password confirmation
  const [capsLockOn, setCapsLockOn] = useState(false); // State to track CapsLock status
  const [error, setError] = useState(""); // State to store error messages
  const [loading, setLoading] = useState(false); // State to indicate loading status during form submission

  // Fetch invite details using the inviteToken from URL params
  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const response = await api.get(`invites/token/${inviteToken}`); // API call to fetch invite details
        const inviteCreatedAt = new Date(response.data.createdAt);
        const expirationDate = new Date(inviteCreatedAt);
        expirationDate.setDate(expirationDate.getDate() + 30); // Set expiration date 30 days from the invite creation

        // Check if the invite has expired
        if (new Date() > expirationDate) {
          setError("This invite has expired."); // Set error if expired
          return;
        }

        setUserDetails(response.data); // Set user details if invite is valid
      } catch (err) {
        setError("Invalid or expired invite."); // Set error for invalid or expired invite
      }
    };
    fetchInviteDetails(); // Fetch invite details when component mounts
  }, [inviteToken]); // Dependency array ensures it runs when inviteToken changes

  // Handle changes in password field, including CapsLock detection
  const handlePasswordChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setPassword(e.currentTarget.value); // Update password state
    setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock")); // Check if CapsLock is on
  };

  // Handle changes in confirm password field
  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value); // Update confirm password state
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    setError(""); // Reset error state before submission
    setLoading(true); // Set loading state to true

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match."); // Set error if passwords don't match
      setLoading(false); // Reset loading state
      return;
    }

    try {
      // Make API call to complete account setup with the provided password
      await api.post("users/", {
        inviteToken,
        password,
      });
      alert("Account setup successful!"); // Show success message
      navigate("/login"); // Redirect to login page after successful setup
    } catch (err) {
      setError("Failed to complete account setup. Please try again."); // Set error if API call fails
    }
    setLoading(false); // Reset loading state after submission
  };

  // Show error message if there's an error
  if (error)
    return (
      <div className="container mt-4 p-4 rounded shadow-sm bg-light text-center">
        <p className="text-danger fw-bold">{error}</p>{" "}
        {/* Display error message */}
        <button className="btn btn-secondary" onClick={() => navigate(0)}>
          Go Back and Retry
        </button>{" "}
        {/* Button to reload the page */}
      </div>
    );

  // Show loading message if userDetails is still being fetched
  if (!userDetails) return <p className="text-center mt-4">Loading...</p>;

  // Render the form to complete account setup
  return (
    <div className="container mt-4 p-4 rounded shadow-sm bg-light">
      <h2 className="mb-3 text-primary text-center">Complete Account Setup</h2>
      <div className="mb-3 text-center">
        {/* Display user email and name fetched from invite */}
        <p>
          <strong>Email:</strong> {userDetails.email}
        </p>
        <p>
          <strong>Name:</strong> {userDetails.firstName} {userDetails.lastName}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        {/* Password input field */}
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Update password state
            onKeyUp={handlePasswordChange} // Handle CapsLock warning
            required
          />
          {/* Show CapsLock warning if CapsLock is detected */}
          {capsLockOn && (
            <p className="text-warning small mt-1">Warning: Caps Lock is ON!</p>
          )}
        </div>
        {/* Confirm Password input field */}
        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange} // Update confirm password state
            required
          />
        </div>
        {/* Display error message if there's an error */}
        {error && <p className="text-danger fw-bold">{error}</p>}
        <div className="d-flex justify-content-center gap-2">
          {/* Submit button, disabled when loading */}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Processing..." : "Complete Setup"}{" "}
            {/* Show loading text when processing */}
          </button>
          {/* Cancel button to navigate back to the homepage */}
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteAccountSetup;
