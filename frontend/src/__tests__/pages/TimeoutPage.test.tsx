import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TimeoutPage from "../../pages/TimeoutPage";
import { useNavigate } from "react-router-dom";

// Mock the useNavigate hook
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("TimeoutPage", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    // Reset the mock before each test
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the timeout message and login button", () => {
    render(<TimeoutPage />);

    // Check for the presence of the header text
    expect(
      screen.getByRole("heading", {
        name: /you have been logged out due to inactivity/i,
      })
    ).toBeInTheDocument();

    // Check for the presence of the informational message
    expect(
      screen.getByText(
        /for your security, we logged you out after a period of inactivity/i
      )
    ).toBeInTheDocument();

    // Check for the presence of the "Go to Login" button
    expect(
      screen.getByRole("button", { name: /go to login/i })
    ).toBeInTheDocument();
  });

  it("navigates to /login when the button is clicked", async () => {
    render(<TimeoutPage />);

    const loginButton = screen.getByRole("button", { name: /go to login/i });

    // Simulate a user clicking the "Go to Login" button
    await userEvent.click(loginButton);

    // Assert that navigate was called with "/login"
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
