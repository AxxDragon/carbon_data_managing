/* eslint-disable testing-library/no-node-access */

import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InviteUser from "../../pages/InviteUser";
import api from "../../utils/api";
import { renderWithAuthOnly } from "../../../test-utils/testUtils";

// polyfill confirm/alert
beforeAll(() => {
  jest.spyOn(window, "confirm").mockReturnValue(true);
  jest.spyOn(window, "alert").mockImplementation(() => {});
});
afterAll(() => {
  (window.confirm as jest.Mock).mockRestore();
  (window.alert as jest.Mock).mockRestore();
});

jest.mock("../../utils/api");

describe("InviteUser Page", () => {
  const fakeInvites = [
    {
      id: 1,
      email: "alice@example.com",
      firstName: "Alice",
      lastName: "Smith",
      role: "user",
      companyId: 10,
      createdAt: "2025-04-20T12:00:00Z",
    },
    {
      id: 2,
      email: "bob@example.com",
      firstName: "Bob",
      lastName: "Jones",
      role: "companyadmin",
      companyId: 20,
      createdAt: "2025-04-21T13:00:00Z",
    },
  ];
  const fakeCompanies = [
    { id: 10, name: "Acme Corp" },
    { id: 20, name: "Globex Inc" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === "invites") {
        return Promise.resolve({ data: fakeInvites });
      }
      if (url === "options/companies") {
        return Promise.resolve({ data: fakeCompanies });
      }
      return Promise.reject(new Error("unmocked " + url));
    });
    (api.delete as jest.Mock).mockResolvedValue({});
    (api.post as jest.Mock).mockResolvedValue({});
  });

  it("renders a table of invites", async () => {
    renderWithAuthOnly(<InviteUser />, { userOverrides: { role: "admin" } });

    // wait for first invite name
    await screen.findByText("Alice Smith");

    // header + two data rows
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1 /* header */ + fakeInvites.length);

    // spot-check some cells
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("filters invites by search term", async () => {
    renderWithAuthOnly(<InviteUser />, { userOverrides: { role: "admin" } });
    await screen.findByText("Alice Smith");

    await userEvent.type(
      screen.getByPlaceholderText(/search invites/i),
      "bob"
    );
    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("deletes an invite upon confirmation", async () => {
    renderWithAuthOnly(<InviteUser />, { userOverrides: { role: "admin" } });
    await screen.findByText("Alice Smith");

    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    await waitFor(() =>
      expect(api.delete).toHaveBeenCalledWith("invites/1", expect.any(Object))
    );
  });

  it("resends an invite", async () => {
    renderWithAuthOnly(<InviteUser />, { userOverrides: { role: "admin" } });
    await screen.findByText("Alice Smith");

    fireEvent.click(screen.getAllByRole("button", { name: /resend/i })[0]);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        `invites/1/resend`,
        {},
        expect.any(Object)
      )
    );
    expect(window.alert).toHaveBeenCalledWith("Invite resent successfully!");
  });

  it("opens the form to create a new invite", async () => {
    renderWithAuthOnly(<InviteUser />, { userOverrides: { role: "admin" } });
    await screen.findByText("Manage Invites");

    // click the "Create Invite" button
    fireEvent.click(
      screen.getByRole("button", { name: /create invite/i })
    );

    // find the Send Invitation button, then scope queries to its form
    const sendBtn = await screen.findByRole("button", {
      name: /send invitation/i,
    });
    const form = sendBtn.closest("form")!;
    // Within that form we should have exactly 3 textboxes (first, last, email)
    const textboxes = within(form).getAllByRole("textbox");
    expect(textboxes).toHaveLength(3);

    // and 2 comboboxes (role, company)
    const combos = within(form).getAllByRole("combobox");
    expect(combos).toHaveLength(2);
  });

  it("opens the form pre-filled for editing", async () => {
    renderWithAuthOnly(<InviteUser />, { userOverrides: { role: "admin" } });
    await screen.findByText("Alice Smith");

    // click the "Edit" button next to the first invite
    fireEvent.click(
      screen.getAllByRole("button", { name: /edit/i })[0]
    );

    // then find the form and assert its fields are pre-filled
    const sendBtn = await screen.findByRole("button", {
      name: /send invitation/i,
    });
    const form = sendBtn.closest("form")!;
    const textboxes = within(form).getAllByRole("textbox");

    expect(textboxes[0]).toHaveValue("Alice");
    expect(textboxes[1]).toHaveValue("Smith");
    expect(textboxes[2]).toHaveValue("alice@example.com");
  });
});
