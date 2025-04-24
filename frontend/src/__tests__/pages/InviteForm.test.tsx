import { screen, fireEvent, waitFor } from "@testing-library/react";
import InviteForm from "../../pages/InviteForm";
import api from "../../utils/api";
import { renderWithAuthOnly } from "../../../test-utils/testUtils";

jest.mock("../../utils/api");

describe("InviteForm Component", () => {
  const fakeCompanies = [
    { id: 10, name: "Acme Corp" },
    { id: 20, name: "Globex Inc" },
  ];
  const onSuccess = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "options/companies") {
        return Promise.resolve({ data: fakeCompanies });
      }
      return Promise.resolve({ data: [] });
    });
    (api.delete as jest.Mock).mockResolvedValue({});
    (api.post as jest.Mock).mockResolvedValue({});
  });

  it("renders empty form, submits new invite", async () => {
    renderWithAuthOnly(
      <InviteForm invite={undefined} onInviteSuccess={onSuccess} onCancel={onCancel} />,
      { userOverrides: { role: "admin" } }
    );

    // wait for companies dropdown to populate
    await screen.findByRole("combobox", { name: /company:/i });

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Charlie" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Brown" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "charlie@peanuts.com" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: /role:/i }),
      { target: { value: "user" } }
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: /company:/i }),
      { target: { value: "20" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: /send invitation/i })
    );

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "invites/",
        {
          email: "charlie@peanuts.com",
          firstName: "Charlie",
          lastName: "Brown",
          role: "user",
          companyId: 20,
        },
        expect.any(Object)
      )
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("pre-fills form in edit mode, deletes old invite then posts new", async () => {
    const existing = {
      id: 42,
      email: "lucy@peanuts.com",
      firstName: "Lucy",
      lastName: "Van Pelt",
      role: "companyadmin",
      companyId: 10,
    };

    renderWithAuthOnly(
      <InviteForm
        invite={existing}
        onInviteSuccess={onSuccess}
        onCancel={onCancel}
      />,
      { userOverrides: { role: "admin" } }
    );

    // wait for prefill + companies
    await screen.findByDisplayValue("Lucy");

    // change last name
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "Van Pelt-Edit" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /send invitation/i })
    );

    // split into two waitFor calls, each with a single assertion
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith("invites/42", expect.any(Object))
    );
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "invites/",
        {
          email: "lucy@peanuts.com",
          firstName: "Lucy",
          lastName: "Van Pelt-Edit",
          role: "companyadmin",
          companyId: 10,
        },
        expect.any(Object)
      )
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it("calls onCancel when Cancel is clicked", async () => {
    renderWithAuthOnly(
      <InviteForm invite={undefined} onInviteSuccess={onSuccess} onCancel={onCancel} />,
      { userOverrides: { role: "admin" } }
    );

    // wait for companies dropdown
    await screen.findByRole("combobox", { name: /company:/i });

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
