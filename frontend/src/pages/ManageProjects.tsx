import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import ProjectForm from "./ProjectForm";

type Project = {
  id: number;
  name: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  company: string;
  companyId: number; // Admins can edit this, companyadmins have it fixed
};

const ManageProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8000/projects", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      
      // Ensure endDate is always correctly handled as null when necessary
      const formattedProjects = response.data.map((p: Project) => ({
        ...p,
        endDate: p.endDate || null, // Normalize `null` endDate
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error("Error fetching projects", error);
    }
  }, [user?.token]);
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    await axios.delete(`http://localhost:8000/projects/${id}`, {
      headers: { Authorization: `Bearer ${user?.token}` },
    });
    fetchProjects();
  };

  return (
    <div>
      <h2>Manage Projects</h2>
      <button onClick={() => { setSelectedProject(undefined); setShowForm(true); }}>Create Project</button>
      <table>
        <thead>
          <tr>
            {user?.role === "admin" && <th>Company</th>}
            <th>Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              {user?.role === "admin" && <td>{p.company}</td>}
              <td>{p.name}</td>
              <td>{p.startDate}</td>
              <td>{p.endDate || "N/A"}</td>
              <td>{p.status}</td>
              <td>
                <button onClick={() => { setSelectedProject(p); setShowForm(true); }}>Edit</button>
                <button onClick={() => handleDelete(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showForm && <ProjectForm project={selectedProject} onSave={() => { setShowForm(false); fetchProjects(); }} onCancel={() => setShowForm(false)} />}
    </div>
  );
};

export default ManageProjects;
