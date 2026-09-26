import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Safely initialize state and prevent JSON parsing crashes
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved && saved !== "undefined" ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function saveSession(token, userData) {
    if (!token) return;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  async function login(email, password) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      
      // Smart extraction: handles both standard { token, user } and nested { data: { token, user } }
      const payload = res.data.data || res.data;
      const token = payload.token || payload.accessToken;
      const userData = payload.user || payload;
      
      saveSession(token, userData);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Invalid email or password";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }

  async function register(formData) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/register", formData);
      
      const payload = res.data.data || res.data;
      const token = payload.token || payload.accessToken;
      const userData = payload.user || payload;
      
      saveSession(token, userData);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Unable to create account";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
