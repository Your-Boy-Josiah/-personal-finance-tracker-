import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  let token = localStorage.getItem("token");

  // Intercept the dreaded "undefined" string bug
  if (token === "undefined" || token === "null") {
    localStorage.removeItem("token");
    token = null;
  }

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
