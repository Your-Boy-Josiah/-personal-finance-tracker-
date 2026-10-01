// ===============================================================
//  AuthContext.jsx
//  Manages global authentication state, token persistence, and
//  enhanced error surfacing from the backend.
// ===============================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/auth/me");
          // /me endpoint wraps response in { success: true, data: {...} }
          setUser(res.data.data);
        } catch {
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  // Helper to extract nested backend errors
  const extractErrors = (err) => {
    if (err.response?.data?.errors) {
      return err.response.data.errors.join(" | ");
    }
    return err.response?.data?.message || "An unexpected error occurred.";
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      const { token, ...userData } = res.data;
      setUser(userData);
      return { success: true };
    } catch (err) {
      setError(extractErrors(err));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/register", userData);
      localStorage.setItem("token", res.data.token);
      const { token, ...authenticatedUser } = res.data;
      setUser(authenticatedUser);
      return { success: true };
    } catch (err) {
      setError(extractErrors(err));
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const res = await api.put("/auth/profile", profileData);
      setUser(res.data.data);
      return { success: true, data: res.data.data };
    } catch (err) {
      const message = extractErrors(err);
      setError(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (passwordData) => {
    setError(null);
    try {
      const res = await api.put("/auth/password", passwordData);
      return { success: true, message: res.data.message };
    } catch (err) {
      const message = extractErrors(err);
      setError(message);
      return { success: false, error: message };
    }
  };

  const updateUser = useCallback((updates) => {
    setUser((currentUser) => currentUser ? { ...currentUser, ...updates } : currentUser);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, updateProfile, updateUser, changePassword, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
