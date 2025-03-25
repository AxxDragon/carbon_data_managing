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
  company?: string; // Admins see this, companyadmins do not
  companyId: number;
  projects: string[];
};

const ManageUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

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
  
      // Ensure projects are stored as names, not IDs
      const formattedUsers = response.data.map((u: User) => ({
        ...u,
        projects: u.projects.map((projectId) => projectMap.get(Number(projectId)) || "Unknown"),
      }));
  
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  }, [user?.token]);
  

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
  

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div>
      <h2>Manage Users</h2>
      <table>
        <thead>
          <tr>
            {user?.role === "admin" && <th>Company</th>}
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Projects</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              {user?.role === "admin" && <td>{u.company}</td>}
              <td>{u.firstName} {u.lastName}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.projects.length > 0 ? u.projects.join(", ") : "None"}</td>
              <td>
              <button onClick={() => { 
                if (u) { 
                  setSelectedUser(undefined); // Force reset
                  setTimeout(() => setSelectedUser(u), 0); // Set the new user after a slight delay
                  setShowForm(true);
                }
              }}>Edit</button>
                <button onClick={() => handleDelete(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
