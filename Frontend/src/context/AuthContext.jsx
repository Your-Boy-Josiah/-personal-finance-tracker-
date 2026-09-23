import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Load any saved session on first render, so a page refresh
  // doesn't log the user out.
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function saveSession(token, userData) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }

  async function login(email, password) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      // Adjust these keys to match your backend's actual response shape,
      // e.g. res.data.data.token / res.data.data.user
      const { token, ...userData } = res.data;
      saveSession(token, userData);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Invalid email or password";
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
      const { token, ...userData } = res.data;
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
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
