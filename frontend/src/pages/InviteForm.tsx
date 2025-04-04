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
    <form onSubmit={handleSubmit} className="p-3">
      <div className="d-flex flex-wrap gap-2">
        <div className="flex-fill">
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="form-control"
            required
          />
        </div>
        <div className="flex-fill">
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="form-control"
            required
          />
        </div>
        <div className="flex-fill">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
            required
          />
        </div>
        {user?.role === "admin" && (
          <>
            <div className="flex-fill">
              <label>Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="form-select"
                required
              >
                <option value="user">User</option>
                <option value="companyadmin">Company Admin</option>
              </select>
            </div>

            <div className="flex-fill">
              <label>Company:</label>
              <select
                value={companyId ?? ""}
                onChange={(e) => setCompanyId(Number(e.target.value))}
                className="form-select"
                required
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-danger">{error}</p>}

      <div className="d-flex justify-content-between mt-3">
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Sending..." : "Send Invitation"}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default InviteForm;
