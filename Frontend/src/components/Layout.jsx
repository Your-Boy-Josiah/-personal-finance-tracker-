// ===============================================================
//  Layout.jsx
//  Persistent sidebar and main content wrapper for authenticated
//  routes. Utilizes React Router's <Outlet /> to render nested pages.
// ===============================================================

import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, ArrowRightLeft, Target, LogOut, Wallet } from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Transactions", path: "/transactions", icon: ArrowRightLeft },
    { name: "Budget & Advisory", path: "/budget", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex w-full">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0f2923] text-white flex flex-col shadow-xl shrink-0">
        <div className="p-6 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Wallet className="h-5 w-5 text-[#0f2923]" />
            </div>
            <span className="text-xl font-bold tracking-tight">Monie-Track</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? "bg-emerald-500/20 text-emerald-300 font-medium" 
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm text-white">
              {user?.firstName?.charAt(0) || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </main>
      
    </div>
  );
}
