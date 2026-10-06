import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (sessionUser) return JSON.parse(sessionUser);
      const localUser = localStorage.getItem("user");
      return localUser ? JSON.parse(localUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    return sessionStorage.getItem("role") || localStorage.getItem("role") || "";
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem("token") || localStorage.getItem("token") || "";
  });

  // Keep state in sync with sessionStorage
  const login = (userData, userRole, userToken = "mock-jwt-token") => {
    // Store strictly in sessionStorage for independent browser tabs
    sessionStorage.setItem("user", JSON.stringify(userData));
    sessionStorage.setItem("role", userRole);
    sessionStorage.setItem("token", userToken);

    // Also update legacy localStorage for single tab backwards compatibility, but tab-scoped sessionStorage takes precedence
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("role", userRole);
    localStorage.setItem("token", userToken);

    setUser(userData);
    setRole(userRole);
    setToken(userToken);
  };

  const logout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    setUser(null);
    setRole("");
    setToken("");
  };

  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    sessionStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, role, token, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
