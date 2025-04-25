import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

// Interface to define the structure of Project data
interface ProjectSubmit {
  id?: number;
  name: string;
  startDate: string;
  endDate?: string | null;
  companyId: number;
}

// Props type defining the input properties for the ProjectForm component
interface Props {
  project?: ProjectSubmit & { company?: string }; // Optional property for an existing project (to edit)
  onSave: () => void; // Callback function when the project is successfully saved
  onCancel: () => void; // Callback function when the form is canceled
}

// ProjectForm component for creating or editing a project
const ProjectForm: React.FC<Props> = ({ project, onSave, onCancel }) => {
  const { user } = useAuth(); // Retrieve the current authenticated user context
  const [name, setName] = useState(""); // State for the project name
  const [startDate, setStartDate] = useState(""); // State for the start date
  const [endDate, setEndDate] = useState<string | null>(""); // State for the optional end date
  const [companyId, setCompanyId] = useState<number | "">(""); // State for the associated company ID
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>(
    []
  ); // State to store the list of companies
  const [companyAdminCompanyId, setCompanyAdminCompanyId] = useState<
    number | null
  >(null); // State for the company ID of a company admin
  const [loading, setLoading] = useState(false); // State for tracking loading status
  const [error, setError] = useState(""); // State to store any error message

  // Fetch companyId for companyadmins
  useEffect(() => {
    // Only fetch if the user is a company admin
    if (user?.role === "companyadmin") {
      api
        .get("/users/me", {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        .then((res) => setCompanyAdminCompanyId(res.data.companyId)) // Set the companyId for company admin
        .catch((error) => console.error("Error fetching user data", error)); // Log error if fetching fails
    }
  }, [user]);

  // Fetch the list of companies for admins
  useEffect(() => {
    // Only fetch if the user is an admin
    if (user?.role === "admin") {
      api.get("/options/companies").then((res) => {
        setCompanies(res.data); // Set the list of companies
      });
    }
  }, [user]);

  // Set initial form values if editing an existing project
  useEffect(() => {
    if (project) {
      setName(project.name); // Set the name field
      setStartDate(project.startDate); // Set the start date field
      setEndDate(project.endDate || ""); // Set the end date field (default to empty if null)
      // If the user is an admin, find the company associated with the project and set it
      if (user?.role === "admin") {
        const foundCompany = companies.find((c) => c.name === project.company);
        setCompanyId(foundCompany ? foundCompany.id : ""); // Set the company ID
      } else {
        setCompanyId(companyAdminCompanyId || ""); // Company admin gets their own company ID
      }
    } else {
      // Reset fields when creating a new project
      setName("");
      setStartDate("");
      setEndDate("");
      setCompanyId(user?.role === "admin" ? "" : companyAdminCompanyId || "");
    }
  }, [project, user, companyAdminCompanyId, companies]);

  // Handle form submission for creating or updating a project
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true); // Set loading state while saving the project
    setError(""); // Clear any previous error messages

    // Determine whether to use POST or PUT based on whether the project exists
    const method = project ? "put" : "post";
    const url = project ? `/projects/${project.id}` : "/projects"; // Set the URL for the API request

    // Format end date to null if it's empty or whitespace
    const formattedEndDate = endDate && endDate.trim() !== "" ? endDate : null;

    // Prepare the data to send in the request
    const data: ProjectSubmit = {
      name,
      startDate,
      endDate: formattedEndDate,
      companyId: Number(companyId),
    };

    try {
      // Make the API call to save the project
      await api[method](url, data, {
        headers: { Authorization: `Bearer ${user?.token}` }, // Include the user token for authorization
      });
      onSave(); // Call the onSave function to notify the parent component that the project has been saved
    } catch (error) {
      setError("Failed to save project. Please try again."); // Set error message if the API request fails
    }

    setLoading(false); // Reset loading state after the request
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="d-flex flex-wrap gap-2">
        <div className="flex-fill">
          <label htmlFor="projectName">Project Name:</label>
          <input
            type="text"
            id="projectName"
            value={name}
            onChange={(e) => setName(e.target.value)} // Update name state on input change
            className="form-control"
            required
          />
        </div>

        <div className="flex-fill">
          <label htmlFor="projectStartDate">Start Date:</label>
          <input
            type="date"
            id="projectStartDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)} // Update start date state on input change
            className="form-control"
            required
          />
        </div>

        <div className="flex-fill">
          <label htmlFor="projectEndDate">End Date:</label>
          <input
            type="date"
            id="projectEndDate"
            value={endDate || ""}
            onChange={(e) => setEndDate(e.target.value || null)} // Update end date state on input change
            className="form-control"
          />
        </div>

        {/* Only show company select if the user is an admin and there are companies to choose from */}
        {user?.role === "admin" && companies.length > 0 && (
          <div className="flex-fill">
            <label htmlFor="projectCompany">Company:</label>
            <select
              value={companyId}
              id="projectCompany"
              onChange={(e) => setCompanyId(Number(e.target.value))} // Update company ID state on selection change
              className="form-select"
              required
            >
              <option value="" disabled>
                Select a company
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Display error message if any error occurs during the save process */}
      {error && <p className="text-danger">{error}</p>}

      <div className="d-flex justify-content-between mt-3">
        {/* Submit button for saving the project */}
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Saving..." : "Save Project"}
        </button>
        {/* Cancel button to cancel the form */}
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProjectForm;
