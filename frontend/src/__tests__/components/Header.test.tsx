import { render, screen, fireEvent } from "@testing-library/react";
import Header from "../../components/Header";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, AuthContextType } from "../../context/AuthContext";

// Mock useNavigate from react-router-dom
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockedNavigate,
  };
});

// Utility to render Header with mocked context
const renderWithAuth = (
  user: any,
  logout = jest.fn(),
  login = jest.fn(),
  updateToken = jest.fn()
) => {
  const mockContextValue: AuthContextType = {
    user,
    logout,
    login,
    updateToken,
  };

  return render(
    <AuthContext.Provider value={mockContextValue}>
      <MemoryRouter initialEntries={["/consumption-list"]}>
        <Header />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders app title and user email", () => {
    renderWithAuth({ email: "test@example.com", role: "user" });

    expect(screen.getByText("CARMA")).toBeInTheDocument();
    expect(
        screen.getByRole("button", { name: /test@example\.com/i })
      ).toBeInTheDocument();
  });

  test("renders common navigation links", () => {
    renderWithAuth({ email: "test@example.com", role: "user" });

    expect(screen.getByRole("link", { name: /consumption list/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /analyze/i })).toBeInTheDocument();
  });

  test("renders admin-only links", () => {
    renderWithAuth({ email: "admin@example.com", role: "admin" });

    expect(screen.getByRole("link", { name: /manage projects/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /manage users/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /invite/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /manage options/i })).toBeInTheDocument();
  });

  test("toggles dropdown menu", () => {
    renderWithAuth({ email: "test@example.com", role: "user" });

    const dropdownButton = screen.getByText(/test@example.com/i);
    fireEvent.click(dropdownButton);

    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  test("calls navigate and logout on logout click", () => {
    const logoutMock = jest.fn();
    renderWithAuth({ email: "test@example.com", role: "user" }, logoutMock);

    const dropdownButton = screen.getByText(/test@example.com/i);
    fireEvent.click(dropdownButton);

    const logoutButton = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(logoutButton);

    expect(mockedNavigate).toHaveBeenCalledWith("/logout");
    expect(logoutMock).toHaveBeenCalled();
  });
});
