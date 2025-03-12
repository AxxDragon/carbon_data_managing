import { useState, useEffect } from "react";
import axios from "axios";
import OptionForm from "./OptionForm";
import { useCallback } from "react";

const TABS = ["Companies", "Activity Types", "Fuel Types", "Units"];

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


  const fetchOptions = useCallback(async () => {
    try {
      let url = "";
      switch (activeTab) {
        case "Companies":
          url = "http://localhost:8000/options/companies";
          break;
        case "Activity Types":
          url = "http://localhost:8000/options/activity-types";
          break;
        case "Fuel Types":
          url = "http://localhost:8000/options/fuel-types";
          break;
        case "Units":
          url = "http://localhost:8000/options/units";
          break;
        default:
          throw new Error("Invalid category");
      }
  
      const response = await axios.get(url);
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
      await axios.delete(`http://localhost:8000/options/${activeTab.toLowerCase().replace(" ", "-")}/${id}`);
      fetchOptions();
    } catch (error) {
      console.error("Error deleting option", error);
    }
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
              setShowForm(false);  // Closes form when switching tabs
            }}
          >
            {tab}
          </button>
        ))}
      </div>
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white"
        onClick={() => {
          setSelectedOption(undefined);
          setShowForm(true);
        }}
      >
        Create New {activeTab.slice(0, -1)}
      </button>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border px-4 py-2">Name</th>
            {activeTab === "Fuel Types" && (
              <th className="border p-2">Avg CO2 Emission</th>
            )}
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {options.map((option) => (
            <tr key={option.id}>
              <td className="border px-4 py-2">{option.name}</td>
              {activeTab === "Fuel Types" && (
                <td className="border p-2">{option.averageCO2Emission}</td>
              )}
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
