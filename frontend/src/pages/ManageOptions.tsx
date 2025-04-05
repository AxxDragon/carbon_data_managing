import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import OptionForm from "./OptionForm";

// Define the tabs for different categories
const TABS = ["Companies", "Activity Types", "Fuel Types", "Units"];

// Define number of items per page for pagination
const itemsPerPage = 10;

// Define the structure of an OptionType for type safety
type OptionType = {
  id: number;
  name: string;
  averageCO2Emission?: number; // Optional field for fuel types
};

const Options = () => {
  // State hooks to manage component state
  const [activeTab, setActiveTab] = useState(TABS[0]); // Currently selected tab
  const [options, setOptions] = useState<OptionType[]>([]); // List of options for the selected tab
  const [showForm, setShowForm] = useState(false); // Control visibility of the option form (create or edit)
  const [selectedOption, setSelectedOption] = useState<OptionType | undefined>(
    undefined
  ); // Option to be edited
  const [searchTerm, setSearchTerm] = useState(""); // Search filter for options
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const [sortConfig, setSortConfig] = useState<{
    key: keyof OptionType | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" }); // Sorting configuration

  // useCallback hook to memoize the fetchOptions function to prevent unnecessary re-renders
  const fetchOptions = useCallback(async () => {
    // Map active tab to API endpoint for fetching corresponding options
    const urls: Record<
      "Companies" | "Activity Types" | "Fuel Types" | "Units",
      string
    > = {
      Companies: "options/companies",
      "Activity Types": "options/activity-types",
      "Fuel Types": "options/fuel-types",
      Units: "options/units",
    };

    try {
      // Make API call to fetch options for the active tab
      const response = await api.get(urls[activeTab as keyof typeof urls]);
      setOptions(response.data); // Update state with fetched options
    } catch (error) {
      console.error("Error fetching options", error); // Log error if the fetch fails
    }
  }, [activeTab]); // Only recreate fetchOptions when activeTab changes

  // Fetch options whenever the active tab changes
  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]); // Depend on fetchOptions to ensure correct function execution

  // Handle delete option
  const handleDelete = async (id: number) => {
    // Ask user for confirmation before deleting an item
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      // Make API call to delete the option by its ID
      await api.delete(
        `options/${activeTab.toLowerCase().replace(" ", "-")}/${id}`
      );
      fetchOptions(); // Re-fetch options to reflect the deletion
    } catch (error) {
      console.error("Error deleting option", error); // Log error if deletion fails
    }
  };

  // Filter options based on the search term
  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort options based on the selected sorting configuration
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (!sortConfig.key) return 0; // No sorting if no key is selected

    const valueA = a[sortConfig.key] ?? ""; // Default to an empty string if no value
    const valueB = b[sortConfig.key] ?? ""; // Default to an empty string if no value

    // Sort based on the value type (string or number)
    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
    }
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortConfig.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return 0; // Fallback case if types don't match
  });

  // Paginate the sorted options based on current page and items per page
  const paginatedOptions = sortedOptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle sorting direction when a column header is clicked
  const toggleSort = (key: keyof OptionType) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc", // Toggle between ascending and descending
    }));
  };

  return (
    <div className="container mt-4 custom-container-bg p-4 rounded shadow-sm">
      <h2 className="mb-4">Manage Options</h2>

      {/* Tab selection buttons */}
      <div className="mb-4">
        <div className="btn-group" role="group">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`btn btn-outline-success text-white ${
                tab === activeTab ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab(tab); // Set the active tab
                setShowForm(false); // Hide the form when switching tabs
                setCurrentPage(1); // Reset to the first page when tab changes
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar and button to create a new option */}
      <div className="mb-4 d-flex align-items-center">
        <input
          type="text"
          placeholder="Search options"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Update search term state
          className="form-control w-50"
        />
        <button
          className="btn btn-primary ms-3"
          onClick={() => {
            setSelectedOption(undefined); // Clear selected option for new creation
            setShowForm(true); // Show the form for creating a new option
          }}
        >
          Create New{" "}
          {activeTab === "Companies" ? "Company" : activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Table to display the options */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              {/* Sorting column for option name */}
              <th
                className="sortable"
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("name")}
              >
                Name{" "}
                {sortConfig.key === "name" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              {/* Conditionally render the CO2 emission column for "Fuel Types" tab */}
              {activeTab === "Fuel Types" && (
                <th
                  className="sortable"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("averageCO2Emission")}
                >
                  Avg CO2 Emission{" "}
                  {sortConfig.key === "averageCO2Emission" &&
                    (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Render rows for each paginated option */}
            {paginatedOptions.map((option) => (
              <tr key={option.id}>
                <td>{option.name}</td>
                {/* Conditionally render the CO2 emission for "Fuel Types" tab */}
                {activeTab === "Fuel Types" && (
                  <td>{option.averageCO2Emission}</td>
                )}
                <td>
                  {/* Edit button to open the form for editing */}
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => {
                      setSelectedOption(option); // Set selected option to edit
                      setShowForm(true); // Show the form for editing
                    }}
                  >
                    Edit
                  </button>
                  {/* Delete button to remove the option */}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(option.id)} // Delete the selected option
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="d-flex justify-content-between mt-3">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)} // Go to the previous page
          className="btn btn-secondary"
        >
          Previous
        </button>
        <button
          disabled={currentPage * itemsPerPage >= sortedOptions.length}
          onClick={() => setCurrentPage(currentPage + 1)} // Go to the next page
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>

      {/* Conditionally render the OptionForm for creating or editing an option */}
      {showForm && (
        <OptionForm
          category={
            activeTab as "Companies" | "Activity Types" | "Fuel Types" | "Units"
          }
          option={selectedOption}
          onSave={() => {
            setShowForm(false); // Hide the form after saving
            fetchOptions(); // Re-fetch options after save
          }}
          onCancel={() => setShowForm(false)} // Hide the form without saving
        />
      )}
    </div>
  );
};

export default Options;
