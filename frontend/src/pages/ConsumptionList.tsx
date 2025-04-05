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

  // Search filter
  const filteredConsumptions = consumptions.filter((c) =>
    `${c.project} ${c.activityType} ${c.user_first_name} ${c.user_last_name} ${c.company}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Sorting logic with numbers, dates, and text
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

  // Pagination logic
  const paginatedConsumptions = sortedConsumptions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Toggle sorting
  const toggleSort = (key: keyof Consumption | "time" | "user") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="container mt-4 custom-container-bg p-4 rounded shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="display-4">Consumption List</h2>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by project, activity, user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
        />
      </div>

      <Link to="/consumption-form" className="btn btn-primary mb-3">
        + Add Consumption
      </Link>

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="thead-dark">
            <tr>
              {user?.role === "admin" && (
                <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("company")}>
                  Company {sortConfig.key === "company" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                </th>
              )}
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("project")}>
                Project {sortConfig.key === "project" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("activityType")}>
                Activity Type {sortConfig.key === "activityType" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("description")}>
                Description {sortConfig.key === "description" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("startDate")}>
                Start Date {sortConfig.key === "startDate" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("endDate")}>
                End Date {sortConfig.key === "endDate" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("time")}>
                Time (Days) {sortConfig.key === "time" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("amount")}>
                Amount {sortConfig.key === "amount" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("unit")}>
                Unit {sortConfig.key === "unit" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("fuelType")}>
                Fuel Type {sortConfig.key === "fuelType" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("reportDate")}>
                Report Date {sortConfig.key === "reportDate" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th className="cursor-pointer" style={{ cursor: "pointer" }} onClick={() => toggleSort("user")}>
                User {sortConfig.key === "user" && (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedConsumptions.map((c) => (
              <tr key={c.id}>
                {user?.role === "admin" && <td>{c.company}</td>}
                <td>{c.project}</td>
                <td>{c.activityType}</td>
                <td>{c.description}</td>
                <td>{c.startDate}</td>
                <td>{c.endDate}</td>
                <td>{calculateDays(c.startDate, c.endDate)}</td>
                <td>{c.amount}</td>
                <td>{c.unit}</td>
                <td>{c.fuelType}</td>
                <td>{c.reportDate}</td>
                <td>{c.user_first_name} {c.user_last_name}</td>
                <td>
                  {(user?.role === "admin" || user?.role === "companyadmin" || user?.id === c.userId) && (
                    <>
                      <Link to={`/consumption-form/${c.id}`} className="btn btn-warning btn-sm mb-1">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-danger btn-sm">
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

      <div className="mt-3">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="btn btn-secondary me-1"
        >
          Previous
        </button>
        <button
          disabled={currentPage * itemsPerPage >= sortedConsumptions.length}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="btn btn-secondary"
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
