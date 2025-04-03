import { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

interface Invite {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: number;
}

interface Company {
  id: number;
  name: string;
}

interface InviteFormProps {
  invite?: Invite;
  onInviteSuccess: () => void;
  onCancel: () => void;
}

const InviteForm: React.FC<InviteFormProps> = ({ invite, onInviteSuccess, onCancel }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(invite?.email || "");
  const [firstName, setFirstName] = useState(invite?.firstName || "");
  const [lastName, setLastName] = useState(invite?.lastName || "");
  const [role, setRole] = useState(invite?.role || "user");
  const [companyId, setCompanyId] = useState<number | undefined>(invite?.companyId);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(invite?.email || "");
    setFirstName(invite?.firstName || "");
    setLastName(invite?.lastName || "");
    setRole(invite?.role || "user");
    setCompanyId(invite?.companyId);

    if (user?.role === "admin") {
      api.get("options/companies", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then(response => setCompanies(response.data))
      .catch(error => console.error("Error fetching companies", error));
    }
  }, [invite, user?.role, user?.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
        if (invite) {
          // If it's an edit, delete the old invite first
          await api.delete(`invites/${invite.id}`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          });
        }
        await api.post(
            "invites/",
            { email, firstName, lastName, role, companyId },
            { headers: { Authorization: `Bearer ${user?.token}` } }
        );
      onInviteSuccess();
      setEmail("");
      setFirstName("");
      setLastName("");
    } catch (err) {
      setError("Failed to send invitation. Please try again.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>First Name:</label>
      <input
        type="text"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        required
      />

      <label>Last Name:</label>
      <input
        type="text"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        required
      />

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

          <label>Company:</label>
          <select
            value={companyId ?? ""}
            onChange={(e) => setCompanyId(Number(e.target.value))}
            required
          >
            <option value="">Select a company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
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
