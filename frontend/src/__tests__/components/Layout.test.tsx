import React from "react";
import { screen } from "@testing-library/react";
import Layout from "../../components/Layout";
import { renderWithAuth } from "../../../test-utils/testUtils";

// Mock the Outlet so that we can verify its content
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: () => <div>Mocked Outlet Content</div>,
}));

describe("Layout", () => {
  test("renders Header, Footer, and Outlet", () => {
    // Use renderWithAuth to wrap Layout with AuthContext and MemoryRouter.
    // Override the default user to have the email "layoutuser@example.com"
    renderWithAuth(<Layout />, {
      userOverrides: { email: "layoutuser@example.com", role: "user" },
      route: "/",
    });

    // Check that the outlet content is rendered
    expect(screen.getByText("Mocked Outlet Content")).toBeInTheDocument();

    // Verify Header renders the title and the user email button
    expect(screen.getByText("CARMA")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /layoutuser@example\.com/i })
    ).toBeInTheDocument();

    // Verify Footer content (assuming your Footer renders "impressum" and "agb")
    expect(screen.getByText(/impressum/i)).toBeInTheDocument();
    expect(screen.getByText(/agb/i)).toBeInTheDocument();
  });
});
