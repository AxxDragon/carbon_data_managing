import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface Invite {
  email: string;
  role: string;
  companyId?: number;
}

interface InviteFormProps {
  invite?: Invite;
  onInviteSuccess: () => void;
  onCancel: () => void;
}

const InviteForm: React.FC<InviteFormProps> = ({ invite, onInviteSuccess, onCancel }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(invite?.email || "");
  const [role, setRole] = useState(invite?.role || "user");
  const [companyId, setCompanyId] = useState<number | undefined>(invite?.companyId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch companyId only if it's missing
  useEffect(() => {
    setEmail(invite?.email || "");
    setRole(invite?.role || "user");

    if (invite?.companyId) {
      setCompanyId(invite.companyId);
    } else if (user?.role === "companyadmin") {
      // Fetch companyId for company admins if not available
      axios.get("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
        .then(response => {
          setCompanyId(response.data.companyId);
        })
        .catch(error => {
          console.error("Error fetching user data:", error);
        });
    }
  }, [invite, user?.role, user?.token]); // Ensure dependencies are correctly tracked

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axios.post(
        "http://localhost:8000/invites/",
        { email, role, companyId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      onInviteSuccess();
      setEmail(""); // Clear input after successful invite
    } catch (err) {
      setError("Failed to send invitation. Please try again.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Email:</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {user?.role === "admin" && (
        <>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="companyadmin">Company Admin</option>
          </select>

          <label>Company ID:</label>
          <input
            type="number"
            value={companyId ?? 0} // Ensure it's a valid number
            onChange={(e) => setCompanyId(Number(e.target.value))}
          />
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send Invitation"}
      </button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default InviteForm;
