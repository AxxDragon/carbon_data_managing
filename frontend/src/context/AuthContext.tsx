import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

// User type interface to define the structure of the user object
export interface User {
  id: number;
  email: string;
  role: "user" | "companyadmin" | "admin";
  companyId: number;
  token: string;
}

// AuthContextType defines the shape of the context for user authentication
export interface AuthContextType {
  user: User | null;
  login: (userData: { token: string; user: User }) => void;
  logout: () => void;
  updateToken: (token: string) => void;
}

// Create a context with an undefined initial value, to be provided by AuthProvider
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the application and provide auth-related values
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // State to store the current user, initially set from localStorage (if available)
  const [user, setUser] = useState<User | null>(() => {
    // Retrieve user from localStorage if it exists
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Effect hook to update localStorage whenever the user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user)); // Save user to localStorage
    } else {
      localStorage.removeItem("user"); // Remove user from localStorage if logged out
    }
  }, [user]);

  // Login function to update user state and store it in localStorage
  const login = (userData: { token: string; user: User }) => {
    // Clear any previous data just in case
    localStorage.removeItem("user");
    setUser(null);

    const fullUser: User = { ...userData.user, token: userData.token }; // Combine user data with token
    setUser(fullUser); // Update state with the full user object
    localStorage.setItem("user", JSON.stringify(fullUser)); // Store user data in localStorage
  };

  // Logout function to clear user state and remove data from localStorage
  const logout = async () => {
    try {
      await api.post("/auth/logout"); // Axios handles credentials if configured
    } catch (error) {
      console.error("Logout API call failed:", error);
    }
    setTimeout(() => {
      setUser(null); // Reset user state
      localStorage.removeItem("user"); // Remove user data from localStorage
    }, 100); // Short delay to allow navigation first
  };

  // Update the authentication token without changing other user details
  const updateToken = (token: string) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, token } : null)); // Update token if user exists
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider value={{ user, login, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);

  // Error handling if useAuth is used outside of the AuthProvider
  if (!context) throw new Error("useAuth must be used within an AuthProvider");

  return context; // Return the auth context
};
