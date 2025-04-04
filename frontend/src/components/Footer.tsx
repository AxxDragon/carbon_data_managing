const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 text-center mt-3">
      <p className="mb-2">© 2025 CARMA. All rights reserved.</p>
      <p>
        <a href="/impressum" className="text-light text-decoration-none hover:text-primary">Impressum</a> |{" "}
        <a href="/terms" className="text-light text-decoration-none hover:text-primary">AGB</a>
      </p>
    </footer>
  );
};

export default Footer;
