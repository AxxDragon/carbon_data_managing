import { useState, useEffect } from "react";
import axios from "axios";
import OptionForm from "./OptionForm";

const TABS = ["Companies", "Activity Types", "Fuel Types", "Units"];

type OptionType = {
  id: number;
  name: string;
};

const Options = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [options, setOptions] = useState<OptionType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState<OptionType | undefined>(undefined);

  useEffect(() => {
    fetchOptions();
  });

  const fetchOptions = async () => {
    try {
      const res = await axios.get(`/api/options?category=${activeTab}`);
      setOptions(res.data);
    } catch (error) {
      console.error("Error fetching options", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`/api/options/${id}`);
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
            onClick={() => setActiveTab(tab)}
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
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {options.map((option) => (
            <tr key={option.id}>
              <td className="border px-4 py-2">{option.name}</td>
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
        category={activeTab as "companies" | "activity-types" | "fuel-types" | "units"}
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
