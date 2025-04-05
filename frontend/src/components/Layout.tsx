import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <div className="flex-grow-1" style={{ marginTop: '120px' }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
