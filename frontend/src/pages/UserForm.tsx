import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

// Define the structure of the UserSubmit object that is used to submit user data
interface UserSubmit {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyId: number; // Editable only by admins
  projects: number[];
}

// Define the Props interface for the component's expected props
interface Props {
  user: UserSubmit; // User object that holds user details for editing
  onSave: () => void; // Callback to trigger on save action
  onCancel: () => void; // Callback to trigger on cancel action
}

const UserForm: React.FC<Props> = ({ user, onSave, onCancel }) => {
  const { user: authUser } = useAuth(); // Get the authenticated user details from context
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [companyId, setCompanyId] = useState(user.companyId);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>(
    []
  );
  const [availableProjects, setAvailableProjects] = useState<
    { id: number; name: string; companyId: number }[]
  >([]);

  // Fetch companies (only for admins)
  useEffect(() => {
    if (authUser?.role === "admin") {
      api.get("/options/companies").then((res) => {
        setCompanies(res.data); // Set the list of companies for the admin
      });
    }
  }, [authUser]);

  // Set initial form values and fetch projects
  useEffect(() => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setRole(user.role);
    setCompanyId(user.companyId);
    setProjects([]); // Reset projects until we fetch them

    // Function to fetch projects associated with the user
    const fetchProjects = async () => {
      try {
        // Fetch all available projects
        const projectsRes = await api.get<
          { id: number; name: string; companyId: number }[]
        >("/projects");

        // Filter projects to only show those belonging to the selected user's company
        const filteredProjects = projectsRes.data.filter(
          (p) => p.companyId === user.companyId
        );
        setAvailableProjects(filteredProjects);

        if (user?.id) {
          // Fetch assigned projects with names
          const assignedProjectsRes = await api.get<
            { id: number; name: string }[]
          >(`/users/${user.id}/projects`);

          setProjects(assignedProjectsRes.data); // Store assigned projects with names
        }
      } catch (error) {
        console.error("Error fetching projects", error); // Error handling for fetching projects
      }
    };

    fetchProjects();
  }, [authUser, user]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: UserSubmit = {
      id: user.id,
      firstName,
      lastName,
      email,
      role,
      companyId,
      projects: projects.map((p) => p.id), // Map projects to their IDs for submission
    };

    try {
      await api.put(`/users/${user.id}`, data); // Update user data in the backend

      onSave(); // Trigger the onSave callback if the save is successful
    } catch (error) {
      console.error("Error updating user:", error); // Error handling for save action
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="d-flex flex-wrap gap-2">
        <div className="flex-fill">
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)} // Update state for firstName
            className="form-control"
            required
          />
        </div>

        <div className="flex-fill">
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)} // Update state for lastName
            className="form-control"
            required
          />
        </div>

        <div className="flex-fill">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Update state for email
            className="form-control"
            required
          />
        </div>
      </div>

      {/* Only show role and company fields if the user is an admin */}
      {authUser?.role === "admin" && (
        <div className="d-flex flex-wrap gap-2">
          <div className="flex-fill">
            <label>Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)} // Update state for role
              className="form-select"
            >
              <option value="admin">Admin</option>
              <option value="companyadmin">Company Admin</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="flex-fill">
            <label>Company:</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(Number(e.target.value))} // Update state for companyId
              className="form-select"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Assigned Projects List */}
      <label>Assigned Projects:</label>
      <div className="d-flex flex-wrap gap-2">
        {projects.length > 0 ? (
          projects.map((p) => (
            <span
              key={p.id}
              className="badge bg-danger"
              style={{ cursor: "pointer" }}
              onClick={() =>
                setProjects((prev) => prev.filter((proj) => proj.id !== p.id))
              } // Remove project from assigned list
            >
              {p.name} ❌
            </span>
          ))
        ) : (
          <span>No assigned projects</span> // Message when there are no assigned projects
        )}
      </div>

      {/* Dropdown for Adding New Projects */}
      <label>Add Project:</label>
      <select
        value=""
        onChange={(e) => {
          const projectId = Number(e.target.value);
          if (!projects.find((p) => p.id === projectId)) {
            const selectedProject = availableProjects.find(
              (p) => p.id === projectId
            );
            if (selectedProject) setProjects([...projects, selectedProject]); // Add selected project to assigned list
          }
        }}
        className="form-select"
      >
        <option value="" disabled>
          Select a project
        </option>
        {availableProjects
          .filter((p) => !projects.some((proj) => proj.id === p.id)) // Filter out already assigned projects
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </select>

      <div className="mt-3 d-flex justify-content-between">
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default UserForm;
