// ===============================================================
//  Layout.jsx
//  Persistent sidebar and main content wrapper for authenticated
//  routes. Utilizes React Router's <Outlet /> to render nested pages.
//  Now featuring a draggable, resizable sidebar with exact memory.
// ===============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { 
  LayoutDashboard, Target, FolderPlus, ArrowRightLeft, 
  TrendingUp, Settings, UserCircle, LogOut, Wallet, 
  ChevronLeft, ChevronRight, Moon, Sun 
} from "lucide-react";

// Sidebar limits in pixels
const MIN_WIDTH = 80;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256; 

export default function Layout() {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  
  // --- Resizable Sidebar State ---
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      return MIN_WIDTH;
    }

    const savedWidth = localStorage.getItem("monie-track-sidebar-width");
    if (savedWidth !== null) {
      return parseInt(savedWidth, 10);
    }
    return DEFAULT_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);
  const lastExpandedWidth = useRef(DEFAULT_WIDTH);

  // Restore last expanded width preference (for the toggle button)
  useEffect(() => {
    const savedLast = localStorage.getItem("monie-track-last-expanded");
    if (savedLast !== null) {
      lastExpandedWidth.current = parseInt(savedLast, 10);
    }
  }, []);

  // --- Dragging Handlers ---
  const startResizing = useCallback(() => {
    setIsDragging(true);
  }, []);

  const resize = useCallback((mouseMoveEvent) => {
    if (isDragging) {
      // Calculate new width, constrained by our MIN and MAX limits
      const newWidth = mouseMoveEvent.clientX;
      setSidebarWidth(Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH));
    }
  }, [isDragging]);

  const stopResizing = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Save the exact dragged width to storage
      localStorage.setItem("monie-track-sidebar-width", sidebarWidth.toString());
      
      // If it's expanded past the minimum, remember this as the preferred "open" size
      if (sidebarWidth > MIN_WIDTH) {
        lastExpandedWidth.current = sidebarWidth;
        localStorage.setItem("monie-track-last-expanded", sidebarWidth.toString());
      }
    }
  }, [isDragging, sidebarWidth]);

  // Attach global mouse listeners for smooth dragging outside the sidebar bounds
  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Handle automatic collapsing on very small mobile screens
  useEffect(() => {
    const viewportQuery = window.matchMedia("(min-width: 768px)");
    const updateSidebar = (event) => {
      if (!event.matches) {
        setSidebarWidth(MIN_WIDTH);
        localStorage.setItem("monie-track-sidebar-width", MIN_WIDTH.toString());
      } else {
        const expandTo = lastExpandedWidth.current > MIN_WIDTH ? lastExpandedWidth.current : DEFAULT_WIDTH;
        setSidebarWidth(expandTo);
        localStorage.setItem("monie-track-sidebar-width", expandTo.toString());
      }
    };

    viewportQuery.addEventListener("change", updateSidebar);
    return () => viewportQuery.removeEventListener("change", updateSidebar);
  }, []);

  const toggleSidebar = () => {
    if (sidebarWidth > MIN_WIDTH) {
      // User clicked collapse: Save current width and snap to MIN
      lastExpandedWidth.current = sidebarWidth;
      localStorage.setItem("monie-track-last-expanded", sidebarWidth.toString());
      setSidebarWidth(MIN_WIDTH);
      localStorage.setItem("monie-track-sidebar-width", MIN_WIDTH.toString());
    } else {
      // User clicked expand: Snap back to their last custom width
      const expandTo = lastExpandedWidth.current > MIN_WIDTH ? lastExpandedWidth.current : DEFAULT_WIDTH;
      setSidebarWidth(expandTo);
      localStorage.setItem("monie-track-sidebar-width", expandTo.toString());
    }
  };

  // Determines if text should be shown based on how wide the user dragged it
  const isExpandedText = sidebarWidth > 140;

  const navItems = [
    { name: "Dash-Board", path: "/app", icon: LayoutDashboard },
    { name: "Set Budget", path: "/app/budget", icon: Target },
    { name: "Create Category", path: "/app/categories", icon: FolderPlus },
    { name: "View Transactions", path: "/app/transactions", icon: ArrowRightLeft },
    { name: "View Advisory", path: "/app/advisory", icon: TrendingUp },
    { name: "Settings", path: "/app/settings", icon: Settings },
    { name: "Account", path: "/app/account", icon: UserCircle },
  ];

  return (
    <div 
      className="flex min-h-screen w-full bg-slate-50 transition-colors duration-200 dark:bg-black"
      // Prevent messy text selection highlighting while dragging
      style={{ userSelect: isDragging ? "none" : "auto" }}
    >
      {sidebarWidth > MIN_WIDTH && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Close navigation"
          className="fixed inset-0 z-10 bg-black/40 md:hidden"
        />
      )}
      <aside 
        style={{ width: sidebarWidth }}
        className={`${sidebarWidth > MIN_WIDTH ? "fixed left-0 top-0 max-w-[78vw] md:sticky md:left-auto md:top-0 md:max-w-none" : "sticky top-0"} z-20 flex h-screen shrink-0 flex-col bg-[#0f2923] text-white shadow-xl dark:border-r dark:border-neutral-800 dark:bg-[#050505] ${
          isDragging ? "transition-none" : "transition-all duration-300 ease-in-out"
        }`}
      >
        {/* INVISIBLE DRAG HANDLE */}
        <div
          onMouseDown={startResizing}
          className="absolute right-0 top-0 z-30 h-full w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-emerald-500/50 active:bg-emerald-500"
          title="Drag to resize"
        />

        {/* TOGGLE BUTTON */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarWidth > MIN_WIDTH ? "Collapse sidebar" : "Expand sidebar"}
          title={sidebarWidth > MIN_WIDTH ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute -right-3 top-6 z-40 rounded-full bg-emerald-500 p-1 text-white shadow-md transition-colors hover:bg-emerald-400"
        >
          {sidebarWidth > MIN_WIDTH ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="p-4 mb-2 h-16 flex items-center">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="bg-emerald-100 p-1.5 rounded-lg shrink-0">
              <Wallet className="h-5 w-5 text-[#0f2923]" />
            </div>
            {isExpandedText && <span className="text-lg font-bold tracking-tight transition-opacity duration-300">Monie-Track</span>}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                title={!isExpandedText ? item.name : ""} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors whitespace-nowrap overflow-hidden ${isActive ? "bg-emerald-500/20 dark:bg-neutral-800 text-emerald-300 dark:text-white font-medium" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={18} className="shrink-0" />
                {isExpandedText && <span className="text-sm transition-opacity duration-300">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 dark:border-neutral-800 space-y-2 overflow-hidden">
          <button onClick={toggleTheme} title={!isExpandedText ? "Toggle Theme" : ""} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5 transition-colors whitespace-nowrap cursor-pointer">
            {isDark ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
            {isExpandedText && <span className="text-sm transition-opacity duration-300">Toggle Theme</span>}
          </button>
          
          <button onClick={logout} title={!isExpandedText ? "Log out" : ""} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors whitespace-nowrap cursor-pointer">
            <LogOut size={18} className="shrink-0" />
            {isExpandedText && <span className="text-sm font-medium transition-opacity duration-300">Log out</span>}
          </button>
        </div>
      </aside>

      <main className="h-screen min-w-0 flex-1 overflow-y-auto text-slate-900 dark:text-neutral-100">
        <Outlet />
      </main>
    </div>
  );
}
