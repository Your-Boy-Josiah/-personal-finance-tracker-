// ===============================================================
//  Login.jsx
//  Handles user authentication, displaying a split-screen UI with
//  dynamic currency branding and a secure login form.
// ===============================================================

// ==============================================================
// IMPORTS & MOCK DATA
// ==============================================================
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wallet, Eye, EyeOff } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

// Mock data to draw the decorative chart on the login screen
const mockChartData = [
  { value: 4000 }, { value: 3000 }, { value: 5500 }, 
  { value: 4500 }, { value: 7000 }, { value: 5800 }, { value: 8000 }
];

const currencies = [
  { symbol: "₦", amount: "15,450,000.00", label: "Naira", income: "₦3,850,000", spent: "₦1,900,000" },
  { symbol: "$", amount: "24,830.00", label: "USD", income: "$6,240", spent: "$3,180" },
  { symbol: "£", amount: "19,450.00", label: "GBP", income: "£4,800", spent: "£2,100" }
];

// ==============================================================
// COMPONENT
// ==============================================================
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currencyIndex, setCurrencyIndex] = useState(0);
  
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();

  // Cycles through the currencies every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrencyIndex((prev) => (prev + 1) % currencies.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate("/");
    }
  };

  const activeCurrency = currencies[currencyIndex];

  // ==============================================================
  // RENDER
  // ==============================================================
  return (
    <div className="min-h-screen flex w-full">
      
      {/* LEFT PANEL - Branding & Slideshow (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f2923] flex-col justify-between p-12 lg:p-16 text-white">
        
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-[#0f2923]" />
            </div>
            <span className="text-xl font-bold tracking-tight">Monie-Track</span>
          </div>

          {/* Hero Text */}
          <h1 className="text-5xl lg:text-6xl font-serif font-medium leading-tight mb-6">
            Every Amount<br />Is Accounted For.
          </h1>
          <p className="text-emerald-50/80 text-lg max-w-md">
            Track spending, grow your savings, and feel confident about your financial future across multiple currencies.
          </p>
        </div>

        {/* Decorative Chart Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl max-w-md transition-all duration-500 ease-in-out">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-emerald-50/60 text-sm font-medium mb-1">Total balance</p>
              <h2 className="text-3xl font-bold transition-all duration-300">
                {activeCurrency.symbol}{activeCurrency.amount}
              </h2>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full text-xs font-semibold">
              +8.4%
            </span>
          </div>

          {/* Recharts Decorative Line */}
          <div className="h-24 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#34d399" 
                  strokeWidth={3} 
                  dot={false} 
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Mock Stats */}
          <div className="flex gap-8 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-1 text-emerald-50/60">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                Income
              </div>
              <p className="font-semibold">{activeCurrency.income}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 text-emerald-50/60">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                Spent
              </div>
              <p className="font-semibold">{activeCurrency.spent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-[#fafaf9] p-8 relative">
        
        {/* Top Right Register Link */}
        <div className="absolute top-8 right-8 text-sm">
          <span className="text-slate-500">New to Monie-Track? </span>
          <Link to="/register" className="font-semibold text-[#0f2923] hover:underline underline-offset-4">
            Create an account
          </Link>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-4xl font-serif font-bold text-slate-900 mb-2">Welcome</h2>
          <p className="text-slate-500 mb-8">Sign in to securely access your finances.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2923] focus:border-transparent transition-colors bg-white"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-[#0f2923] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0f2923] focus:border-transparent transition-colors bg-white pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#0f2923] hover:bg-[#163c33] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f2923] disabled:opacity-70 transition-all mt-4"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
      
    </div>
  );
}
