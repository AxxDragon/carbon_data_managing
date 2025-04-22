import { render, screen, fireEvent } from "@testing-library/react";
import Header from "../../components/Header";
import { MemoryRouter } from "react-router-dom";
// Import the helpers from testUtils.tsx (adjust the relative path as needed)
import { renderWithAuth, mockUseAuth } from "../../../test-utils/testUtils";
import { AuthContext } from '../../context/AuthContext';

// Mock useNavigate from react-router-dom
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockedNavigate,
  };
});

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders app title and user email", () => {
    // Use the helper to set mock auth values.
    mockUseAuth("user");

    // Use the helper to render Header wrapped in Auth and Router.
    renderWithAuth(<Header />, { route: "/consumption-list" });

    expect(screen.getByText("CARMA")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /user@example\.com/i })
    ).toBeInTheDocument();
  });

  test("renders common navigation links", () => {
    mockUseAuth("user");
    renderWithAuth(<Header />, { route: "/consumption-list" });

    expect(
      screen.getByRole("link", { name: /consumption list/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /analyze/i })).toBeInTheDocument();
  });

  test("renders admin-only links", () => {
    mockUseAuth("admin");
    renderWithAuth(<Header />, { route: "/consumption-list" });

    expect(
      screen.getByRole("link", { name: /manage projects/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /manage users/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /invite/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /manage options/i })
    ).toBeInTheDocument();
  });

  test("toggles dropdown menu", () => {
    mockUseAuth("user");
    renderWithAuth(<Header />, { route: "/consumption-list" });

    const dropdownButton = screen.getByText(/user@example\.com/i);
    fireEvent.click(dropdownButton);

    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  test("calls navigate and logout on logout click", () => {
    const logoutMock = jest.fn();
    // For this test we bypass the helper and supply our own AuthContext.
    render(
      <AuthContext.Provider
        value={{
          user: { id: 1, email: "user@example.com", role: "user", companyId: 123, token: "fake-token" },
          login: jest.fn(),
          logout: logoutMock,
          updateToken: jest.fn(),
        }}
      >
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const dropdownButton = screen.getByText(/user@example\.com/i);
    fireEvent.click(dropdownButton);

    const logoutButton = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockedNavigate).toHaveBeenCalledWith("/logout");
  });
});
