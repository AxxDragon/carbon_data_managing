import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
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

const itemsPerPage = 10;

const ConsumptionList = () => {
  const { user } = useAuth();
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Consumption | "time" | "user" | null; direction: "asc" | "desc" }>({ key: null, direction: "asc" });

  useEffect(() => {
    api
      .get("consumption", {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((res) => setConsumptions(res.data))
      .catch((err) => console.error("Error fetching consumptions:", err));
  }, [user]);

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    api
      .delete(`consumption/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then(() => {
        alert("Entry deleted successfully!");
        setConsumptions(consumptions.filter((c) => c.id !== id));
      })
      .catch((err) => console.error("Error deleting entry:", err));
  };

  // 🔍 Search filter
  const filteredConsumptions = consumptions.filter((c) =>
    `${c.project} ${c.activityType} ${c.user_first_name} ${c.user_last_name} ${c.company}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // 🔀 Sorting logic with numbers, dates, and text
  const sortedConsumptions = [...filteredConsumptions].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const key = sortConfig.key;
    let valueA: any;
    let valueB: any;
  
    if (key === "time") {
      valueA = calculateDays(a.startDate, a.endDate);
      valueB = calculateDays(b.startDate, b.endDate);
    } else if (key === "user") {
      valueA = `${a.user_first_name} ${a.user_last_name}`.toLowerCase();
      valueB = `${b.user_first_name} ${b.user_last_name}`.toLowerCase();
    } else {
      valueA = a[key];
      valueB = b[key];
    }
  
    // Convert dates to timestamps for sorting
    if (["startDate", "endDate", "reportDate"].includes(key)) {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }
  
    // Convert numeric values for sorting
    if (["amount", "time"].includes(key)) {
      valueA = parseFloat(valueA);
      valueB = parseFloat(valueB);
    }
  
    return sortConfig.direction === "asc" ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
  });

  // 📄 Pagination logic
  const paginatedConsumptions = sortedConsumptions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 🔼 Toggle sorting
  const toggleSort = (key: keyof Consumption | "time" | "user") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl">Consumption List</h2>
        <Link to="/consumption-form" className="bg-green-500 text-white px-4 py-2 rounded">
          + Add Consumption
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by project, activity, user..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 border w-full"
      />

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            {user?.role === "admin" && (
              <th className="border p-2 cursor-pointer" onClick={() => toggleSort("company")}>
                Company {sortConfig.key === "company" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
              </th>
            )}
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("project")}>
              Project {sortConfig.key === "project" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("activityType")}>
              Activity Type {sortConfig.key === "activityType" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("description")}>
              Description {sortConfig.key === "description" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("startDate")}>
              Start Date {sortConfig.key === "startDate" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("endDate")}>
              End Date {sortConfig.key === "endDate" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("time")}>
              Time (Days) {sortConfig.key === "time" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("amount")}>
              Amount {sortConfig.key === "amount" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("unit")}>
              Unit {sortConfig.key === "unit" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("fuelType")}>
              Fuel Type {sortConfig.key === "fuelType" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("reportDate")}>
              Report Date {sortConfig.key === "reportDate" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2 cursor-pointer" onClick={() => toggleSort("user")}>
              User {sortConfig.key === "user" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedConsumptions.map((c) => (
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

      <div className="mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="px-4 py-2 bg-gray-300 mr-2"
        >
          Previous
        </button>
        <button
          disabled={currentPage * itemsPerPage >= sortedConsumptions.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-4 py-2 bg-gray-300"
        >
          Next
        </button>
      </div>
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
