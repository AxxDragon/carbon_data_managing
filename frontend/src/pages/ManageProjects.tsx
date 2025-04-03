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
    <div className="flex flex-col items-center mt-10 p-4">
      <h2 className="text-2xl mb-4">Manage Projects</h2>
      <input
        type="text"
        placeholder="Search projects"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 mb-4 w-full"
      />
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white"
        onClick={() => { setSelectedProject(undefined); setShowForm(true); }}
      >
        Create Project
      </button>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            {user?.role === "admin" && (
              <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("company")}>
                Company {sortConfig.key === "company" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
            )}
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("name")}>
              Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("startDate")}>
              Start Date {sortConfig.key === "startDate" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("endDate")}>
              End Date {sortConfig.key === "endDate" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("status")}>
              Status {sortConfig.key === "status" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProjects.map((p) => (
            <tr key={p.id}>
              {user?.role === "admin" && <td className="border px-4 py-2">{p.company}</td>}
              <td className="border px-4 py-2">{p.name}</td>
              <td className="border px-4 py-2">{p.startDate}</td>
              <td className="border px-4 py-2">{p.endDate || "N/A"}</td>
              <td className="border px-4 py-2">{p.status}</td>
              <td className="border px-4 py-2">
                <button
                  className="mr-2 px-2 py-1 bg-yellow-500 text-white"
                  onClick={() => { setSelectedProject(p); setShowForm(true); }}
                >
                  Edit
                </button>
                <button
                  className="px-2 py-1 bg-red-500 text-white"
                  onClick={() => handleDelete(p.id)}
                >
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
          disabled={currentPage * itemsPerPage >= sortedProjects.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-4 py-2 bg-gray-300"
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
