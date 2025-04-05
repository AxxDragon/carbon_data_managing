import { useState, useEffect } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

// Interface for the structure of an invitation
interface Invite {
  id?: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: number;
}

// Interface for the structure of a company
interface Company {
  id: number;
  name: string;
}

// Props for the InviteForm component
interface InviteFormProps {
  invite?: Invite; // Optional existing invite to edit
  onInviteSuccess: () => void; // Callback when the invite is successfully sent
  onCancel: () => void; // Callback to cancel the invite creation/editing
}

const InviteForm: React.FC<InviteFormProps> = ({
  invite,
  onInviteSuccess,
  onCancel,
}) => {
  const { user } = useAuth(); // Access the authenticated user
  const [email, setEmail] = useState(invite?.email || ""); // Email state
  const [firstName, setFirstName] = useState(invite?.firstName || ""); // First name state
  const [lastName, setLastName] = useState(invite?.lastName || ""); // Last name state
  const [role, setRole] = useState(invite?.role || "user"); // Role state (default to "user")
  const [companyId, setCompanyId] = useState<number | undefined>(
    invite?.companyId
  ); // Company ID state
  const [companies, setCompanies] = useState<Company[]>([]); // List of companies fetched from API
  const [loading, setLoading] = useState(false); // Loading state for submit button
  const [error, setError] = useState(""); // Error state for form submission

  // Fetch company options for admin users when component mounts or invite changes
  useEffect(() => {
    setEmail(invite?.email || "");
    setFirstName(invite?.firstName || "");
    setLastName(invite?.lastName || "");
    setRole(invite?.role || "user");
    setCompanyId(invite?.companyId);

    if (user?.role === "admin") {
      // Fetch company options only if the user has "admin" role
      api
        .get("options/companies", {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        .then((response) => setCompanies(response.data)) // Set fetched companies
        .catch((error) => console.error("Error fetching companies", error)); // Log any errors
    }
  }, [invite, user?.role, user?.token]);

  // Handles form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true); // Set loading state to true
    setError(""); // Reset error message

    try {
      if (invite) {
        // If it's an edit, delete the old invite first
        await api.delete(`invites/${invite.id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
      }

      // Create or update the invite
      await api.post(
        "invites/",
        { email, firstName, lastName, role, companyId },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      onInviteSuccess(); // Call the success callback after invite is sent
      // Clear form fields after successful submission
      setEmail("");
      setFirstName("");
      setLastName("");
    } catch (err) {
      // Handle any errors during the invite creation process
      setError("Failed to send invitation. Please try again.");
    }

    setLoading(false); // Set loading state to false after operation completes
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="d-flex flex-wrap gap-2">
        {/* First Name Input */}
        <div className="flex-fill">
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)} // Update first name
            className="form-control"
            required
          />
        </div>

        {/* Last Name Input */}
        <div className="flex-fill">
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)} // Update last name
            className="form-control"
            required
          />
        </div>

        {/* Email Input */}
        <div className="flex-fill">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Update email
            className="form-control"
            required
          />
        </div>

        {/* Show Role and Company fields only for admin users */}
        {user?.role === "admin" && (
          <>
            {/* Role Selection */}
            <div className="flex-fill">
              <label>Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)} // Update role
                className="form-select"
                required
              >
                <option value="user">User</option>
                <option value="companyadmin">Company Admin</option>
              </select>
            </div>

            {/* Company Selection */}
            <div className="flex-fill">
              <label>Company:</label>
              <select
                value={companyId ?? ""} // Use `companyId` if available, otherwise default to empty string
                onChange={(e) => setCompanyId(Number(e.target.value))} // Update company ID
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

      {/* Error message */}
      {error && <p className="text-danger">{error}</p>}

      <div className="d-flex justify-content-between mt-3">
        {/* Submit Button */}
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Sending..." : "Send Invitation"} {/* Loading state */}
        </button>

        {/* Cancel Button */}
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default InviteForm;
