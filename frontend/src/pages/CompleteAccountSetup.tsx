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
    <div>
    <p style={{ color: "red" }}>{error}</p>
    <button type="button" onClick={() => navigate(0)}>Go Back and Retry</button>
    </div>
  );
  if (!userDetails) return <p>Loading...</p>;

  return (
    <div>
      <h2>Complete Account Setup</h2>
      <p>Email: <strong>{userDetails.email}</strong></p>
      <p>Name: <strong>{userDetails.firstName} {userDetails.lastName}</strong></p>
      <form onSubmit={handleSubmit}>
        <label>Password:</label>
        <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={handlePasswordChange} // <-- Updated
            required
        />
        {capsLockOn && <p style={{ color: "orange" }}>Warning: Caps Lock is ON!</p>}
        
        <label>Confirm Password:</label>
        <input type="password" value={confirmPassword} onChange={handleConfirmPasswordChange} required />

        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Processing..." : "Complete Setup"}</button>
      </form>
    </div>
  );
};

export default CompleteAccountSetup;
