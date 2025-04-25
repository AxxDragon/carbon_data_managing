import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManageProjects from "../../pages/ManageProjects";
import api from "../../utils/api";
import { renderWithAuthOnly } from "../../../test-utils/testUtils";

// polyfill confirm
beforeAll(() => {
  jest.spyOn(window, "confirm").mockReturnValue(true);
});
afterAll(() => {
  (window.confirm as jest.Mock).mockRestore();
});

jest.mock("../../utils/api");

describe("ManageProjects Page", () => {
  const fakeProjects = [
    {
      id: 1,
      name: "Project Alpha",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      status: "Active",
      company: "Acme Corp",
      companyId: 10,
    },
    {
      id: 2,
      name: "Project Beta",
      startDate: "2025-02-01",
      endDate: null,
      status: "Planned",
      company: "Globex Inc",
      companyId: 20,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // mock fetching projects
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/projects") {
        return Promise.resolve({ data: fakeProjects });
      }
      // user/me for companyadmin scenario
      if (url === "/users/me") {
        return Promise.resolve({ data: { companyId: 10 } });
      }
      // options/companies for admin form
      if (url === "/options/companies") {
        return Promise.resolve({ data: [{ id: 10, name: "Acme Corp" }] });
      }
      return Promise.reject(new Error("unmocked " + url));
    });
    (api.delete as jest.Mock).mockResolvedValue({});
  });

  it("renders header + two project rows for admin", async () => {
    renderWithAuthOnly(<ManageProjects />, {
      userOverrides: { role: "admin" },
    });

    // wait for the first project’s name to be in the document
    await screen.findByText("Project Alpha");
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1 + fakeProjects.length);

    // spot-check content
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("filters by search term", async () => {
    renderWithAuthOnly(<ManageProjects />, {
      userOverrides: { role: "admin" },
    });
    await screen.findByText("Project Alpha");

    await userEvent.type(
      screen.getByPlaceholderText(/search projects/i),
      "Beta"
    );
    expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
  });

  it("deletes a project when delete clicked", async () => {
    renderWithAuthOnly(<ManageProjects />, {
      userOverrides: { role: "admin" },
    });
    await screen.findByText("Project Alpha");

    // click Delete on first row
    const delBtns = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(delBtns[0]);

    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith("/projects/1", expect.any(Object))
    );
  });

  it("opens create form when Create Project clicked", async () => {
    renderWithAuthOnly(<ManageProjects />, {
      userOverrides: { role: "admin" },
    });
    await screen.findByText("Project Alpha");

    fireEvent.click(screen.getByRole("button", { name: /create project/i }));
    // await that the new form has rendered its first input
    await screen.findByLabelText(/project name:/i);
    expect(screen.getByLabelText(/project name:/i)).toBeInTheDocument();
  });

  it("opens form prefilled when Edit clicked", async () => {
    renderWithAuthOnly(<ManageProjects />, {
      userOverrides: { role: "admin" },
    });
    await screen.findByText("Project Alpha");

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    // wait for the form to appear and prefill
    await screen.findByDisplayValue("Project Alpha");
    expect(screen.getByLabelText(/project name:/i)).toHaveValue(
      "Project Alpha"
    );
  });
});
