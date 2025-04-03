import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";  // Corrected import

interface UserSubmit {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId: number; // Editable only by admins
  projects: number[];
}

interface Props {
  user: UserSubmit;
  onSave: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<Props> = ({ user, onSave, onCancel }) => {
  const { user: authUser } = useAuth();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [companyId, setCompanyId] = useState(user.companyId);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [availableProjects, setAvailableProjects] = useState<{ id: number; name: string; companyId: number }[]>([]);

  // Fetch companies (only for admins)
  useEffect(() => {
    if (authUser?.role === "admin") {
      api.get("/options/companies").then((res) => {  // No need to specify full URL
        setCompanies(res.data);
      });
    }
  }, [authUser]);

  useEffect(() => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setRole(user.role);
    setCompanyId(user.companyId);
    setProjects([]); // Reset projects until we fetch them

    const fetchProjects = async () => {
      try {
        // Fetch all available projects
        const projectsRes = await api.get<{ id: number; name: string; companyId: number }[]>( // No need to specify full URL
          "/projects"
        );
    
        // Filter projects to only show those belonging to the selected user's company
        const filteredProjects = projectsRes.data.filter((p) => p.companyId === user.companyId);
        setAvailableProjects(filteredProjects);
    
        if (user?.id) {
          // Fetch assigned projects with names
          const assignedProjectsRes = await api.get<{ id: number; name: string }[]>( // No need to specify full URL
            `/users/${user.id}/projects`
          );
    
          setProjects(assignedProjectsRes.data); // Store assigned projects with names
        }
      } catch (error) {
        console.error("Error fetching projects", error);
      }
    };
    
    fetchProjects();
  }, [authUser, user]);  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: UserSubmit = { 
      id: user.id, 
      firstName, 
      lastName, 
      email, 
      role, 
      companyId, 
      projects: projects.map((p) => p.id), // Send only IDs
    };
  
    try {
      await api.put(`/users/${user.id}`, data);  // No need to specify full URL
  
      onSave();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>First Name:</label>
      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />

      <label>Last Name:</label>
      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />

      <label>Email:</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

      {/* Admins can change role, companyadmins cannot */}
      {authUser?.role === "admin" && (
        <>
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="companyadmin">Company Admin</option>
            <option value="user">User</option>
          </select>

          <label>Company:</label>
          <select value={companyId} onChange={(e) => setCompanyId(Number(e.target.value))}>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Assigned Projects List */}
      <label>Assigned Projects:</label>
      <div>
        {projects.length > 0 ? (
          projects.map((p) => (
            <span key={p.id} style={{ marginRight: "10px", cursor: "pointer", color: "red" }}
              onClick={() => setProjects((prev) => prev.filter((proj) => proj.id !== p.id))}>
              {p.name} ❌
            </span>
          ))
        ) : (
          <span>No assigned projects</span>
        )}
      </div>

      {/* Dropdown for Adding New Projects */}
      <label>Add Project:</label>
      <select
        value=""
        onChange={(e) => {
          const projectId = Number(e.target.value);
          if (!projects.find((p) => p.id === projectId)) {
            const selectedProject = availableProjects.find((p) => p.id === projectId);
            if (selectedProject) setProjects([...projects, selectedProject]);
          }
        }}
      >
        <option value="" disabled>Select a project</option>
        {availableProjects
          .filter((p) => !projects.some((proj) => proj.id === p.id)) // Exclude already assigned projects
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </select>

      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default UserForm;
