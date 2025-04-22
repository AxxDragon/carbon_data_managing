import { screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../../pages/LoginPage";
import { renderWithAuth } from "../../../test-utils/testUtils";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";

// Mock the api module
jest.mock("../../utils/api");

// Mock the useNavigate hook
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("LoginPage", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock useNavigate to return our mockNavigate function
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  it("renders the login form", () => {
    renderWithAuth(<LoginPage />);

    // Check for email and password input fields and the login button
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("submits the form and navigates on successful login", async () => {
    // Mock the API response for a successful login
    (api.post as jest.Mock).mockResolvedValue({
      data: {
        token: "abc123",
        user: {
          id: 1,
          email: "test@example.com",
          role: "user",
          companyId: 1,
        },
      },
    });

    renderWithAuth(<LoginPage />);

    // Fill in the email and password fields
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // Wait for the API call and navigation to complete
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/auth/login", {
        email: "test@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/consumption-list");
    });
  });

  it("displays an error message on failed login", async () => {
    // Mock the API response for a failed login
    (api.post as jest.Mock).mockRejectedValue(new Error("Invalid credentials"));

    renderWithAuth(<LoginPage />);

    // Fill in the email and password fields
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
