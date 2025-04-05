import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import InviteForm from "./InviteForm";

// Define the structure for an Invite object
interface Invite {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: number;
  createdAt: string;
}

const itemsPerPage = 10; // Number of items per page for pagination

const InviteUser = () => {
  const { user } = useAuth(); // Access the current authenticated user
  const [invites, setInvites] = useState<Invite[]>([]); // State to store all invites
  const [showForm, setShowForm] = useState(false); // State to control the visibility of the invite form
  const [selectedInvite, setSelectedInvite] = useState<Invite | undefined>(
    undefined
  ); // State to store the selected invite for editing
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>(
    []
  ); // State to store company options
  const [searchTerm, setSearchTerm] = useState(""); // State for search filter
  const [currentPage, setCurrentPage] = useState(1); // State to manage the current page in pagination
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Invite | "company" | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" }); // State to manage sorting configuration

  // Fetch invites from the API
  const fetchInvites = useCallback(async () => {
    try {
      const response = await api.get("invites", {
        headers: { Authorization: `Bearer ${user?.token}` }, // Send token for authorization
      });
      setInvites(response.data); // Set the fetched invites to state
    } catch (error) {
      console.error("Error fetching invites", error); // Log any error during fetch
    }
  }, [user?.token]);

  // Fetch invites and company names when component mounts or user token changes
  useEffect(() => {
    fetchInvites(); // Fetch invites when the component loads or when token changes

    // Fetch company names for users with admin role
    api
      .get("options/companies", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((response) => {
        setCompanies(response.data); // Set the fetched companies to state
      })
      .catch((error) => {
        console.error("Error fetching company names", error); // Log error if fetching companies fails
      });
  }, [fetchInvites, user?.token]);

  // Delete an invite
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this invite?")) return; // Confirm before deletion
    try {
      await api.delete(`invites/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` }, // Send token for authorization
      });
      fetchInvites(); // Re-fetch invites after deletion
    } catch (error) {
      console.error("Error deleting invite:", error); // Log any error during deletion
      alert("Failed to delete invite."); // Alert the user if deletion fails
    }
  };

  // Resend an invite
  const handleResend = async (id: number) => {
    try {
      await api.post(
        `invites/${id}/resend`,
        {},
        {
          headers: { Authorization: `Bearer ${user?.token}` }, // Send token for authorization
        }
      );
      alert("Invite resent successfully!"); // Inform the user that the invite was resent
    } catch (error) {
      console.error("Error resending invite:", error); // Log any error during resend
      alert("Failed to resend invite."); // Alert the user if resend fails
    }
  };

  // Search filter for invites based on name and email
  const filteredInvites = invites.filter(
    (invite) =>
      `${invite.firstName} ${invite.lastName} ${invite.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) // Filter invites based on search term
  );

  // Sorting logic based on selected key and direction
  const sortedInvites = [...filteredInvites].sort((a, b) => {
    if (!sortConfig.key) return 0; // If no key is set, do not sort

    let valueA: any, valueB: any;

    // If sorting by company, find the company name based on the company ID
    if (sortConfig.key === "company") {
      valueA = companies.find((c) => c.id === a.companyId)?.name || "";
      valueB = companies.find((c) => c.id === b.companyId)?.name || "";
    } else {
      // For other fields, use the invite's property value
      valueA = a[sortConfig.key] ?? "";
      valueB = b[sortConfig.key] ?? "";
    }

    if (typeof valueA === "string" && typeof valueB === "string") {
      // Compare values alphabetically if they are strings
      return sortConfig.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return 0; // Return 0 if no sorting occurs
  });

  // Pagination logic: slice the sorted invites array based on the current page
  const paginatedInvites = sortedInvites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle the sorting order and key
  const toggleSort = (key: keyof Invite | "company") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc", // Toggle direction if the same key is clicked
    }));
  };

  // Get the arrow indicator for sorting based on the current sorting key and direction
  const getArrowIndicator = (key: keyof Invite | "company") => {
    return sortConfig.key === key
      ? sortConfig.direction === "asc"
        ? "▲"
        : "▼"
      : "";
  };

  return (
    <div className="container mt-4 custom-container-bg p-4 rounded shadow-sm">
      <h2 className="mb-4">Manage Invites</h2>

      {/* Search bar to filter invites */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search invites"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Update search term state
          className="form-control"
        />
      </div>

      {/* Button to open the invite form */}
      <button
        className="btn btn-primary mb-3"
        onClick={() => {
          setSelectedInvite(undefined); // Clear selected invite
          setShowForm(true); // Show invite form
        }}
      >
        Create Invite
      </button>

      {/* Table displaying the invites */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              {/* Sortable columns with arrow indicators */}
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("firstName")}
                className="sortable"
              >
                Name {getArrowIndicator("firstName")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("email")}
                className="sortable"
              >
                Email {getArrowIndicator("email")}
              </th>
              {user?.role === "admin" && (
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("role")}
                  className="sortable"
                >
                  Role {getArrowIndicator("role")}
                </th>
              )}
              {user?.role === "admin" && (
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("company")}
                  className="sortable"
                >
                  Company {getArrowIndicator("company")}
                </th>
              )}
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("createdAt")}
                className="sortable"
              >
                Created {getArrowIndicator("createdAt")}
              </th>
              <th>Actions</th>{" "}
              {/* Actions column for Edit, Resend, and Delete */}
            </tr>
          </thead>
          <tbody>
            {/* Render each invite in a table row */}
            {paginatedInvites.map((invite) => (
              <tr key={invite.id}>
                <td>
                  {invite.firstName} {invite.lastName}
                </td>
                <td>{invite.email}</td>
                {user?.role === "admin" && <td>{invite.role}</td>}
                {user?.role === "admin" && (
                  <td>
                    {companies.find((c) => c.id === invite.companyId)?.name ||
                      "Unknown"}
                  </td>
                )}
                <td>{new Date(invite.createdAt).toLocaleString()}</td>
                <td>
                  {/* Edit button */}
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => {
                      setSelectedInvite(invite); // Set selected invite for editing
                      setShowForm(true); // Show the invite form
                    }}
                  >
                    Edit
                  </button>
                  {/* Resend button */}
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => handleResend(invite.id)}
                  >
                    Resend
                  </button>
                  {/* Delete button */}
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

      {/* Pagination controls */}
      <div className="mt-3">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)} // Go to previous page
          className="btn btn-secondary me-1"
        >
          Previous
        </button>
        <button
          disabled={currentPage * itemsPerPage >= sortedInvites.length}
          onClick={() => setCurrentPage(currentPage + 1)} // Go to next page
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>

      {/* Render the invite form if showForm is true */}
      {showForm && (
        <InviteForm
          invite={selectedInvite} // Pass selected invite for editing or undefined for creating
          onInviteSuccess={() => {
            setShowForm(false); // Close the form after success
            fetchInvites(); // Re-fetch invites after creating or updating
          }}
          onCancel={() => setShowForm(false)} // Close the form without making changes
        />
      )}
    </div>
  );
};

export default InviteUser;
