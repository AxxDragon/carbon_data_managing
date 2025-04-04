import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";

const ConsumptionForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // Get consumption ID from URL if editing
  const isEditing = Boolean(id);
  const todayDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
  
  const [formData, setFormData] = useState({
    projectId: "",
    amount: "",
    startDate: "",
    endDate: "",
    reportDate: todayDate,
    description: "",
    activityTypeId: "",
    fuelTypeId: "",
    unitId: "",
    userId: user?.id || "",
  });

  // Dropdown options
  const [projects, setProjects] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dropdown options from API
  useEffect(() => {
    Promise.all([
      api.get("consumption/projects", { headers: { Authorization: `Bearer ${user?.token}` } }).then(res => setProjects(res.data)),
      api.get("options/activity-types", { headers: { Authorization: `Bearer ${user?.token}` } }).then(res => setActivityTypes(res.data)),
      api.get("options/fuel-types", { headers: { Authorization: `Bearer ${user?.token}` } }).then(res => setFuelTypes(res.data)),
      api.get("options/units", { headers: { Authorization: `Bearer ${user?.token}` } }).then(res => setUnits(res.data))
    ]).finally(() => setIsLoading(false));
  }, [user]);

  // Fetch existing data if editing
  useEffect(() => {
    if (isEditing) {
      api.get(`consumption/${id}`, { headers: { Authorization: `Bearer ${user?.token}` } })
        .then(res => setFormData(res.data))
        .catch(err => console.error("Error fetching consumption:", err));
    }
  }, [id, user?.token, isEditing]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Create a payload that matches `ConsumptionSubmitSchema`
    const submitData = {
        projectId: formData.projectId,
        amount: Number(formData.amount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        reportDate: todayDate,
        description: formData.description,
        activityTypeId: Number(formData.activityTypeId),
        fuelTypeId: Number(formData.fuelTypeId),
        unitId: Number(formData.unitId),
        userId: Number(formData.userId),
    };

    const request = isEditing
      ? api.put(`consumption/${id}`, submitData, {
            headers: { Authorization: `Bearer ${user?.token}` },
        })
      : api.post("consumption", submitData, {
            headers: { Authorization: `Bearer ${user?.token}` },
        });

    request
      .then(() => navigate("/"))
      .catch((err) => console.error("Error saving consumption:", err));
  };

  if (isLoading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="container mt-4 p-4 rounded shadow-sm custom-container-bg">
      <h2 className="mb-4 text-black">{isEditing ? "Edit Consumption" : "New Consumption"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Project</label>
            <select className="form-select" name="projectId" value={formData.projectId} onChange={handleChange} required>
              <option value="" disabled>Select Project</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Report Date</label>
            <input className="form-control" name="reportDate" type="date" value={formData.reportDate} readOnly />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Start Date</label>
            <input className="form-control" name="startDate" type="date" value={formData.startDate} onChange={handleChange} max={todayDate} required />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">End Date</label>
            <input className="form-control" name="endDate" type="date" value={formData.endDate} onChange={handleChange} max={todayDate} required />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Activity Type</label>
            <select className="form-select" name="activityTypeId" value={formData.activityTypeId} onChange={handleChange} required>
              <option value="" disabled>Select Activity Type</option>
              {activityTypes.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Amount</label>
            <input className="form-control" name="amount" type="number" value={formData.amount} onChange={handleChange} required />
          </div>
        </div>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Fuel Type</label>
            <select className="form-select" name="fuelTypeId" value={formData.fuelTypeId} onChange={handleChange} required>
              <option value="" disabled>Select Fuel Type</option>
              {fuelTypes.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Unit</label>
            <select className="form-select" name="unitId" value={formData.unitId} onChange={handleChange} required>
              <option value="" disabled>Select Unit</option>
              {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} />
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary flex-grow-1" type="submit">
            <i className="bi bi-check-circle"></i> {isEditing ? "Update" : "Create"} Consumption
          </button>
          <button type="button" className="btn btn-outline-dark flex-grow-1" onClick={() => navigate("/")}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default ConsumptionForm;