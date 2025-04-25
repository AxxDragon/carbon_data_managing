import { screen, fireEvent, waitFor } from "@testing-library/react";
import UserForm from "../../pages/UserForm";
import api from "../../utils/api";
import { renderWithAuthOnly } from "../../../test-utils/testUtils";

jest.mock("../../utils/api");

describe("UserForm Component", () => {
  const fakeCompanies = [
    { id: 10, name: "Acme Corp" },
    { id: 20, name: "Globex Inc" },
  ];
  const fakeProjects = [
    { id: 100, name: "Proj X", companyId: 10 },
    { id: 101, name: "Proj Y", companyId: 20 },
  ];
  const fakeAssigned = [{ id: 100, name: "Proj X" }];

  const onSave = jest.fn();
  const onCancel = jest.fn();

  const baseUser = {
    id: 5,
    firstName: "Carol",
    lastName: "Danvers",
    email: "carol@marvel.com",
    role: "companyadmin",
    companyId: 10,
    projects: [100],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/options/companies") {
        return Promise.resolve({ data: fakeCompanies });
      }
      if (url === "/projects") {
        return Promise.resolve({ data: fakeProjects });
      }
      if (url === `/users/${baseUser.id}/projects`) {
        return Promise.resolve({ data: fakeAssigned });
      }
      return Promise.resolve({ data: [] });
    });
    (api.put as jest.Mock).mockResolvedValue({});
  });

  it("renders pre-filled form for editing and submits PUT", async () => {
    renderWithAuthOnly(
      <UserForm user={baseUser} onSave={onSave} onCancel={onCancel} />,
      { userOverrides: { role: "admin" } }
    );

    // Wait for companies & projects to load and form to prefill
    await screen.findByDisplayValue("Carol");

    // Change last name
    fireEvent.change(screen.getByLabelText(/last name:/i), {
      target: { value: "Danvers-New" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        `/users/${baseUser.id}`,
        expect.objectContaining({
          lastName: "Danvers-New",
          projects: [100],
          companyId: 10,
        })
      );
    });
    expect(onSave).toHaveBeenCalled();
  });

  it("calls onCancel when cancel clicked", async () => {
    renderWithAuthOnly(
      <UserForm user={baseUser} onSave={onSave} onCancel={onCancel} />,
      { userOverrides: { role: "admin" } }
    );
    await screen.findByDisplayValue("Carol");
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
