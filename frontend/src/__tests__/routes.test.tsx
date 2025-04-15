import { render, screen, waitFor, within } from "@testing-library/react";
import AppRoutes from "../routes";
import { AuthProvider } from "../context/AuthContext";
import * as AuthContext from "../context/AuthContext";

// Mock components
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

const mockUser = (role: "user" | "companyadmin" | "admin" | null) => {
  const fullUser = role
    ? {
        id: 1,
        email: `${role}@example.com`,
        role,
        companyId: 123,
        token: "fake-token",
      }
    : null;

  jest.spyOn(AuthContext, "useAuth").mockReturnValue({
    user: fullUser,
    login: jest.fn(),
    logout: jest.fn(),
    updateToken: jest.fn(),
  });
};

const renderWithAuthProvider = (ui: React.ReactNode) => {
  return render(<AuthProvider>{ui}</AuthProvider>);
};

describe("AppRoutes", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test("shows consumption list for authenticated user", async () => {
    mockUser("user");
    window.history.pushState({}, "Consumption List", "/consumption-list");

    renderWithAuthProvider(<AppRoutes />);

    const main = await screen.findByRole("main");
    expect(within(main).getByText("Consumption List")).toBeInTheDocument();
  });

  test("companyadmin sees manage users and invite routes", async () => {
    mockUser("companyadmin");
    window.history.pushState({}, "Manage Users", "/manage-users");

    renderWithAuthProvider(<AppRoutes />);

    const main = await screen.findByRole("main");
    expect(within(main).getByText("Manage Users")).toBeInTheDocument();
  });

  test("admin sees manage options route", async () => {
    mockUser("admin");
    window.history.pushState({}, "Manage Options", "/manage-options");

    renderWithAuthProvider(<AppRoutes />);

    const main = await screen.findByRole("main");
    expect(within(main).getByText("Manage Options")).toBeInTheDocument();
  });

  test("non-admin does not see manage options", async () => {
    mockUser("user");
    window.history.pushState({}, "Manage Options", "/manage-options");

    renderWithAuthProvider(<AppRoutes />);

    const main = await screen.findByRole("main");
    await waitFor(() => {
      expect(within(main).queryByText("Manage Options")).not.toBeInTheDocument();
    });
  });

  test("renders complete account setup for invited users", () => {
    mockUser(null);
    window.history.pushState(
      {},
      "Complete Account Setup",
      "/complete-account-setup/sometoken"
    );

    renderWithAuthProvider(<AppRoutes />);

    expect(screen.getByText("Complete Account Setup")).toBeInTheDocument();
  });

  test("renders 404 page for unknown route", async () => {
    mockUser("user");
    window.history.pushState({}, "Not Found", "/nonexistent-route");

    renderWithAuthProvider(<AppRoutes />);

    const main = await screen.findByRole("main");
    expect(within(main).getByText("Not Found")).toBeInTheDocument();
  });
});
