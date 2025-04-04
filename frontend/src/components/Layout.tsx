import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-light">
      <Header />
      {/* Adjusting margin-top based on header height (~140px) */}
      <main className="flex-grow p-4" style={{ marginTop: '140px' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
