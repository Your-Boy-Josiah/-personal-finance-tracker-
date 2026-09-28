// ===============================================================
//  Layout.jsx
//  Persistent sidebar and main content wrapper for authenticated
//  routes. Utilizes React Router's <Outlet /> to render nested pages.
// ===============================================================

import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, Target, FolderPlus, ArrowRightLeft, 
  TrendingUp, Settings, UserCircle, LogOut, Wallet, 
  ChevronLeft, ChevronRight, Moon, Sun 
} from "lucide-react";

export default function Layout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDark, setIsDark] = useState(false);
  
  // Initialize theme on first load
  useEffect(() => {
    const savedTheme = localStorage.getItem('monie-track-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // FORCEFUL TOGGLE FUNCTION
  const toggleTheme = () => {
    setIsDark((prev) => {
      const newDark = !prev;
      if (newDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('monie-track-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('monie-track-theme', 'light');
      }
      return newDark;
    });
  };

  const navItems = [
    { name: "Dash-Board", path: "/", icon: LayoutDashboard },
    { name: "Set Budget", path: "/budget", icon: Target },
    { name: "Create Category", path: "/categories", icon: FolderPlus },
    { name: "View Transactions", path: "/transactions", icon: ArrowRightLeft },
    { name: "View Advisory", path: "/advisory", icon: TrendingUp },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Account", path: "/account", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex w-full transition-colors duration-200">
      <aside className={`${isExpanded ? 'w-64' : 'w-20'} bg-[#0f2923] dark:bg-[#050505] dark:border-r dark:border-neutral-800 text-white flex flex-col shadow-xl shrink-0 transition-all duration-300 relative z-20`}>
        <button onClick={() => setIsExpanded(!isExpanded)} className="absolute -right-3 top-6 bg-emerald-500 text-white rounded-full p-1 shadow-md hover:bg-emerald-400 transition-colors">
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="p-4 mb-2 h-16 flex items-center">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="bg-emerald-100 p-1.5 rounded-lg shrink-0">
              <Wallet className="h-5 w-5 text-[#0f2923]" />
            </div>
            {isExpanded && <span className="text-lg font-bold tracking-tight">Monie-Track</span>}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path} title={!isExpanded ? item.name : ""} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap ${isActive ? "bg-emerald-500/20 dark:bg-neutral-800 text-emerald-300 dark:text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
                <Icon size={18} className="shrink-0" />
                {isExpanded && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 dark:border-neutral-800 space-y-2">
          {/* Theme button now uses the forceful toggleTheme function */}
          <button onClick={toggleTheme} title={!isExpanded ? "Toggle Theme" : ""} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors whitespace-nowrap cursor-pointer">
            {isDark ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
            {isExpanded && <span className="text-sm">Toggle Theme</span>}
          </button>
          
          <button onClick={logout} title={!isExpanded ? "Log out" : ""} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors whitespace-nowrap cursor-pointer">
            <LogOut size={18} className="shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Log out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto text-slate-900 dark:text-neutral-100">
        <Outlet />
      </main>
    </div>
  );
}
