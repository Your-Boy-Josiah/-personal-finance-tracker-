import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthLoadingScreen } from "./LoadingState";

export default function ProtectedRoute({ children }) {
  const { user, isCheckingAuth } = useAuth();
  const location = useLocation();
  let token = localStorage.getItem("token");

  // Intercept the dreaded "undefined" string bug
  if (token === "undefined" || token === "null") {
    localStorage.removeItem("token");
    token = null;
  }

  if (isCheckingAuth) return <AuthLoadingScreen />;

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
