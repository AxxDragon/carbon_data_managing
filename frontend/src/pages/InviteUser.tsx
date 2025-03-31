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

  // 🔍 Search filter
  const filteredInvites = invites.filter((invite) =>
    `${invite.firstName} ${invite.lastName} ${invite.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🔀 Sorting logic
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

  // 📄 Pagination logic
  const paginatedInvites = sortedInvites.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 🔼 Toggle sorting
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
    <div className="p-4">
      <h2 className="text-2xl mb-4">Manage Invites</h2>
      <input
        type="text"
        placeholder="Search invites"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border w-full"
      />
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white"
        onClick={() => { setSelectedInvite(undefined); setShowForm(true); }}
      >
        Create Invite
      </button>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("firstName")}>Name {getArrowIndicator("firstName")}</th>
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("email")}>Email {getArrowIndicator("email")}</th>
            {user?.role === "admin" && <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("role")}>Role {getArrowIndicator("role")}</th>}
            {user?.role === "admin" && <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("company")}>Company {getArrowIndicator("company")}</th>}
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("createdAt")}>Created {getArrowIndicator("createdAt")}</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedInvites.map((invite) => (
            <tr key={invite.id}>
              <td className="border px-4 py-2">{invite.firstName} {invite.lastName}</td>
              <td className="border px-4 py-2">{invite.email}</td>
              {user?.role === "admin" && <td className="border px-4 py-2">{invite.role}</td>}
              {user?.role === "admin" && (
                <td className="border px-4 py-2">
                  {companies.find((c) => c.id === invite.companyId)?.name || "Unknown"}
                </td>
              )}
              <td className="border px-4 py-2">{new Date(invite.createdAt).toLocaleString()}</td>
              <td className="border px-4 py-2">
                <button
                  className="mr-2 px-2 py-1 bg-yellow-500 text-white"
                  onClick={() => { setSelectedInvite(invite); setShowForm(true); }}
                >
                  Edit
                </button>
                <button className="mr-2 px-2 py-1 bg-green-500 text-white" onClick={() => handleResend(invite.id)}>
                  Resend
                </button>
                <button className="px-2 py-1 bg-red-500 text-white" onClick={() => handleDelete(invite.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="px-4 py-2 bg-gray-300 mr-2"
        >
          Previous
        </button>
        <button
          disabled={currentPage * itemsPerPage >= sortedInvites.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-4 py-2 bg-gray-300"
        >
          Next
        </button>
      </div>
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
