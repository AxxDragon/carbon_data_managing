import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import TimeoutPage from "./pages/TimeoutPage";
import ConsumptionList from "./pages/ConsumptionList";
import ConsumptionForm from "./pages/ConsumptionForm";
import Analyze from "./pages/Analyze";
import InviteUser from "./pages/InviteUser";
import ManageUsers from "./pages/ManageUsers";
import ManageProjects from "./pages/ManageProjects";
import ManageOptions from "./pages/ManageOptions";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import CompleteAccountSetup from "./pages/CompleteAccountSetup";

const AppRoutes = () => {
  const { user } = useAuth(); // Extracting the user from authentication context

  return (
    <Router>
      <Routes>
        {/* Routes for everyone (not logged in yet, or any more) */}
        <Route path="/login" element={<LoginPage />} /> {/* Login page route */}
        <Route path="/logout" element={<LogoutPage />} />{" "}
        {/* Logout page route */}
        <Route path="/timeout" element={<TimeoutPage />} />{" "}
        {/* Timeout page route (for session timeout) */}
        {/* Account setup route (for users completing account setup after invitation) */}
        <Route
          path="/complete-account-setup/:inviteToken"
          element={<CompleteAccountSetup />}
        />
        {/* Routes requiring authentication (user must be logged in) */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          {" "}
          {/* Redirect unauthenticated users to the login page */}
          <Route index element={<Navigate to="consumption-list" />} />{" "}
          {/* Redirect root route to consumption-list */}
          <Route path="consumption-list" element={<ConsumptionList />} />{" "}
          {/* Consumption list page */}
          <Route path="consumption-form" element={<ConsumptionForm />} />{" "}
          {/* Consumption form page */}
          <Route
            path="consumption-form/:id"
            element={<ConsumptionForm />}
          />{" "}
          {/* Consumption form page with specific id */}
          <Route path="analyze" element={<Analyze />} /> {/* Analyze page */}
          <Route path="*" element={<NotFound />} />{" "}
          {/* 404 page for unknown routes */}
          {/* Admin and companyadmin restricted routes */}
          {user?.role === "companyadmin" || user?.role === "admin" ? (
            <>
              <Route path="manage-projects" element={<ManageProjects />} />{" "}
              {/* Manage projects page */}
              <Route path="manage-users" element={<ManageUsers />} />{" "}
              {/* Manage users page */}
              <Route path="invite" element={<InviteUser />} />{" "}
              {/* Invite user page */}
            </>
          ) : null}
          {/* Only admins can access manage-options */}
          {user?.role === "admin" && (
            <Route path="manage-options" element={<ManageOptions />} />
          )}{" "}
          {/* Manage options page, accessible only by admin */}
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
