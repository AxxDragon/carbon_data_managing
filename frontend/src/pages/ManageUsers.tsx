import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import UserForm from "./UserForm";

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

const itemsPerPage = 10;

const ManageUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("users", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const projectsRes = await api.get("projects", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const projectMap = new Map(
        projectsRes.data.map((p: { id: number; name: string }) => [p.id, p.name])
      );

      const formattedUsers = response.data.map((u: User) => ({
        ...u,
        projects: u.projects.map((projectId) => projectMap.get(Number(projectId)) || "Unknown"),
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: number) => {
    if (id === user?.id) {
      alert("You cannot delete yourself.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await api.delete(`users/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  // Search filter
  const filteredUsers = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.role}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Sorting logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valueA = a[sortConfig.key] ?? "";
    const valueB = b[sortConfig.key] ?? "";

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortConfig.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return 0;
  });

  // Pagination logic
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Toggle sorting
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
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>
  
      <button
        className="btn btn-primary mb-3"
        onClick={() => {
          setSelectedUser(undefined);
          setShowForm(true);
        }}
      >
        Create User
      </button>
  
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              {user?.role === "admin" && (
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("company")}
                  className="sortable"
                >
                  Company {sortConfig.key === "company" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              )}
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("firstName")}
                className="sortable"
              >
                Name {sortConfig.key === "firstName" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("email")}
                className="sortable"
              >
                Email {sortConfig.key === "email" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("role")}
                className="sortable"
              >
                Role {sortConfig.key === "role" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th>Projects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u) => (
              <tr key={u.id}>
                {user?.role === "admin" && <td>{u.company}</td>}
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.projects.length > 0 ? u.projects.join(", ") : "None"}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => {
                      setSelectedUser(u);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(u.id)}
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
          disabled={currentPage * itemsPerPage >= sortedUsers.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>
  
      {showForm && (
        <UserForm
          user={
            selectedUser
              ? { ...selectedUser, projects: selectedUser.projects.map(Number) }
              : { id: 0, firstName: "", lastName: "", email: "", role: "", companyId: 0, projects: [] }
          }
          onSave={() => {
            setShowForm(false);
            fetchUsers();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default ManageUsers;
