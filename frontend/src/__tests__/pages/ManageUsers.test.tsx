/* eslint-disable testing-library/prefer-find-by */
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManageUsers from "../../pages/ManageUsers";
import api from "../../utils/api";
import { renderWithAuthOnly } from "../../../test-utils/testUtils";

jest.mock("../../utils/api");

beforeAll(() => {
  jest.spyOn(window, "confirm").mockReturnValue(true);
  jest.spyOn(window, "alert").mockImplementation(() => {});
});
afterAll(() => {
  (window.confirm as jest.Mock).mockRestore();
  (window.alert as jest.Mock).mockRestore();
});

describe("ManageUsers Page", () => {
  const fakeUsers = [
    {
      id: 1,
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com",
      role: "user",
      company: "Acme Corp",
      companyId: 10,
      projects: ["100", "101"],
    },
    {
      id: 2,
      firstName: "Bob",
      lastName: "Jones",
      email: "bob@example.com",
      role: "companyadmin",
      company: "Globex Inc",
      companyId: 20,
      projects: [],
    },
  ];
  const fakeProjects = [
    { id: 100, name: "Project X", companyId: 10 },
    { id: 101, name: "Project Y", companyId: 10 },
  ];
  const fakeCompanies = [
    { id: 10, name: "Acme Corp" },
    { id: 20, name: "Globex Inc" },
  ];
  const fakeAssigned = [{ id: 100, name: "Project X" }];

  beforeEach(() => {
    jest.clearAllMocks();

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "users") return Promise.resolve({ data: fakeUsers });
      if (url === "/projects" || url === "projects")
        return Promise.resolve({ data: fakeProjects });
      if (url.endsWith("/options/companies"))
        return Promise.resolve({ data: fakeCompanies });
      if (/\/users\/\d+\/projects$/.test(url))
        return Promise.resolve({ data: fakeAssigned });
      return Promise.reject(new Error("unmocked " + url));
    });

    (api.delete as jest.Mock).mockResolvedValue({});
  });

  it("renders header + two user rows for admin", async () => {
    renderWithAuthOnly(<ManageUsers />, {
      userOverrides: { role: "admin", id: 999 },
    });
    await screen.findByText("Alice Smith");

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1 + fakeUsers.length);
  });

  it("filters the list by search term", async () => {
    renderWithAuthOnly(<ManageUsers />, {
      userOverrides: { role: "admin", id: 999 },
    });
    await screen.findByText("Alice Smith");

    await userEvent.type(screen.getByPlaceholderText(/search users/i), "bob");
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("deletes a user when Delete clicked", async () => {
    renderWithAuthOnly(<ManageUsers />, {
      userOverrides: { role: "admin", id: 999 },
    });
    await screen.findByText("Alice Smith");

    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith("users/1", expect.any(Object))
    );
  });

  it("opens the form to create a new user", async () => {
    renderWithAuthOnly(<ManageUsers />, {
      userOverrides: { role: "admin", id: 999 },
    });
    await screen.findByText("Manage Users");

    fireEvent.click(screen.getByRole("button", { name: /create user/i }));
    // wait for UserForm to mount & fetch companies + assigned projects
    await screen.findByLabelText(/first name:/i);
    expect(screen.getByLabelText(/email:/i)).toBeInTheDocument();
  });

  it("opens the form prefilled for editing", async () => {
    renderWithAuthOnly(<ManageUsers />, {
      userOverrides: { role: "admin", id: 999 },
    });
    await screen.findByText("Alice Smith");

    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    await screen.findByDisplayValue("Alice");
    expect(screen.getByLabelText(/last name:/i)).toHaveValue("Smith");
  });
});
