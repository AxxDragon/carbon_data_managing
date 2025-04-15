import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    // Container for the entire page layout, using flexbox to manage layout structure
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Render the Header component at the top of the page */}
      <Header />

      {/* Main content area where the nested routes will be rendered */}
      <div className="flex-grow-1" style={{ marginTop: "120px" }} role="main">
        {/* Outlet renders the matching child route for the current path */}
        <Outlet />
      </div>

      {/* Render the Footer component at the bottom of the page */}
      <Footer />
    </div>
  );
};

export default Layout;
