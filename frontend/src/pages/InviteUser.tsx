import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
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

const itemsPerPage = 10;

const InviteUser = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | undefined>(undefined);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Invite | "company" | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  const fetchInvites = useCallback(async () => {
    try {
      const response = await api.get("invites", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setInvites(response.data);
    } catch (error) {
      console.error("Error fetching invites", error);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchInvites();
  
    api.get("options/companies", {
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
      await api.delete(`invites/${id}`, {
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
      await api.post(`invites/${id}/resend`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      alert("Invite resent successfully!");
    } catch (error) {
      console.error("Error resending invite:", error);
      alert("Failed to resend invite.");
    }
  };

  // Search filter
  const filteredInvites = invites.filter((invite) =>
    `${invite.firstName} ${invite.lastName} ${invite.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting logic
  const sortedInvites = [...filteredInvites].sort((a, b) => {
    if (!sortConfig.key) return 0;
  
    let valueA: any, valueB: any;
  
    if (sortConfig.key === "company") {
      valueA = companies.find((c) => c.id === a.companyId)?.name || "";
      valueB = companies.find((c) => c.id === b.companyId)?.name || "";
    } else {
      valueA = a[sortConfig.key] ?? "";
      valueB = b[sortConfig.key] ?? "";
    }
  
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortConfig.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
  
    return 0;
  });

  // Pagination logic
  const paginatedInvites = sortedInvites.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Toggle sorting
  const toggleSort = (key: keyof Invite | "company") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getArrowIndicator = (key: keyof Invite | "company") => {
    return sortConfig.key === key ? (sortConfig.direction === "asc" ? "▲" : "▼") : "";
  };

  return (
    <div className="container mt-4 custom-container-bg p-4 rounded shadow-sm">
      <h2 className="mb-4">Manage Invites</h2>
  
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search invites"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>
  
      <button
        className="btn btn-primary mb-3"
        onClick={() => {
          setSelectedInvite(undefined);
          setShowForm(true);
        }}
      >
        Create Invite
      </button>
  
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th style={{ cursor: "pointer" }} onClick={() => toggleSort("firstName")} className="sortable">
                Name {getArrowIndicator("firstName")}
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => toggleSort("email")} className="sortable">
                Email {getArrowIndicator("email")}
              </th>
              {user?.role === "admin" && (
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("role")} className="sortable">
                  Role {getArrowIndicator("role")}
                </th>
              )}
              {user?.role === "admin" && (
                <th style={{ cursor: "pointer" }} onClick={() => toggleSort("company")} className="sortable">
                  Company {getArrowIndicator("company")}
                </th>
              )}
              <th style={{ cursor: "pointer" }} onClick={() => toggleSort("createdAt")} className="sortable">
                Created {getArrowIndicator("createdAt")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvites.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.firstName} {invite.lastName}</td>
                <td>{invite.email}</td>
                {user?.role === "admin" && <td>{invite.role}</td>}
                {user?.role === "admin" && (
                  <td>{companies.find((c) => c.id === invite.companyId)?.name || "Unknown"}</td>
                )}
                <td>{new Date(invite.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => {
                      setSelectedInvite(invite);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => handleResend(invite.id)}
                  >
                    Resend
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(invite.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  
      <div className="mt-3">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="btn btn-secondary me-1"
        >
          Previous
        </button>
        <button
          disabled={currentPage * itemsPerPage >= sortedInvites.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>
  
      {showForm && (
        <InviteForm
          invite={selectedInvite}
          onInviteSuccess={() => {
            setShowForm(false);
            fetchInvites();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default InviteUser;
