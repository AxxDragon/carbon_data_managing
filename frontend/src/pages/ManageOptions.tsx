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
    <div className="p-4">
      <h2 className="text-2xl mb-4">Manage Options</h2>
      <div className="flex space-x-4 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 border ${tab === activeTab ? "bg-gray-300" : "bg-white"}`}
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
      <input
        type="text"
        placeholder="Search options"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border w-full"
      />
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white"
        onClick={() => {
          setSelectedOption(undefined);
          setShowForm(true);
        }}
      >
        Create New {activeTab === "Companies" ? "Company" : activeTab.slice(0, -1)}
      </button>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("name")}>
              Name
              {sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            {activeTab === "Fuel Types" && (
              <th className="border px-4 py-2 cursor-pointer" onClick={() => toggleSort("averageCO2Emission")}>
                Avg CO2 Emission
                {sortConfig.key === "averageCO2Emission" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
            )}
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedOptions.map((option) => (
            <tr key={option.id}>
              <td className="border px-4 py-2">{option.name}</td>
              {activeTab === "Fuel Types" && <td className="border px-4 py-2">{option.averageCO2Emission}</td>}
              <td className="border px-4 py-2">
                <button
                  className="mr-2 px-2 py-1 bg-yellow-500 text-white"
                  onClick={() => {
                    setSelectedOption(option);
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="px-2 py-1 bg-red-500 text-white"
                  onClick={() => handleDelete(option.id)}
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
          disabled={currentPage * itemsPerPage >= sortedOptions.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-4 py-2 bg-gray-300"
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
