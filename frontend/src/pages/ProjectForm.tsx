import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

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
    const [companyId, setCompanyId] = useState<number | "">("");
    const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
    const [companyAdminCompanyId, setCompanyAdminCompanyId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch companyId for companyadmins
    useEffect(() => {
        if (user?.role === "companyadmin") {
            api.get("/users/me", {
                headers: { Authorization: `Bearer ${user?.token}` },
            })
                .then((res) => setCompanyAdminCompanyId(res.data.companyId))
                .catch((error) => console.error("Error fetching user data", error));
        }
    }, [user]);

    // Fetch companies (only for admins)
    useEffect(() => {
        if (user?.role === "admin") {
            api.get("/options/companies").then((res) => {
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
                const foundCompany = companies.find((c) => c.name === project.company);
                setCompanyId(foundCompany ? foundCompany.id : "");
            } else {
                setCompanyId(companyAdminCompanyId || ""); // companyadmin gets their company ID
            }
        } else {
            setName("");
            setStartDate("");
            setEndDate("");
            setCompanyId(user?.role === "admin" ? "" : companyAdminCompanyId || ""); // Default for admins: empty, companyadmins: their ID
        }
    }, [project, user, companyAdminCompanyId, companies]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const method = project ? "put" : "post";
        const url = project ? `/projects/${project.id}` : "/projects";

        const formattedEndDate = endDate && endDate.trim() !== "" ? endDate : null;
        const data: ProjectSubmit = {
            name,
            startDate,
            endDate: formattedEndDate,
            companyId: Number(companyId),
        };

        try {
            await api[method](url, data, {
                headers: { Authorization: `Bearer ${user?.token}` },
            });
            onSave();
        } catch (error) {
            setError("Failed to save project. Please try again.");
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="p-3">
            <div className="d-flex flex-wrap gap-2">
                <div className="flex-fill">
                    <label>Project Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-control"
                        required
                    />
                </div>

                <div className="flex-fill">
                    <label>Start Date:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="form-control"
                        required
                    />
                </div>

                <div className="flex-fill">
                    <label>End Date:</label>
                    <input
                        type="date"
                        value={endDate || ""}
                        onChange={(e) => setEndDate(e.target.value || null)}
                        className="form-control"
                    />
                </div>

                {user?.role === "admin" && companies.length > 0 && (
                    <div className="flex-fill">
                        <label>Company:</label>
                        <select
                            value={companyId}
                            onChange={(e) => setCompanyId(Number(e.target.value))}
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

            {error && <p className="text-danger">{error}</p>}

            <div className="d-flex justify-content-between mt-3">
                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? "Saving..." : "Save Project"}
                </button>
                <button type="button" onClick={onCancel} className="btn btn-secondary">
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default ProjectForm;
