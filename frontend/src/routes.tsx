// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import LoginPage from "./pages/LoginPage";
// import ConsumptionList from "./pages/ConsumptionList";
// // import InviteUser from "./pages/InviteUsers";
// // import ManageUsers from "./pages/ManageUsers";
// // import CreateProject from "./pages/CreateProject";
// // import NotFound from "./pages/NotFound";
// import { useAuth } from "./context/AuthContext"; // Import authentication context

// const AppRoutes = () => {
//     const { user } = useAuth(); // Get the authenticated user
//     return (
//         <Router>
//             <Routes>
//                 <Route path="/" element={user ? <Navigate to="/consumption-list" /> : <Navigate to="/login" />} />
//                 <Route path="/login" element={<LoginPage />} />
//                 <Route path="/consumption-list" element={<ConsumptionList />} />
//                 {/* <Route path="/invite" element={user?.role === "admin" ? <InviteUser /> : <Navigate to="/" />} />
//                 <Route path="/manage-users" element={user?.role === "companyadmin" || user?.role === "admin" ? <ManageUsers /> : <Navigate to="/" />} />
//                 <Route path="/create-project" element={user?.role === "companyadmin" || user?.role === "admin" ? <CreateProject /> : <Navigate to="/" />} />
//                 <Route path="*" element={<NotFound />} /> */}
//             </Routes>
//         </Router>
//     );
// };

// export default AppRoutes;

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ConsumptionList from "./pages/ConsumptionList";
import Layout from "./components/Layout"; 

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Redirect unauthenticated users to login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="consumption-list" element={<ConsumptionList />} />
          <Route path="analyze" element={<h1>Analyze (Placeholder)</h1>} />
          {user?.role === "companyadmin" || user?.role === "admin" ? (
            <>
              <Route path="create-project" element={<h1>Create Project (Placeholder)</h1>} />
              <Route path="manage-users" element={<h1>Manage Users (Placeholder)</h1>} />
            </>
          ) : null}
          {user?.role === "admin" && (
            <>
              <Route path="invite" element={<h1>Invite (Placeholder)</h1>} />
              <Route path="manage-options" element={<h1>Manage Options (Placeholder)</h1>} />
            </>
          )}
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
