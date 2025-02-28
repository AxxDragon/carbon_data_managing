import React, { useState, useEffect } from "react";
import axios from "axios";

interface Option {
    id?: number;
    name: string;
    averageCO2Emission?: number; // Only for Fuel Types
}

interface Props {
    category: "companies" | "activity-types" | "fuel-types" | "units";
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
            if (category === "fuel-types") {
                setAverageCO2Emission(option.averageCO2Emission || 0);
            }
        }
    }, [option, category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = `/options/${category.toLowerCase().replace(" ", "-")}${option ? `/${option.id}` : ""}`;
        const method = option ? "put" : "post";

        const data = { name };
        if (category === "fuel-types") {
            (data as any).averageCO2Emission = averageCO2Emission;
        }

        await axios[method](endpoint, data);
        onSave();
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>Name:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

            {category === "fuel-types" && (
                <>
                    <label>Average CO2 Emission (kg CO2/unit):</label>
                    <input
                        type="number"
                        value={averageCO2Emission}
                        onChange={(e) => setAverageCO2Emission(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        required
                    />
                </>
            )}

            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
        </form>
    );
};

export default OptionForm;
