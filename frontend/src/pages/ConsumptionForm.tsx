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

  // Fetch dropdown options from API
  useEffect(() => {
    api.get("consumption/projects", { headers: { Authorization: `Bearer ${user?.token}` } })
      .then(res => setProjects(res.data))
      .catch(err => console.error("Error fetching projects:", err));

    api.get("options/activity-types", { headers: { Authorization: `Bearer ${user?.token}` } })
      .then(res => setActivityTypes(res.data))
      .catch(err => console.error("Error fetching activity types:", err));

    api.get("options/fuel-types", { headers: { Authorization: `Bearer ${user?.token}` } })
      .then(res => setFuelTypes(res.data))
      .catch(err => console.error("Error fetching fuel types:", err));

    api.get("options/units", { headers: { Authorization: `Bearer ${user?.token}` } })
      .then(res => setUnits(res.data))
      .catch(err => console.error("Error fetching units:", err));
  }, [user]);

  // Fetch existing data if editing
  useEffect(() => {
    if (isEditing) {
      api
        .get(`consumption/${id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        .then((res) => setFormData(res.data))
        .catch((err) => console.error("Error fetching consumption:", err));
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

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">{isEditing ? "Edit Consumption" : "New Consumption"}</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="block text-sm font-medium text-gray-700">Project</label>
        <select className="border p-2" name="projectId" value={formData.projectId} onChange={handleChange} required>
          <option value="" disabled>Select Project</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <input className="border p-2" name="amount" type="number" value={formData.amount} onChange={handleChange} required />

        <label className="block text-sm font-medium text-gray-700">Start Date</label>
        <input className="border p-2" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />

        <label className="block text-sm font-medium text-gray-700">End Date</label>
        <input className="border p-2" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />

        <label className="block text-sm font-medium text-gray-700">Report Date</label>
        <input className="border p-2" name="reportDate" type="date" value={formData.reportDate} readOnly />

        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea className="border p-2" name="description" value={formData.description} onChange={handleChange} />

        <label className="block text-sm font-medium text-gray-700">Activity Type</label>
        <select className="border p-2" name="activityTypeId" value={formData.activityTypeId} onChange={handleChange} required>
          <option value="" disabled>Select Activity Type</option>
          {activityTypes.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <label className="block text-sm font-medium text-gray-700">Fuel Type</label>
        <select className="border p-2" name="fuelTypeId" value={formData.fuelTypeId} onChange={handleChange} required>
          <option value="" disabled>Select Fuel Type</option>
          {fuelTypes.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <label className="block text-sm font-medium text-gray-700">Unit</label>
        <select className="border p-2" name="unitId" value={formData.unitId} onChange={handleChange} required>
          <option value="" disabled>Select Unit</option>
          {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <div className="flex gap-2">
          <button className="bg-blue-500 text-white p-2 flex-1" type="submit">
            {isEditing ? "Update" : "Create"} Consumption
          </button>
          <button type="button" className="bg-gray-500 text-white p-2 flex-1" onClick={() => navigate("/")}>
            Back to List
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsumptionForm;