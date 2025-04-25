import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "../../pages/NotFound";

describe("NotFound", () => {
  test("renders 404 page with correct content", () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    // Check for the heading
    expect(
      screen.getByRole("heading", { name: /404 - Page Not Found/i })
    ).toBeInTheDocument();

    // Check for the descriptive text
    expect(
      screen.getByText(/Oops! The page you are looking for does not exist./i)
    ).toBeInTheDocument();

    // Check for the 'Go to Home' link
    const homeLink = screen.getByRole("link", { name: /Go to Home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
