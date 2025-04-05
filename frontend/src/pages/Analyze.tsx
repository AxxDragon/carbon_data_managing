import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// Interface to represent project data
interface Project {
  id: number;
  name: string;
  companyId: number;
}

// Interface to represent company data
interface Company {
  id: number;
  name: string;
}

// Interface for consumption data entry
interface ConsumptionEntry {
  startDate: string;
  endDate: string;
  fuelTypeId: number;
  fuelType: string;
  amount: number;
  project: string;
  averageCO2Emission: number;
}

// Interface for processed data used in charting
interface ProcessedData {
  date: string;
  [key: string]: number | string;
}

const Analyze = () => {
  const { user } = useAuth(); // Access user information from AuthContext
  const [projects, setProjects] = useState<Project[]>([]); // State for projects
  const [companies, setCompanies] = useState<Company[]>([]); // State for companies
  const [selectedItem, setSelectedItem] = useState<Project | Company | null>(
    null
  ); // Selected project or company for analysis
  const [consumptionData, setConsumptionData] = useState<ProcessedData[]>([]); // State for processed consumption data
  const [searchTerm, setSearchTerm] = useState<string>(""); // State for search filter
  const [currentPage, setCurrentPage] = useState<number>(1); // State for current page of paginated items
  const [loading, setLoading] = useState<boolean>(false); // Loading state for data fetching
  const [fuelTypes, setFuelTypes] = useState<Map<number, number>>(new Map()); // State to store fuel types with their CO2 emissions
  const itemsPerPage = 10; // Items per page for pagination
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({}); // State to manage visibility of lines in the chart

  // Effect to update visibleLines when consumptionData changes
  useEffect(() => {
    if (consumptionData.length > 0) {
      const fuelTypes = Object.keys(consumptionData[0]).filter(
        (key) => key !== "date"
      );

      setVisibleLines((prev) => {
        const newVisibleLines = Object.fromEntries(
          fuelTypes.map((type) => [type, true])
        );

        return JSON.stringify(prev) === JSON.stringify(newVisibleLines)
          ? prev
          : newVisibleLines;
      });
    }
  }, [consumptionData]);

  // Effect to fetch data on component mount and user changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Set loading state to true
        // Fetch projects
        const projectRes = await api.get<Project[]>("projects", {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setProjects(projectRes.data); // Store projects

        // Fetch companies based on user role
        if (user?.role === "admin" || user?.role === "companyadmin") {
          const companyRes = await api.get<Company[]>("options/companies", {
            headers: { Authorization: `Bearer ${user?.token}` },
          });

          if (user?.role === "companyadmin") {
            const filteredCompanies = companyRes.data.filter(
              (company) => company.id === user.companyId
            );
            setCompanies(filteredCompanies); // Set filtered companies for company admins
          } else {
            setCompanies(companyRes.data); // Set all companies for admins
          }
        }

        // Fetch fuel types and their CO2 emissions
        const fuelTypesRes = await api.get<
          { id: number; averageCO2Emission: number }[]
        >("options/fuel-types", {
          headers: { Authorization: `Bearer ${user?.token}` },
        });

        const fuelTypesMap = new Map<number, number>();
        fuelTypesRes.data.forEach((fuel) => {
          fuelTypesMap.set(fuel.id, fuel.averageCO2Emission); // Map fuel type ID to CO2 emission
        });

        setFuelTypes(fuelTypesMap); // Set fuel types in state
      } catch (error) {
        console.error("Error fetching data:", error); // Error handling
      } finally {
        setLoading(false); // Set loading state to false after fetch
      }
    };
    fetchData();
  }, [user]);

  // Function to process consumption data into a format suitable for charting
  const processConsumptionData = useCallback(
    (data: ConsumptionEntry[]): ProcessedData[] => {
      if (data.length === 0) return [];

      let minDate: Date = new Date(data[0].startDate);
      let maxDate: Date = new Date(data[0].endDate);

      // Calculate the min and max date across all entries
      data.forEach((entry) => {
        const startDate = new Date(entry.startDate);
        const endDate = new Date(entry.endDate);
        if (startDate < minDate) minDate = startDate;
        if (endDate > maxDate) maxDate = endDate;
      });

      // Generate all dates between minDate and maxDate
      const allDates = new Map<string, ProcessedData>();
      let currentDate = new Date(minDate);
      while (currentDate <= maxDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        allDates.set(dateStr, { date: dateStr });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Track fuel types and cumulative sums
      let usedFuelTypes = ["Total CO₂"];
      let cumulativeSums: Record<string, number> = {};
      let cumulativeCO2 = 0;

      data.forEach((entry) => {
        const startDate = new Date(entry.startDate);
        const endDate = new Date(entry.endDate);
        const daysCount =
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
        const dailyAmount = entry.amount / daysCount;
        const fuelTypeLabel = entry.fuelType;
        const fuelTypeCO2Emission = fuelTypes.get(entry.fuelTypeId) || 0;
        const dailyCO2 = dailyAmount * fuelTypeCO2Emission;

        // Track the fuel type if it hasn't been encountered yet
        if (!usedFuelTypes.includes(fuelTypeLabel)) {
          usedFuelTypes.push(fuelTypeLabel);
        }

        // Ensure cumulative sums start at 0
        if (!(fuelTypeLabel in cumulativeSums)) {
          cumulativeSums[fuelTypeLabel] = 0;
        }

        const tempDate = new Date(startDate);
        while (tempDate <= endDate) {
          const dateStr = tempDate.toISOString().split("T")[0];
          const dataEntry = allDates.get(dateStr)!;

          // Add daily amount to cumulative sums
          cumulativeSums[fuelTypeLabel] += dailyAmount;
          cumulativeCO2 += dailyCO2;

          dataEntry[fuelTypeLabel] = parseFloat(
            cumulativeSums[fuelTypeLabel].toFixed(3)
          );
          dataEntry["Total CO₂"] = parseFloat(cumulativeCO2.toFixed(3));

          tempDate.setDate(tempDate.getDate() + 1);
        }
      });

      // Ensure each date has the fuel type data
      usedFuelTypes.forEach((type) => {
        let cumulativeValue = 0;
        allDates.forEach((date) => {
          if (type in date) {
            cumulativeValue = date[type] as number;
          } else {
            date[type] = cumulativeValue;
          }
        });
      });

      return Array.from(allDates.values());
    },
    [fuelTypes]
  );

  // Fetch consumption data when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      const fetchConsumptionData = async () => {
        try {
          const res = await api.get<ConsumptionEntry[]>("consumption", {
            headers: { Authorization: `Bearer ${user?.token}` },
          });

          let filteredData: ConsumptionEntry[] = [];
          if ("companyId" in selectedItem) {
            // Filter data by project
            filteredData = res.data.filter(
              (entry) => entry.project === selectedItem.name
            );
          } else {
            // Filter data by company projects
            const companyProjects = projects.filter(
              (project) => project.companyId === selectedItem.id
            );
            filteredData = res.data.filter((entry) =>
              companyProjects.some((project) => project.name === entry.project)
            );
          }
          setConsumptionData(processConsumptionData(filteredData)); // Process and set consumption data
        } catch (error) {
          console.error("Error fetching consumption data:", error); // Error handling
        }
      };
      fetchConsumptionData();
    }
  }, [selectedItem, user?.token, projects, fuelTypes, processConsumptionData]);

  // Get display name for project or company based on the user role
  const getDisplayName = (item: Project | Company) => {
    if ("companyId" in item) {
      // This is a project
      const company = companies.find((c) => c.id === item.companyId);

      if (user?.role === "admin") {
        // Admins see "CompanyName - ProjectName"
        return company ? `${company.name} - ${item.name}` : item.name;
      } else {
        // CompanyAdmins and Users see just "ProjectName"
        return item.name;
      }
    } else {
      // This is a company, only CompanyAdmins and Admins see it
      return `Company - ${item.name}`;
    }
  };

  // Handle item selection (project or company)
  const handleSelection = (item: Project | Company) => {
    setSelectedItem(item);
  };

  // Toggle visibility of a chart line
  const toggleLine = (lineKey: string) => {
    setVisibleLines((prev) => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }));
  };

  // Generate color for each line dynamically
  const generateColor = (index: number, total: number) => {
    let hue = (index * (360 / total)) % 360;

    // Avoid hues close to red (0° ± 30°)
    if (hue < 30 || hue > 330) {
      hue = (hue + 60) % 360; // Shift away from red
    }

    return `hsl(${hue}, 70%, 50%)`; // Return HSL color
  };

  // Filter and paginate items (companies and projects)
  const filteredItems = [...companies, ...projects].filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container">
      {selectedItem ? (
        <div>
          <button
            onClick={() => setSelectedItem(null)} // Back button to unselect
            className="btn btn-secondary mb-3"
          >
            ← Back
          </button>
          <h2>{selectedItem.name} Analysis</h2>
          {loading ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3">
                {Object.keys(visibleLines).map((lineKey) => (
                  <label key={lineKey} className="me-2">
                    <input
                      type="checkbox"
                      checked={visibleLines[lineKey] ?? true}
                      onChange={() => toggleLine(lineKey)} // Toggle line visibility
                      className="form-check-input"
                    />
                    {lineKey}
                  </label>
                ))}
              </div>
              <div className="row mt-4">
                <div className="col-12">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={consumptionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {Object.keys(visibleLines).map(
                        (lineKey, index) =>
                          visibleLines[lineKey] && (
                            <Line
                              key={lineKey}
                              type="monotone"
                              dataKey={lineKey}
                              stroke={
                                lineKey === "Total CO₂"
                                  ? "#ff0000"
                                  : generateColor(
                                      index,
                                      Object.keys(visibleLines).length
                                    )
                              }
                            />
                          )
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="container mt-4 custom-container-bg p-4 rounded shadow-sm">
          <h2 className="mb-4">Analyze Data</h2>
          <input
            type="text"
            placeholder="Search projects/companies"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Handle search input change
            className="form-control mb-3"
          />
          {loading ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="list-group mb-3">
                {paginatedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelection(item)} // Select project or company
                    className="list-group-item list-group-item-action"
                  >
                    {getDisplayName(item)}
                  </button>
                ))}
              </div>
              {/* Pagination controls */}
              <div className="d-flex justify-content-between">
                <button
                  className="btn btn-link"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                >
                  Previous
                </button>
                <button
                  className="btn btn-link"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        prev + 1,
                        Math.ceil(filteredItems.length / itemsPerPage)
                      )
                    )
                  }
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Analyze;
