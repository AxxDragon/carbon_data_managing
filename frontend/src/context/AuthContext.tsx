import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  email: string;
  role: "user" | "companyadmin" | "admin";
  companyId: number;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: { token: string; user: User }) => void;
  logout: () => void;
  updateToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Retrieve user from localStorage if it exists
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Store user in localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = (userData: { token: string; user: User }) => {
    const fullUser: User = { ...userData.user, token: userData.token };
    setUser(fullUser);
    localStorage.setItem("user", JSON.stringify(fullUser));
  };  

  const logout = () => {
    setTimeout(() => {
      setUser(null);
      localStorage.removeItem("user");
    }, 100); // Short delay to allow navigation first
  };
  
  const updateToken = (token: string) => {
    setUser((prevUser) => (prevUser ? { ...prevUser, token } : null));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
