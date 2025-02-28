import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Link } from "react-router-dom";

interface Consumption {
  id: number;
  amount: number;
  startDate: string;
  endDate: string;
  reportDate: string;
  description?: string;
  userId: number;
  project: string;
  activityType: string;
  fuelType: string;
  unit: string;
  user_first_name: string;
  user_last_name: string;
  company?: string; // Only available for admins
}

const ConsumptionList = () => {
  const { user } = useAuth();
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);

  // console.log("User token:", user?.token);

  useEffect(() => {
    axios
      .get("http://localhost:8000/consumption", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((res) => setConsumptions(res.data))
      .catch((err) => console.error("Error fetching consumptions:", err));
  }, [user]);

  const handleDelete = (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
    if (confirmDelete) {
      axios
        .delete(`http://localhost:8000/consumption/${id}`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        })
        .then(() => {
          alert("Entry deleted successfully!");
          setConsumptions(consumptions.filter((c) => c.id !== id));
        })
        .catch((err) => console.error("Error deleting entry:", err));
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl">Consumption List</h2>
        <Link to="/consumption-form" className="bg-green-500 text-white px-4 py-2 rounded">
          + Add Consumption
        </Link>
      </div>

<table className="min-w-full border">
  <thead>
    <tr className="bg-gray-200">
      {user?.role === "admin" && <th className="border p-2">Company</th>}
      <th className="border p-2">Project</th>
      <th className="border p-2">Activity Type</th>
      <th className="border p-2">Description</th>
      <th className="border p-2">Start Date</th>
      <th className="border p-2">End Date</th>
      <th className="border p-2">Time (Days)</th>
      <th className="border p-2">Amount</th>
      <th className="border p-2">Unit</th>
      <th className="border p-2">Fuel Type</th>
      <th className="border p-2">Report Date</th>
      <th className="border p-2">User</th>
      <th className="border p-2">Actions</th>
    </tr>
  </thead>
  <tbody>
    {consumptions.map((c) => (
      <tr key={c.id} className="border">
        {user?.role === "admin" && <td className="border p-2">{c.company}</td>}
        <td className="border p-2">{c.project}</td>
        <td className="border p-2">{c.activityType}</td>
        <td className="border p-2">{c.description}</td>
        <td className="border p-2">{c.startDate}</td>
        <td className="border p-2">{c.endDate}</td>
        <td className="border p-2">{calculateDays(c.startDate, c.endDate)}</td>
        <td className="border p-2">{c.amount}</td>
        <td className="border p-2">{c.unit}</td>
        <td className="border p-2">{c.fuelType}</td>
        <td className="border p-2">{c.reportDate}</td>
        <td className="border p-2">{c.user_first_name} {c.user_last_name}</td>
        <td className="border p-2">
          {(user?.role === "admin" || user?.role === "companyadmin" || user?.id === c.userId) && (
            <>
              <Link to={`/consumption-form/${c.id}`} className="bg-blue-500 text-white px-2 py-1 rounded mx-1">
                Edit
              </Link>
              <button onClick={() => handleDelete(c.id)} className="bg-red-500 text-white px-2 py-1 rounded">
                Delete
              </button>
            </>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
</div>
);
};

// Calculate time difference in days
const calculateDays = (startDate: string, endDate: string) => {
const start = new Date(startDate);
const end = new Date(endDate);
const difference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
return difference >= 0 ? difference : "-";
};

export default ConsumptionList;