import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import AppRoutes from "./routes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { setupInterceptors } from "./utils/api";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

const RootComponent = () => {
  const { updateToken } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      setupInterceptors(updateToken);
      initialized.current = true; // Mark as initialized
    }
  }, [updateToken]);

  return <AppRoutes />;
};

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <RootComponent />
    </AuthProvider>
  </React.StrictMode>
);
