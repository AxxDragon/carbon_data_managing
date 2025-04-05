// Footer Component: This component renders the footer of the page with necessary copyright and legal links.
const Footer = () => {
  return (
    // Footer section with dark background and white text.
    // The py-4 class adds vertical padding, text-center centers the text, mt-3 adds a margin at the top.
    <footer className="bg-dark text-white py-4 text-center mt-3">
      {/* Copyright notice with the current year and the name of the project (CARMA) */}
      <p className="mb-2">© 2025 CARMA. All rights reserved.</p>

      {/* Legal links section with links to Impressum and Terms of Service (AGB) */}
      <p>
        {/* 'Impressum' link with no text decoration and hover effect, links to the Impressum page */}
        <a
          href="/impressum"
          className="text-light text-decoration-none hover:text-primary"
        >
          Impressum
        </a>{" "}
        |{" "}
        {/* 'AGB' link with no text decoration and hover effect, links to the Terms of Service page */}
        <a
          href="/terms"
          className="text-light text-decoration-none hover:text-primary"
        >
          AGB
        </a>
      </p>
    </footer>
  );
};

// Exporting the Footer component so it can be used in other parts of the application.
export default Footer;
