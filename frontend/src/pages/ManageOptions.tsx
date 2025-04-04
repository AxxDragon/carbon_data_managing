import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import OptionForm from "./OptionForm";

const TABS = ["Companies", "Activity Types", "Fuel Types", "Units"];

const itemsPerPage = 10;

type OptionType = {
  id: number;
  name: string;
  averageCO2Emission?: number;
};

const Options = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [options, setOptions] = useState<OptionType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState<OptionType | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof OptionType | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  
  const fetchOptions = useCallback(async () => {
  const urls: Record<"Companies" | "Activity Types" | "Fuel Types" | "Units", string> = {
    Companies: "options/companies",
    "Activity Types": "options/activity-types",
    "Fuel Types": "options/fuel-types",
    Units: "options/units",
  };
    try {
      const response = await api.get(urls[activeTab as keyof typeof urls]); // Ensuring TypeScript recognizes the key
      setOptions(response.data);
    } catch (error) {
      console.error("Error fetching options", error);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`options/${activeTab.toLowerCase().replace(" ", "-")}/${id}`);
      fetchOptions();
    } catch (error) {
      console.error("Error deleting option", error);
    }
  };

  const filteredOptions = options.filter((option) => option.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const valueA = a[sortConfig.key] ?? ""; // Defaulting to an empty string
    const valueB = b[sortConfig.key] ?? "";
  
    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
    }
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortConfig.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    
    return 0; // Fallback case
  });

  const paginatedOptions = sortedOptions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (key: keyof OptionType) => {
    setSortConfig((prev) => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  };

  return (
    <div className="container mt-4 custom-container-bg p-4 rounded shadow-sm">
      <h2 className="mb-4">Manage Options</h2>
      
      <div className="mb-4">
        <div className="btn-group" role="group">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`btn btn-outline-success text-white ${tab === activeTab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setShowForm(false);
                setCurrentPage(1);
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 d-flex align-items-center">
        <input
          type="text"
          placeholder="Search options"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control w-50"
        />
        <button
          className="btn btn-primary ms-3"
          onClick={() => {
            setSelectedOption(undefined);
            setShowForm(true);
          }}
        >
          Create New {activeTab === "Companies" ? "Company" : activeTab.slice(0, -1)}
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead>
            <tr>
              <th
                className="sortable"
                style={{ cursor: "pointer" }}
                onClick={() => toggleSort("name")}
              >
                Name {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              {activeTab === "Fuel Types" && (
                <th
                  className="sortable"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("averageCO2Emission")}
                >
                  Avg CO2 Emission {sortConfig.key === "averageCO2Emission" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOptions.map((option) => (
              <tr key={option.id}>
                <td>{option.name}</td>
                {activeTab === "Fuel Types" && <td>{option.averageCO2Emission}</td>}
                <td>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => {
                      setSelectedOption(option);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(option.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between mt-3">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="btn btn-secondary"
        >
          Previous
        </button>
        <button
          disabled={currentPage * itemsPerPage >= sortedOptions.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="btn btn-secondary"
        >
          Next
        </button>
      </div>

      {showForm && (
        <OptionForm
          category={activeTab as "Companies" | "Activity Types" | "Fuel Types" | "Units"}
          option={selectedOption}
          onSave={() => {
            setShowForm(false);
            fetchOptions();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default Options;
