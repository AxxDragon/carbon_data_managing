import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
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
      const response = await axios.get("http://localhost:8000/users", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const projectsRes = await axios.get("http://localhost:8000/projects", {
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
      await axios.delete(`http://localhost:8000/users/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  // 🔍 Search filter
  const filteredUsers = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.role}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // 🔀 Sorting logic
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

  // 📄 Pagination logic
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 🔼 Toggle sorting
  const toggleSort = (key: keyof User) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Manage Users</h2>
      <input
        type="text"
        placeholder="Search users"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border w-full"
      />
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white"
        onClick={() => { setSelectedUser(undefined); setShowForm(true); }}
      >
        Create User
      </button>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            {user?.role === "admin" && (
              <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("company")}>
                Company {sortConfig.key === "company" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
            )}
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("firstName")}>
              Name {sortConfig.key === "firstName" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("email")}>
              Email {sortConfig.key === "email" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("role")}>
              Role {sortConfig.key === "role" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border px-4 py-2">Projects</th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((u) => (
            <tr key={u.id}>
              {user?.role === "admin" && <td className="border px-4 py-2">{u.company}</td>}
              <td className="border px-4 py-2">{u.firstName} {u.lastName}</td>
              <td className="border px-4 py-2">{u.email}</td>
              <td className="border px-4 py-2">{u.role}</td>
              <td className="border px-4 py-2">{u.projects.length > 0 ? u.projects.join(", ") : "None"}</td>
              <td className="border px-4 py-2">
                <button
                  className="mr-2 px-2 py-1 bg-yellow-500 text-white"
                  onClick={() => { 
                    setSelectedUser(undefined); 
                    setTimeout(() => setSelectedUser(u), 0); 
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button className="px-2 py-1 bg-red-500 text-white" onClick={() => handleDelete(u.id)}>
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
          disabled={currentPage * itemsPerPage >= sortedUsers.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-4 py-2 bg-gray-300"
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
          onSave={() => { setShowForm(false); fetchUsers(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default ManageUsers;
