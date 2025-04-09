import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import UserForm from "./UserForm";

// Defining the User type for better type safety and structure
type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  company?: string;
  companyId: number;
  projects: string[];
};

// Define the number of items per page for pagination
const itemsPerPage = 10;

const ManageUsers = () => {
  const { user } = useAuth(); // Get the authenticated user context
  const [users, setUsers] = useState<User[]>([]); // State to store users
  const [showForm, setShowForm] = useState(false); // State to toggle user form visibility
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined); // State to track selected user
  const [searchTerm, setSearchTerm] = useState(""); // State for search input value
  const [currentPage, setCurrentPage] = useState(1); // State for pagination current page
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" }); // Sorting configuration

  // Function to fetch users from the API
  const fetchUsers = useCallback(async () => {
    try {
      // Fetch users data
      const response = await api.get("users", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      // Fetch projects data to map project IDs to project names
      const projectsRes = await api.get("projects", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const projectMap = new Map(
        projectsRes.data.map((p: { id: number; name: string }) => [
          p.id,
          p.name,
        ])
      );

      // Format users and assign project names to users
      const formattedUsers = response.data.map((u: User) => ({
        ...u,
        projects: u.projects.map(
          (projectId) => projectMap.get(Number(projectId)) || "Unknown"
        ),
      }));

      // Set formatted users to state
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users", error); // Log error if fetching fails
    }
  }, [user?.token]); // Dependency array includes user token to trigger refetch when token changes

  // UseEffect hook to call fetchUsers on component mount or when fetchUsers function changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Function to handle user deletion
  const handleDelete = async (id: number) => {
    // Prevent deletion of the current authenticated user
    if (id === user?.id) {
      alert("You cannot delete yourself.");
      return;
    }

    // Confirm user deletion
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      // Attempt to delete the user from the API
      await api.delete(`users/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      // Refetch users after successful deletion
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error); // Log error if deletion fails
      alert("Failed to delete user."); // Show an alert if deletion fails
    }
  };

  // Search filter: filter users based on the search term entered in the search input
  const filteredUsers = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.role}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Sorting logic: sort filtered users based on the selected sort configuration (key and direction)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0; // If no sort key is selected, return 0 for no sorting

    const valueA = a[sortConfig.key] ?? "";
    const valueB = b[sortConfig.key] ?? "";

    // If both values are strings, sort them alphabetically based on the selected direction
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortConfig.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return 0; // Default case for unsupported types (non-string values)
  });

  // Pagination logic: paginate the sorted users list based on the current page
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle sorting: toggles between ascending and descending sort order
  const toggleSort = (key: keyof User) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="container mt-4 custom-container-bg p-4 rounded shadow-sm">
      <h2 className="mb-4">Manage Users</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Update searchTerm on input change
          className="form-control"
        />
      </div>

      <button
        className="btn btn-primary mb-3"
        onClick={() => {
          setSelectedUser(undefined); // Clear selected user when creating a new user
          setShowForm(true); // Show user form for creating a new user
        }}
      >
        Create User
      </button>

      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              {/* Only admins can see the 'Company' column */}
              {user?.role === "admin" && (
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("company")} // Toggle sorting by company
                  className="sortable"
                >
                  Company{" "}
                  {sortConfig.key === "company" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              )}
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("firstName")} // Toggle sorting by firstName
                className="sortable"
              >
                Name{" "}
                {sortConfig.key === "firstName" &&
                  (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("email")} // Toggle sorting by email
                className="sortable"
              >
                Email{" "}
                {sortConfig.key === "email" &&
                  (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("role")} // Toggle sorting by role
                className="sortable"
              >
                Role{" "}
                {sortConfig.key === "role" &&
                  (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th>Projects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Render paginated users */}
            {paginatedUsers.map((u) => (
              <tr key={u.id}>
                {user?.role === "admin" && <td>{u.company}</td>}
                {/* Display company for admin */}
                <td>
                  {u.firstName} {u.lastName}
                </td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  {u.projects.length > 0 ? u.projects.join(", ") : "None"}
                </td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => {
                      setSelectedUser(u); // Set selected user for editing
                      setShowForm(true); // Show user form for editing
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(u.id)} // Trigger delete on click
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
          disabled={currentPage === 1} // Disable 'Previous' if on the first page
          onClick={() => setCurrentPage(currentPage - 1)} // Decrease current page
          className="btn btn-secondary me-1"
        >
          Previous
        </button>
        <button
          disabled={currentPage * itemsPerPage >= sortedUsers.length} // Disable 'Next' if on the last page
          onClick={() => setCurrentPage(currentPage + 1)} // Increase current page
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>

      {/* Show user form (Create or Edit) */}
      {showForm && (
        <UserForm
          user={
            selectedUser
              ? { ...selectedUser, projects: selectedUser.projects.map(Number) }
              : {
                  id: 0,
                  firstName: "",
                  lastName: "",
                  email: "",
                  role: "",
                  companyId: 0,
                  projects: [],
                }
          }
          onSave={() => {
            setShowForm(false); // Hide form after saving
            fetchUsers(); // Refetch users after save
          }}
          onCancel={() => setShowForm(false)} // Hide form on cancel
        />
      )}
    </div>
  );
};

export default ManageUsers;
