import React, { useState, useEffect } from "react";
import api from "../utils/api";

interface Option {
    id?: number;
    name: string;
    averageCO2Emission?: number; // Only for Fuel Types
}

interface Props {
    category: "Companies" | "Activity Types" | "Fuel Types" | "Units";
    option?: Option;
    onSave: () => void;
    onCancel: () => void;
}

const OptionForm: React.FC<Props> = ({ category, option, onSave, onCancel }) => {
    const [name, setName] = useState(option?.name || "");
    const [averageCO2Emission, setAverageCO2Emission] = useState(option?.averageCO2Emission || 0);

    useEffect(() => {
        if (option) {
            setName(option.name);
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
    }, [option, category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = `/options/${category.toLowerCase().replace(" ", "-")}${option ? `/${option.id}` : ""}`;
        const method = option ? "put" : "post";

        const data = { name };
        if (category === "Fuel Types") {
            (data as any).averageCO2Emission = averageCO2Emission;
        }

        try {
            await api[method](endpoint, data);
            onSave();
        } catch (error) {
            console.error("Error submitting option:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-3">
            <div className="d-flex flex-wrap gap-2">
                <div className="flex-fill">
                    <label htmlFor="name" className="form-label">Name:</label>
                    <input
                        type="text"
                        id="name"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

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
                            onChange={(e) => setAverageCO2Emission(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            required
                        />
                    </div>
                )}
            </div>

            <div className="d-flex justify-content-between mt-4">
                <button type="submit" className="btn btn-primary">
                    Save
                </button>
                <button type="button" onClick={onCancel} className="btn btn-secondary">
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default OptionForm;
