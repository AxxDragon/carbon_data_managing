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

interface Project {
  id: number;
  name: string;
  companyId: number;
}

interface Company {
  id: number;
  name: string;
}

interface ConsumptionEntry {
  startDate: string;
  endDate: string;
  fuelTypeId: number;
  fuelType: string;
  amount: number;
  project:string;
  averageCO2Emission: number;
}

interface ProcessedData {
  date: string;
  [key: string]: number | string;
}

const Analyze = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedItem, setSelectedItem] = useState<Project | Company | null>(null);
  const [consumptionData, setConsumptionData] = useState<ProcessedData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [fuelTypes, setFuelTypes] = useState<Map<number, number>>(new Map());
  const itemsPerPage = 10;
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (consumptionData.length > 0) {
      const fuelTypes = Object.keys(consumptionData[0]).filter((key) => key !== "date");
  
      setVisibleLines((prev) => {
        const newVisibleLines = Object.fromEntries(fuelTypes.map((type) => [type, true]));
  
        return JSON.stringify(prev) === JSON.stringify(newVisibleLines) ? prev : newVisibleLines;
      });
    }
  }, [consumptionData]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const projectRes = await api.get<Project[]>("projects", {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setProjects(projectRes.data);

        if (user?.role === "admin") {
          const companyRes = await api.get<Company[]>("options/companies", {
            headers: { Authorization: `Bearer ${user?.token}` },
          });
          setCompanies(companyRes.data);
        }

        const fuelTypesRes = await api.get<{ id: number; averageCO2Emission: number }[]>(
          "options/fuel-types",
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );

        const fuelTypesMap = new Map<number, number>();
        fuelTypesRes.data.forEach((fuel) => {
          fuelTypesMap.set(fuel.id, fuel.averageCO2Emission);
        });

        setFuelTypes(fuelTypesMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.role, user?.token]);

  // Fetch data when selectedItem changes
  const processConsumptionData = useCallback((data: ConsumptionEntry[]): ProcessedData[] => {
    if (data.length === 0) return [];
  
    let minDate: Date = new Date(data[0].startDate);
    let maxDate: Date = new Date(data[0].endDate);
  
    data.forEach((entry) => {
      const startDate = new Date(entry.startDate);
      const endDate = new Date(entry.endDate);
      if (startDate < minDate) minDate = startDate;
      if (endDate > maxDate) maxDate = endDate;
    });
  
    const allDates = new Map<string, ProcessedData>();
    let currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      allDates.set(dateStr, { date: dateStr });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    // Track fuelTypes
    let usedFuelTypes = ["Total CO₂"];
    // Track cumulative sums
    let cumulativeSums: Record<string, number> = {};
    let cumulativeCO2 = 0;
  
    data.forEach((entry) => {
      const startDate = new Date(entry.startDate);
      const endDate = new Date(entry.endDate);
      const daysCount = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
      const dailyAmount = entry.amount / daysCount;
      const fuelTypeLabel = entry.fuelType;
      const fuelTypeCO2Emission = fuelTypes.get(entry.fuelTypeId) || 0;
      const dailyCO2 = dailyAmount * fuelTypeCO2Emission;
  
      // Ensure the fuel type is tracked
      if (!usedFuelTypes.includes(fuelTypeLabel)) {
        usedFuelTypes.push(fuelTypeLabel);
      }

      // Ensure the fuel type starts at 0 if missing
      if (!(fuelTypeLabel in cumulativeSums)) {
        cumulativeSums[fuelTypeLabel] = 0;
      }
  
      const tempDate = new Date(startDate);
      while (tempDate <= endDate) {
        const dateStr = tempDate.toISOString().split("T")[0];
        const dataEntry = allDates.get(dateStr)!;
  
        // Add daily amount to the cumulative sum
        cumulativeSums[fuelTypeLabel] += dailyAmount;
        cumulativeCO2 += dailyCO2;
  
        dataEntry[fuelTypeLabel] = cumulativeSums[fuelTypeLabel];
        dataEntry["Total CO₂"] = cumulativeCO2;
  
        tempDate.setDate(tempDate.getDate() + 1);
      }
    });

    allDates.forEach((date) => {
    });

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
  }, [fuelTypes]);
  
  useEffect(() => {
    if (selectedItem) {
      const fetchConsumptionData = async () => {
        try {
          const res = await api.get<ConsumptionEntry[]>("consumption", {
            headers: { Authorization: `Bearer ${user?.token}` },
          });

          let filteredData: ConsumptionEntry[] = [];
          if ('companyId' in selectedItem) {
            filteredData = res.data.filter(entry => entry.project === selectedItem.name);
          } else {
            const companyProjects = projects.filter(project => project.companyId === selectedItem.id);
            filteredData = res.data.filter(entry =>
              companyProjects.some(project => project.name === entry.project)
            );
          }
          setConsumptionData(processConsumptionData(filteredData));
        } catch (error) {
          console.error("Error fetching consumption data:", error);
        }
      };
      fetchConsumptionData();
    }
  }, [selectedItem, user?.token, projects, fuelTypes, processConsumptionData]);
  
  const getDisplayName = (item: Project | Company) => {
    if ("companyId" in item) {
      // Project: For admins, show "CompanyName - ProjectName"
      const company = companies.find(c => c.id === item.companyId);
      return company ? `${company.name} - ${item.name}` : item.name;
    } else {
      // Company: Show "Company - CompanyName"
      return `Company - ${item.name}`;
    }
  };
  
  const handleSelection = (item: Project | Company) => {
    setSelectedItem(item);
  };

  const toggleLine = (lineKey: string) => {
    setVisibleLines((prev) => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }));
  };
  
  const generateColor = (index: number, total: number) => {
    let hue = (index * (360 / total)) % 360;
  
    // Avoid hues close to red (0° ± 30°)
    if (hue < 30 || hue > 330) {
      hue = (hue + 60) % 360; // Shift away from red
    }
  
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  const filteredItems = [...companies, ...projects].filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (selectedItem) {
    return (
      <div>
        <button onClick={() => setSelectedItem(null)}>← Back</button>
        <h2>{selectedItem.name} Analysis</h2>
        {loading ? (
          <p>Loading data...</p>
        ) : (
          <>
            <div>
              {Object.keys(visibleLines).map((lineKey) => (
                <label key={lineKey}>
                  <input
                    type="checkbox"
                    checked={visibleLines[lineKey] ?? true}
                    onChange={() => toggleLine(lineKey)}
                  />
                  {lineKey}
                </label>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(visibleLines).map((lineKey, index) =>
                  visibleLines[lineKey] && (
                    <Line 
                      key={lineKey} 
                      type="monotone" 
                      dataKey={lineKey} 
                      stroke={lineKey === "Total CO₂" ? "#ff0000" : generateColor(index, Object.keys(visibleLines).length)}
                    />
                  )
                )}
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2>Analyze Data</h2>
      <input
        type="text"
        placeholder="Search projects/companies"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <ul>
          {paginatedItems.map((item) => (
            <li key={`${"company" in item ? "company" : "project"}-${item.id}`} onClick={() => handleSelection(item)}>
            {getDisplayName(item)}
          </li>
          ))}
        </ul>
      )}
      <button
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        Previous
      </button>
      <button
        disabled={currentPage * itemsPerPage >= filteredItems.length}
        onClick={() => setCurrentPage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
};

export default Analyze;
