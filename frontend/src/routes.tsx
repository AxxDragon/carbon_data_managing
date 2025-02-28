import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import ConsumptionList from "./pages/ConsumptionList";
import ConsumptionForm from "./pages/ConsumptionForm";
import Analyze from "./pages/Analyze";
import InviteUser from "./pages/InviteUser";
import ManageUsers from "./pages/ManageUsers";
import CreateProject from "./pages/CreateProject";
import ManageOptions from "./pages/ManageOptions";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout"; 

const AppRoutes = () => {
  const { user } = useAuth();
  // console.log("Routes updated! User role:", user?.role);
  return (
    <Router>
      <Routes>
        {/* Redirect unauthenticated users to login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="consumption-list" />} />
          <Route path="consumption-list" element={<ConsumptionList />} />
          <Route path="consumption-form" element={<ConsumptionForm />} />
          <Route path="consumption-form/:id" element={<ConsumptionForm />} />
          <Route path="analyze" element={<Analyze />} />
          <Route path="*" element={<NotFound />} />
          {user?.role === "companyadmin" || user?.role === "admin" ? (
            <>
              <Route path="create-project" element={<CreateProject />} />
              <Route path="manage-users" element={<ManageUsers />} />
              <Route path="invite" element={<InviteUser />} />
            </>
          ) : null}
          {user?.role === "admin" && (
            <>
              <Route path="manage-options" element={<ManageOptions />} />
            </>
          )}
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
