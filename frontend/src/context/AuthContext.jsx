import React, { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, signup as apiSignup } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to parse name dynamically from email
  const getNameFromEmail = (email) => {
    if (!email) return "Guest";
    const prefix = email.split("@")[0];
    return prefix
      .split(/[\._\-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  // Helper to decode JWT token payload
  const decodeToken = (jwtToken) => {
    try {
      const base64Url = jwtToken.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Resolve user on token change
  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token);
      const email = decoded?.sub || null;
      
      if (email) {
        // Try to load cached user info from signup registration
        const cachedStr = localStorage.getItem(`user_profile_${email}`);
        if (cachedStr) {
          try {
            setUser(JSON.parse(cachedStr));
          } catch (e) {
            setUser({ name: getNameFromEmail(email), email });
          }
        } else {
          setUser({ name: getNameFromEmail(email), email });
        }
      } else {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    const access_token = res.data.access_token;
    
    localStorage.setItem("token", access_token);
    setToken(access_token);
    return res;
  };

  const signup = async (name, email, password) => {
    const res = await apiSignup({ name, email, password });
    // Cache the name for future logins with this email
    localStorage.setItem(
      `user_profile_${email}`,
      JSON.stringify({ name, email })
    );
    return res;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
