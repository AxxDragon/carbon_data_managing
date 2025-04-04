import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";

const CompleteAccountSetup = () => {
  const { inviteToken } = useParams();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<{ email: string; firstName: string; lastName: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const response = await api.get(`invites/token/${inviteToken}`);
        const inviteCreatedAt = new Date(response.data.createdAt);
        const expirationDate = new Date(inviteCreatedAt);
        expirationDate.setDate(expirationDate.getDate() + 30); // Expire after 30 days
  
        if (new Date() > expirationDate) {
          setError("This invite has expired.");
          return;
        }
  
        setUserDetails(response.data);
      } catch (err) {
        setError("Invalid or expired invite.");
      }
    };
    fetchInviteDetails();
  }, [inviteToken]);

  const handlePasswordChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setPassword(e.currentTarget.value);
    setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock"));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await api.post("users/", {
        inviteToken,
        password,
      });
      alert("Account setup successful!");
      navigate("/login");
    } catch (err) {
      setError("Failed to complete account setup. Please try again.");
    }
    setLoading(false);
  };

  if (error) return (
    <div className="container mt-4 p-4 rounded shadow-sm bg-light text-center">
      <p className="text-danger fw-bold">{error}</p>
      <button className="btn btn-secondary" onClick={() => navigate(0)}>Go Back and Retry</button>
    </div>
  );
  if (!userDetails) return <p className="text-center mt-4">Loading...</p>;

  return (
    <div className="container mt-4 p-4 rounded shadow-sm bg-light">
      <h2 className="mb-3 text-primary text-center">Complete Account Setup</h2>
      <div className="mb-3 text-center">
        <p><strong>Email:</strong> {userDetails.email}</p>
        <p><strong>Name:</strong> {userDetails.firstName} {userDetails.lastName}</p>
      </div>
      <form onSubmit={handleSubmit} className="needs-validation" noValidate>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={handlePasswordChange} // <-- Updated
            required
        />
          {capsLockOn && <p className="text-warning small mt-1">Warning: Caps Lock is ON!</p>}
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
          />
        </div>
        {error && <p className="text-danger fw-bold">{error}</p>}
        <div className="d-flex justify-content-center gap-2">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Processing..." : "Complete Setup"}
          </button>
          <button className="btn btn-outline-secondary" type="button" onClick={() => navigate("/")}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CompleteAccountSetup;
