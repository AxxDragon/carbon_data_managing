import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsumptionList from "../../pages/ConsumptionList";
import api from "../../utils/api";
import { renderWithAuth } from "../../../test-utils/testUtils";

// polyfill confirm & alert
beforeAll(() => {
  jest.spyOn(window, "confirm").mockReturnValue(true);
  jest.spyOn(window, "alert").mockImplementation(() => {});
});
afterAll(() => {
  (window.confirm as jest.Mock).mockRestore();
  (window.alert as jest.Mock).mockRestore();
});

jest.mock("../../utils/api");

describe("ConsumptionList", () => {
  const fakeData = [
    {
      id: 1,
      project: "Proj A",
      activityType: "Type X",
      user_first_name: "Alice",
      user_last_name: "Smith",
      company: "Acme",
      startDate: "2025-04-01",
      endDate: "2025-04-02",
      unit: "kg",
      fuelType: "Gas",
      amount: 42,
      reportDate: "2025-04-02",
      description: "Test entry",
      userId: 1,
    },
    {
      id: 2,
      project: "Proj B",
      activityType: "Type Y",
      user_first_name: "Bob",
      user_last_name: "Jones",
      company: "Globex",
      startDate: "2025-04-03",
      endDate: "2025-04-03",
      unit: "L",
      fuelType: "Diesel",
      amount: 7,
      reportDate: "2025-04-03",
      description: "",
      userId: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Make the single consumption fetch return our fakeData array
    (api.get as jest.Mock).mockResolvedValue({ data: fakeData });
  });

  it("renders header + two rows", async () => {
    renderWithAuth(<ConsumptionList />, {
      userOverrides: { role: "admin" },
      route: "/",
    });

    // Wait for the first data cell to appear
    await screen.findByText("Proj A");

    // Now count the table rows
    const rows = screen.getAllByRole("row");
    // 1 header + 2 data rows
    expect(rows).toHaveLength(3);
  });

  it("filters by search term", async () => {
    renderWithAuth(<ConsumptionList />, {
      userOverrides: { role: "admin" },
      route: "/",
    });

    await screen.findByText("Proj A");

    const input = screen.getByPlaceholderText(/search by project/i);
    await userEvent.type(input, "Bob");

    expect(screen.queryByText("Proj A")).not.toBeInTheDocument();
    expect(screen.getByText("Proj B")).toBeInTheDocument();
  });

  it("deletes an entry when delete clicked", async () => {
    (api.delete as jest.Mock).mockResolvedValue({});
    renderWithAuth(<ConsumptionList />, {
      userOverrides: { role: "admin" },
      route: "/",
    });

    await screen.findByText("Proj A");
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith(
        "consumption/1",
        expect.any(Object)
      )
    );
    expect(window.alert).toHaveBeenCalledWith("Entry deleted successfully!");
    // The first row should now be gone
    expect(screen.queryByText("Proj A")).not.toBeInTheDocument();
  });
});
