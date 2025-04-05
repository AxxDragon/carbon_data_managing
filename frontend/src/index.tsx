import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { setupInterceptors } from "./utils/api";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

/* 
  RootComponent handles the setup of the application and interceptors for API requests. 
  It ensures the token management is properly initialized.
*/
const RootComponent = () => {
  const { updateToken } = useAuth(); // Hook to access the updateToken function from AuthContext
  const initialized = useRef(false); // Ref to track if the initialization has already occurred

  useEffect(() => {
    // Only initialize interceptors once to avoid redundant setup
    if (!initialized.current) {
      setupInterceptors(updateToken); // Set up API interceptors with the updateToken function to manage token refresh
      initialized.current = true; // Mark as initialized to prevent setting up interceptors again
    }
  }, [updateToken]); // Dependency array ensures setupInterceptors runs only when updateToken changes

  return <AppRoutes />; // Renders the routes of the app defined in AppRoutes
};

/* 
  Create a root element for rendering the app in the DOM. 
  StrictMode is used to highlight potential problems in the app during development.
*/
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Render the app wrapped in AuthProvider to make authentication context available throughout the app.
root.render(
  <React.StrictMode>
    {" "}
    {/* StrictMode helps identify potential problems in the app */}
    <AuthProvider>
      {" "}
      {/* AuthProvider provides authentication context to the app */}
      <RootComponent />{" "}
      {/* RootComponent initializes interceptors and renders the routes */}
    </AuthProvider>
  </React.StrictMode>
);
