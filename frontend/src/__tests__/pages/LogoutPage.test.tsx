import { render, screen, act } from "@testing-library/react";
import LogoutPage from "../../pages/LogoutPage";
import { MemoryRouter } from "react-router-dom";
import { useNavigate } from "react-router-dom";

// Mock useNavigate
jest.mock("react-router-dom", () => {
  const originalModule = jest.requireActual("react-router-dom");
  return {
    __esModule: true,
    ...originalModule,
    useNavigate: jest.fn(),
  };
});

describe("LogoutPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("renders logout message and redirects after 2 seconds", () => {
    const mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <LogoutPage />
      </MemoryRouter>
    );

    // Check for the heading
    expect(
      screen.getByRole("heading", { name: /You have been logged out/i })
    ).toBeInTheDocument();

    // Check for the redirect message
    expect(
      screen.getByText(/Redirecting to the login page.../i)
    ).toBeInTheDocument();

    // Check for the loading spinner
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Fast-forward time by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Check that navigate was called with "/login"
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
