import { screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectForm from "../../pages/ProjectForm";
import api from "../../utils/api";
import { renderWithAuthOnly } from "../../../test-utils/testUtils";

jest.mock("../../utils/api");

describe("ProjectForm Component", () => {
  const fakeCompanies = [
    { id: 10, name: "Acme Corp" },
    { id: 20, name: "Globex Inc" },
  ];
  const onSave = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // mock current user for companyadmin
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "/users/me") {
        return Promise.resolve({ data: { companyId: 10 } });
      }
      if (url === "/options/companies") {
        return Promise.resolve({ data: fakeCompanies });
      }
      return Promise.resolve({ data: {} });
    });
    (api.post as jest.Mock).mockResolvedValue({});
    (api.put as jest.Mock).mockResolvedValue({});
  });

  it("renders empty form for new project and submits POST", async () => {
    renderWithAuthOnly(<ProjectForm onSave={onSave} onCancel={onCancel} />, {
      userOverrides: { role: "admin" },
    });

    // wait for companies dropdown to fetch
    await screen.findByRole("combobox", { name: /company:/i });

    fireEvent.change(screen.getByLabelText(/project name:/i), {
      target: { value: "New Project" },
    });
    fireEvent.change(screen.getByLabelText(/start date:/i), {
      target: { value: "2025-05-01" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /company:/i }), {
      target: { value: "20" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save project/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/projects",
        expect.objectContaining({
          name: "New Project",
          startDate: "2025-05-01",
          companyId: 20,
        }),
        expect.any(Object)
      )
    );
    expect(onSave).toHaveBeenCalled();
  });

  it("renders prefilled form for edit and submits PUT", async () => {
    const existing = {
      id: 42,
      name: "Existing",
      startDate: "2025-04-01",
      endDate: "2025-04-30",
      company: "Acme Corp",
      companyId: 10,
    };

    renderWithAuthOnly(
      <ProjectForm project={existing} onSave={onSave} onCancel={onCancel} />,
      { userOverrides: { role: "admin" } }
    );

    // wait for fields to prefill
    await screen.findByDisplayValue("Existing");

    // change name
    fireEvent.change(screen.getByLabelText(/project name:/i), {
      target: { value: "Existing Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save project/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/projects/42",
        expect.objectContaining({ name: "Existing Updated" }),
        expect.any(Object)
      );
    });
    expect(onSave).toHaveBeenCalled();
  });

  it("calls onCancel when Cancel clicked", async () => {
    renderWithAuthOnly(<ProjectForm onSave={onSave} onCancel={onCancel} />, {
      userOverrides: { role: "admin" },
    });
    // wait for possible company fetch
    await screen.findByLabelText(/project name:/i);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
