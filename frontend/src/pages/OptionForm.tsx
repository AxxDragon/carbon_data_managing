import React, { useState, useEffect } from "react";
import api from "../utils/api";

// Interface to define the structure of Option data
interface Option {
  id?: number;
  name: string;
  averageCO2Emission?: number; // Only for Fuel Types
}

// Props type defining the input properties for the OptionForm component
interface Props {
  category: "Companies" | "Activity Types" | "Fuel Types" | "Units";
  option?: Option; // Optional property that may contain an existing option for editing
  onSave: () => void; // Callback function to execute after saving
  onCancel: () => void; // Callback function to execute after canceling
}

// Functional component for creating or editing an option within a category
const OptionForm: React.FC<Props> = ({
  category,
  option,
  onSave,
  onCancel,
}) => {
  // State to store the name of the option
  const [name, setName] = useState(option?.name || "");
  // State to store the average CO2 emission value (only for "Fuel Types")
  const [averageCO2Emission, setAverageCO2Emission] = useState(
    option?.averageCO2Emission || 0
  );

  // useEffect hook to update state when the 'option' or 'category' changes
  useEffect(() => {
    if (option) {
      setName(option.name);
      // If editing a Fuel Type, also update the CO2 emission field
      if (category === "Fuel Types") {
        setAverageCO2Emission(option.averageCO2Emission || 0);
      }
    } else {
      // Reset fields when switching to "Create New" mode
      setName("");
      if (category === "Fuel Types") {
        setAverageCO2Emission(0);
      }
    }
  }, [option, category]); // Dependency array ensures this effect runs when option or category changes

  // Handle the form submission to either create or update an option
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Construct the API endpoint dynamically based on the category and whether the option exists
    const endpoint = `/options/${category.toLowerCase().replace(" ", "-")}${
      option ? `/${option.id}` : ""
    }`;
    const method = option ? "put" : "post"; // Use PUT for updates, POST for new entries

    // Prepare the data to send in the request
    const data = { name };
    if (category === "Fuel Types") {
      (data as any).averageCO2Emission = averageCO2Emission;
    }

    try {
      // Make the API call to save the data
      await api[method](endpoint, data);
      onSave(); // Call the onSave function to notify the parent component that the operation is complete
    } catch (error) {
      console.error("Error submitting option:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="d-flex flex-wrap gap-2">
        <div className="flex-fill">
          <label htmlFor="name" className="form-label">
            Name:
          </label>
          <input
            type="text"
            id="name"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)} // Update the name state on user input
            required
          />
        </div>

        {/* Only display the CO2 emission input field if the category is "Fuel Types" */}
        {category === "Fuel Types" && (
          <div className="flex-fill">
            <label htmlFor="averageCO2Emission" className="form-label">
              Average CO2 Emission (kg CO2/unit):
            </label>
            <input
              type="number"
              id="averageCO2Emission"
              className="form-control"
              value={averageCO2Emission}
              onChange={(e) =>
                setAverageCO2Emission(parseFloat(e.target.value) || 0)
              } // Update CO2 emission state
              step="0.01"
              required
            />
          </div>
        )}
      </div>

      <div className="d-flex justify-content-between mt-4">
        {/* Submit button for saving the option */}
        <button type="submit" className="btn btn-primary">
          Save
        </button>
        {/* Cancel button for closing the form without saving */}
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default OptionForm;
