import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Options from "../../pages/ManageOptions";
import api from "../../utils/api";

jest.mock("../../utils/api");

const mockOptions = [
  { id: 1, name: "Option A" },
  { id: 2, name: "Option B" },
  { id: 3, name: "Option C" },
];

describe("ManageOptions Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders and fetches Companies options by default", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockOptions });

    render(<Options />);

    expect(screen.getByText("Manage Options")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("options/companies");
    });

    mockOptions.forEach(({ name }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  test("switches tabs and fetches corresponding options", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: mockOptions });

    render(<Options />);

    const fuelTypesTab = screen.getByRole("button", { name: /Fuel Types/i });
    fireEvent.click(fuelTypesTab);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("options/fuel-types");
    });

    mockOptions.forEach(({ name }) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  test("filters options based on search input", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockOptions });

    render(<Options />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText("Search options");
    fireEvent.change(searchInput, { target: { value: "Option B" } });

    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.queryByText("Option A")).not.toBeInTheDocument();
  });

  test("opens form to create a new option", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockOptions });

    render(<Options />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const createButton = screen.getByRole("button", {
      name: /Create New Company/i,
    });
    fireEvent.click(createButton);

    expect(screen.getByLabelText(/Name:/i)).toBeInTheDocument();
  });

  test("opens form to edit an existing option", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockOptions });

    render(<Options />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByLabelText(/Name:/i)).toHaveValue("Option A");
  });

  test("deletes an option after confirmation", async () => {
    window.confirm = jest.fn().mockReturnValue(true);
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockOptions });
    (api.delete as jest.Mock).mockResolvedValueOnce({});

    render(<Options />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("options/companies/1");
    });
  });

  test("paginates options correctly", async () => {
    const manyOptions = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Option ${i + 1}`,
    }));
    (api.get as jest.Mock).mockResolvedValueOnce({ data: manyOptions });

    render(<Options />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    // First page
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.queryByText("Option 11")).not.toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);

    // Second page
    await waitFor(() => {
      expect(screen.getByText("Option 11")).toBeInTheDocument();
    });
  });

  test("sorts options by name", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockOptions });

    render(<Options />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const nameHeader = screen.getByText("Name");
    fireEvent.click(nameHeader); // Ascending
    fireEvent.click(nameHeader); // Descending

    // Sorting logic is internal; verify that the sortConfig state changes as expected
    // Additional implementation needed to expose sortConfig for testing if necessary
  });
});
