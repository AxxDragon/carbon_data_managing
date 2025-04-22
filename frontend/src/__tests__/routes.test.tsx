// src/__tests__/routes.test.tsx
import { screen, waitFor, within } from "@testing-library/react";
import AppRoutes from "../routes";

// Import the new helpers from testUtils.tsx
import { mockUseAuth, renderWithAuthOnly } from "../../test-utils/testUtils";

// Mock components (same as before)
jest.mock("../pages/LoginPage", () => () => <div>Login Page</div>);
jest.mock("../pages/LogoutPage", () => () => <div>Logout Page</div>);
jest.mock("../pages/TimeoutPage", () => () => <div>Timeout Page</div>);
jest.mock("../pages/ConsumptionList", () => () => <div>Consumption List</div>);
jest.mock("../pages/ConsumptionForm", () => () => <div>Consumption Form</div>);
jest.mock("../pages/Analyze", () => () => <div>Analyze</div>);
jest.mock("../pages/InviteUser", () => () => <div>Invite User</div>);
jest.mock("../pages/ManageUsers", () => () => <div>Manage Users</div>);
jest.mock("../pages/ManageProjects", () => () => <div>Manage Projects</div>);
jest.mock("../pages/ManageOptions", () => () => <div>Manage Options</div>);
jest.mock("../pages/CompleteAccountSetup", () => () => (
  <div>Complete Account Setup</div>
));
jest.mock("../pages/NotFound", () => () => <div>Not Found</div>);

describe("AppRoutes", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test("shows consumption list for authenticated user", async () => {
    // Set the mock context for a regular user.
    mockUseAuth("user");
    window.history.pushState({}, "Consumption List", "/consumption-list");

    renderWithAuthOnly(<AppRoutes />, { userOverrides: { role: "user" } });

    const main = await screen.findByRole("main");
    expect(within(main).getByText("Consumption List")).toBeInTheDocument();
  });

  test("companyadmin sees manage users and invite routes", async () => {
    mockUseAuth("companyadmin");
    window.history.pushState({}, "Manage Users", "/manage-users");

    renderWithAuthOnly(<AppRoutes />, { userOverrides: { role: "companyadmin" } });

    const main = await screen.findByRole("main");
    expect(within(main).getByText("Manage Users")).toBeInTheDocument();
  });

  test("admin sees manage options route", async () => {
    mockUseAuth("admin");
    window.history.pushState({}, "Manage Options", "/manage-options");

    renderWithAuthOnly(<AppRoutes />, { userOverrides: { role: "admin" } });

    const main = await screen.findByRole("main");
    expect(within(main).getByText("Manage Options")).toBeInTheDocument();
  });

  test("non-admin does not see manage options", async () => {
    mockUseAuth("user");
    window.history.pushState({}, "Manage Options", "/manage-options");

    renderWithAuthOnly(<AppRoutes />, { userOverrides: { role: "user" } });

    const main = await screen.findByRole("main");
    await waitFor(() => {
      expect(within(main).queryByText("Manage Options")).not.toBeInTheDocument();
    });
  });

  test("renders complete account setup for invited users", () => {
    mockUseAuth(null);
    window.history.pushState(
      {},
      "Complete Account Setup",
      "/complete-account-setup/sometoken"
    );

    renderWithAuthOnly(
      <AppRoutes />,
      { userOverrides: {} } // no user means invited
    );

    expect(screen.getByText("Complete Account Setup")).toBeInTheDocument();
  });

  test("renders 404 page for unknown route", async () => {
    mockUseAuth("user");
    window.history.pushState({}, "Not Found", "/nonexistent-route");

    renderWithAuthOnly(<AppRoutes />, { userOverrides: { role: "user" } });

    const main = await screen.findByRole("main");
    expect(within(main).getByText("Not Found")).toBeInTheDocument();
  });
});
