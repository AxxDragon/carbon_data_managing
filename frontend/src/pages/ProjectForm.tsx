import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";  // Corrected import

interface ProjectSubmit {
    id?: number;
    name: string;
    startDate: string;
    endDate?: string | null;
    companyId: number;
}

interface Props {
    project?: ProjectSubmit & { company?: string };
    onSave: () => void;
    onCancel: () => void;
}

const ProjectForm: React.FC<Props> = ({ project, onSave, onCancel }) => {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState<string | null>(""); 
    const [companyId, setCompanyId] = useState<number | "">(""); // Start empty
    const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
    const [companyAdminCompanyId, setCompanyAdminCompanyId] = useState<number | null>(null); // Stores API-fetched companyId

    // Fetch companyId for companyadmins
    useEffect(() => {
        if (user?.role === "companyadmin") {
            api.get("/users/me", {
                headers: { Authorization: `Bearer ${user?.token}` }
            })
            .then((res) => setCompanyAdminCompanyId(res.data.companyId))
            .catch((error) => console.error("Error fetching user data", error));
        }
    }, [user]);

    // Fetch companies (only for admins)
    useEffect(() => {
        if (user?.role === "admin") {
            api.get("/options/companies").then((res) => { // No need to specify full URL
                setCompanies(res.data);
            });
        }
    }, [user]);

    // Set initial form values
    useEffect(() => {
        if (project) {
            setName(project.name);
            setStartDate(project.startDate);
            setEndDate(project.endDate || "");
            if (user?.role === "admin") {
                // Resolve companyId from name for editing
                const foundCompany = companies.find((c) => c.name === project.company);
                setCompanyId(foundCompany ? foundCompany.id : "");
            } else {
                setCompanyId(companyAdminCompanyId || ""); // Ensure companyadmin gets their ID
            }
        } else {
            // Reset fields for new project
            setName("");
            setStartDate("");
            setEndDate("");
            setCompanyId(user?.role === "admin" ? "" : companyAdminCompanyId || ""); // Default for admins: empty, companyadmins: their ID
        }
    }, [project, user, companyAdminCompanyId, companies]); // Runs when `project` or dependencies change

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = project ? "put" : "post";
        const url = project ? `/projects/${project.id}` : "/projects"; // No need to specify full URL
    
        // Ensure endDate is `null` if empty
        const formattedEndDate = endDate && endDate.trim() !== "" ? endDate : null;
        const data: ProjectSubmit = { 
            name, 
            startDate, 
            endDate: formattedEndDate, 
            companyId: Number(companyId) 
        };
    
        try {
            await api[method](url, data, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            onSave();
        } catch (error) {
            console.error("Error submitting project:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>Project Name:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

            <label>Start Date:</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />

            <label>End Date:</label>
            <input type="date" value={endDate || ""} onChange={(e) => setEndDate(e.target.value || null)} />

            {/* Only show dropdown for admins */}
            {user?.role === "admin" && companies.length > 0 && (
                <>
                    <label>Company:</label>
                    <select value={companyId} onChange={(e) => setCompanyId(Number(e.target.value))} required>
                        <option value="" disabled>Select a company</option>
                        {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </>
            )}

            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>Cancel</button>
        </form>
    );
};

export default ProjectForm;
