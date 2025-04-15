import { render, screen } from "@testing-library/react";
import Footer from "../../components/Footer";

describe("Footer", () => {
  test("renders copyright and legal links", () => {
    render(<Footer />);

    expect(
      screen.getByText(/© 2025 CARMA\. All rights reserved\./i)
    ).toBeInTheDocument();

    // expect(screen.getByRole("link", { name: /impressum/i })).toHaveAttribute(
    //   "href",
    //   "/impressum"
    // );
    // expect(screen.getByRole("link", { name: /agb/i })).toHaveAttribute(
    //   "href",
    //   "/terms"
    // );
  });
});
