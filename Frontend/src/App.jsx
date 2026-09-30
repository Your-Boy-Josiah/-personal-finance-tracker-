// ===============================================================
//  App.jsx
//  Main application entry point and router configuration.
//  Handles public/protected route separation and global context.
// ===============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// --- Pages ---
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Budget from "./pages/Budget";
import BudgetAdvisory from "./pages/BudgetAdvisory";

// ==============================================================
// MAIN COMPONENT
// ==============================================================

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ================================================== */}
          {/* PUBLIC ROUTES */}
          {/* ================================================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* ================================================== */}
          {/* PROTECTED ROUTES (Wrapped in Layout Sidebar) */}
          {/* ================================================== */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="categories" element={<Categories />} />
            <Route path="budget" element={<Budget />} />
            
            {/* FIXED: Moved advisory route into the protected layout! */}
            <Route path="advisory" element={<BudgetAdvisory />} />
          </Route>

          {/* Catch-all route for invalid URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
