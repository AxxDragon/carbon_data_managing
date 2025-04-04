import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import ProjectForm from "./ProjectForm";

type Project = {
  id: number;
  name: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  company: string;
  companyId: number;
};

const itemsPerPage = 10;

const ManageProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Project | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects", {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const formattedProjects = response.data.map((p: Project) => ({
        ...p,
        endDate: p.endDate || null,
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
    try {
      await api.delete(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project", error);
    }
  };

  // 🔍 Search filter
  const filteredProjects = projects.filter((p) =>
    `${p.name} ${p.company} ${p.status}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // 🔀 Sorting logic
  const sortedProjects = [...filteredProjects].sort((a, b) => {
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
  const paginatedProjects = sortedProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 🔼 Toggle sorting
  const toggleSort = (key: keyof Project) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="container mt-4 custom-container-bg p-4 rounded shadow-sm">
      <h2 className="mb-4">Manage Projects</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search projects"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>
      <button
        className="btn btn-primary mb-3"
        onClick={() => { setSelectedProject(undefined); setShowForm(true); }}
      >
        Create Project
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
                onClick={() => toggleSort("name")}
                className="sortable"
              >
                Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("startDate")}
                className="sortable"
              >
                Start Date {sortConfig.key === "startDate" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("endDate")}
                className="sortable"
              >
                End Date {sortConfig.key === "endDate" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("status")}
                className="sortable"
              >
                Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.map((p) => (
              <tr key={p.id}>
                {user?.role === "admin" && <td>{p.company}</td>}
                <td>{p.name}</td>
                <td>{p.startDate}</td>
                <td>{p.endDate || "N/A"}</td>
                <td>{p.status}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => { setSelectedProject(p); setShowForm(true); }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(p.id)}
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
          disabled={currentPage * itemsPerPage >= sortedProjects.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>

      {showForm && (
        <ProjectForm
          project={selectedProject}
          onSave={() => { setShowForm(false); fetchProjects(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default ManageProjects;
