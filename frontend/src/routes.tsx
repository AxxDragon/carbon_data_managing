import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import ConsumptionList from "./pages/ConsumptionList";
import ConsumptionForm from "./pages/ConsumptionForm";
import Analyze from "./pages/Analyze";
import InviteUser from "./pages/InviteUser";
import ManageUsers from "./pages/ManageUsers";
import ManageProjects from "./pages/ManageProjects";
import ManageOptions from "./pages/ManageOptions";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout"; 
import CompleteAccountSetup from "./pages/CompleteAccountSetup"; // Add this import

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Router>
      <Routes>
        {/* Routes for everyone (not logged in yet) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/complete-account-setup/:inviteToken" element={<CompleteAccountSetup />} /> {/* Account setup route */}

        {/* Routes requiring authentication */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="consumption-list" />} />
          <Route path="consumption-list" element={<ConsumptionList />} />
          <Route path="consumption-form" element={<ConsumptionForm />} />
          <Route path="consumption-form/:id" element={<ConsumptionForm />} />
          <Route path="analyze" element={<Analyze />} />
          <Route path="*" element={<NotFound />} />
          
          {/* Admin and companyadmin restricted routes */}
          {user?.role === "companyadmin" || user?.role === "admin" ? (
            <>
              <Route path="manage-projects" element={<ManageProjects />} />
              <Route path="manage-users" element={<ManageUsers />} />
              <Route path="invite" element={<InviteUser />} />
            </>
          ) : null}

          {/* Only admins can access manage-options */}
          {user?.role === "admin" && (
            <Route path="manage-options" element={<ManageOptions />} />
          )}
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
