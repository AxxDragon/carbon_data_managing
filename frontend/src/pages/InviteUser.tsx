import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import InviteForm from "./InviteForm";

interface Invite {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: number;
  createdAt: string;
}

const InviteUser = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | undefined>(undefined);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);


  const fetchInvites = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8000/invites", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setInvites(response.data);
    } catch (error) {
      console.error("Error fetching invites", error);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchInvites();
  
    // Fetch company names
    axios.get("http://localhost:8000/options/companies", {
      headers: { Authorization: `Bearer ${user?.token}` },
    })
    .then(response => {
      setCompanies(response.data);
    })
    .catch(error => {
      console.error("Error fetching company names", error);
    });
  
  }, [fetchInvites, user?.token]);
  

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this invite?")) return;
    try {
      await axios.delete(`http://localhost:8000/invites/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      fetchInvites();
    } catch (error) {
      console.error("Error deleting invite:", error);
      alert("Failed to delete invite.");
    }
  };

  const handleResend = async (id: number) => {
    try {
      await axios.post(`http://localhost:8000/invites/${id}/resend`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      alert("Invite resent successfully!");
    } catch (error) {
      console.error("Error resending invite:", error);
      alert("Failed to resend invite.");
    }
  };

  return (
    <div>
      <h2>Manage Invites</h2>
      <button onClick={() => { setSelectedInvite(undefined); setShowForm(true); }}>
        Create Invite
      </button>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            {user?.role === "admin" && <th>Role</th>}
            {user?.role === "admin" && <th>Company</th>}
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr key={invite.id}>
              <td>{invite.firstName} {invite.lastName}</td>
              <td>{invite.email}</td>
              {user?.role === "admin" && <td>{invite.role}</td>}
              {user?.role === "admin" && (
                <td>
                  {companies.find((c) => c.id === invite.companyId)?.name || "Unknown"}
                </td>
              )}
              <td>{new Date(invite.createdAt).toLocaleString()}</td>
              <td>
                <button onClick={() => { setSelectedInvite(invite); setShowForm(true); }}>
                  Edit
                </button>
                <button onClick={() => handleResend(invite.id)}>Resend</button>
                <button onClick={() => handleDelete(invite.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showForm && (
        <InviteForm
          invite={selectedInvite}
          onInviteSuccess={() => { setShowForm(false); fetchInvites(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default InviteUser;
