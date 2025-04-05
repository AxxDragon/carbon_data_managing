import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import ProjectForm from "./ProjectForm";

// Define a TypeScript type for the project structure
type Project = {
  id: number;
  name: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  company: string;
  companyId: number;
};

const itemsPerPage = 10; // Set number of items per page for pagination

// Component to manage the projects
const ManageProjects = () => {
  const { user } = useAuth(); // Get the authenticated user from context
  const [projects, setProjects] = useState<Project[]>([]); // State to hold project data
  const [showForm, setShowForm] = useState(false); // State to control visibility of the project form
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(
    undefined
  ); // State for selected project
  const [searchTerm, setSearchTerm] = useState(""); // State for the search term
  const [currentPage, setCurrentPage] = useState(1); // State for the current page in pagination
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Project | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" }); // Sorting configuration

  // Function to fetch projects from API with authorization token
  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects", {
        headers: { Authorization: `Bearer ${user?.token}` }, // Authorization header with token
      });
      // Format the project data to handle null/undefined end dates
      const formattedProjects = response.data.map((p: Project) => ({
        ...p,
        endDate: p.endDate || null, // Default end date to null if not present
      }));
      setProjects(formattedProjects); // Set fetched projects in state
    } catch (error) {
      console.error("Error fetching projects", error); // Handle fetch error
    }
  }, [user?.token]); // Re-fetch when token changes

  // Use effect hook to fetch projects when the component mounts or fetchProjects changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Function to delete a project with confirmation
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this project?"))
      return; // Show confirmation before delete
    try {
      await api.delete(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` }, // Authorization header with token
      });
      fetchProjects(); // Re-fetch projects after delete
    } catch (error) {
      console.error("Error deleting project", error); // Handle delete error
    }
  };

  // Search filter logic - filters projects by name, company, and status
  const filteredProjects = projects.filter(
    (p) =>
      `${p.name} ${p.company} ${p.status}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) // Case insensitive search
  );

  // Sorting logic for the projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (!sortConfig.key) return 0; // If no sorting key, return unsorted
    const valueA = a[sortConfig.key] ?? ""; // Get the value to sort by for item A
    const valueB = b[sortConfig.key] ?? ""; // Get the value to sort by for item B

    if (typeof valueA === "string" && typeof valueB === "string") {
      // If the values are strings, perform a lexicographical comparison
      return sortConfig.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return 0; // Fallback case for unsupported types
  });

  // Pagination logic - get the paginated projects for the current page
  const paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Function to toggle the sorting direction for a given key (column)
  const toggleSort = (key: keyof Project) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc", // Toggle sort direction
    }));
  };

  return (
    <div className="container mt-4 custom-container-bg p-4 rounded shadow-sm">
      <h2 className="mb-4">Manage Projects</h2>
      <div className="mb-4">
        {/* Search input to filter projects */}
        <input
          type="text"
          placeholder="Search projects"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Update searchTerm on input change
          className="form-control"
        />
      </div>
      {/* Button to show the form for creating a new project */}
      <button
        className="btn btn-primary mb-3"
        onClick={() => {
          setSelectedProject(undefined);
          setShowForm(true);
        }}
      >
        Create Project
      </button>
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              {/* Conditionally show the company column for users with 'admin' role */}
              {user?.role === "admin" && (
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("company")} // Toggle sort on company column
                  className="sortable"
                >
                  Company{" "}
                  {sortConfig.key === "company" &&
                    (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                </th>
              )}
              {/* Always show the following columns with sorting */}
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("name")}
                className="sortable"
              >
                Name{" "}
                {sortConfig.key === "name" &&
                  (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("startDate")}
                className="sortable"
              >
                Start Date{" "}
                {sortConfig.key === "startDate" &&
                  (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("endDate")}
                className="sortable"
              >
                End Date{" "}
                {sortConfig.key === "endDate" &&
                  (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("status")}
                className="sortable"
              >
                Status{" "}
                {sortConfig.key === "status" &&
                  (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
              <th>Actions</th> {/* Column for action buttons */}
            </tr>
          </thead>
          <tbody>
            {/* Render the projects as rows in the table */}
            {paginatedProjects.map((p) => (
              <tr key={p.id}>
                {user?.role === "admin" && <td>{p.company}</td>}{" "}
                {/* Only show company for admin */}
                <td>{p.name}</td>
                <td>{p.startDate}</td>
                <td>{p.endDate || "N/A"}</td>{" "}
                {/* Display "N/A" if end date is null */}
                <td>{p.status}</td>
                <td>
                  {/* Edit button to open the form for editing the selected project */}
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => {
                      setSelectedProject(p);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  {/* Delete button to remove the project */}
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
        {/* Pagination controls */}
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)} // Navigate to previous page
          className="btn btn-secondary me-1"
        >
          Previous
        </button>
        <button
          disabled={currentPage * itemsPerPage >= sortedProjects.length}
          onClick={() => setCurrentPage(currentPage + 1)} // Navigate to next page
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>

      {/* Project form dialog (create or edit) */}
      {showForm && (
        <ProjectForm
          project={selectedProject}
          onSave={() => {
            setShowForm(false);
            fetchProjects();
          }} // Save and re-fetch projects after submit
          onCancel={() => setShowForm(false)} // Close the form without saving
        />
      )}
    </div>
  );
};

export default ManageProjects;
