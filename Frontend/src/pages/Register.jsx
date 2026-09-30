// ===============================================================
//  Register.jsx
//  Handles new user registration, maintaining the split-screen 
//  branding UI and passing the new user payload to the AuthContext.
// ===============================================================

// ==============================================================
// IMPORTS & MOCK DATA
// ==============================================================

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wallet, Eye, EyeOff, ShieldCheck, BarChart3, Globe } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  
  const { register, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    // FIXED: Match Backend Joi schema exactly
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      return setLocalError("Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.");
    }

    const result = await register(formData);
    if (result?.success) {
      navigate("/app", { replace: true });
    }
  };
  
  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black flex items-center justify-center p-4 md:p-8 transition-colors duration-200">
      
      {/* Floating Card Container */}
      <div className="w-full max-w-6xl bg-white dark:bg-[#0a0a0a] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col-reverse lg:flex-row border border-slate-200 dark:border-neutral-800 transition-colors">
        
        {/* LEFT PANEL - Registration Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 xl:p-16 flex flex-col justify-center">
          
          {/* Logo (Visible mainly on mobile where right panel is hidden/shifted) */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            </div>
            <span className="text-xl font-bold tracking-tight dark:text-white">Monie-Track</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-2">Create an account</h2>
            <p className="text-slate-500 dark:text-neutral-400">Start taking complete control of your financial future.</p>
          </div>

          {displayError && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-sm mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">First name</label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
                  placeholder="e.g. Sarah"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Last name</label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
                  placeholder="e.g. Connor"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Email address</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border border-slate-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white dark:bg-neutral-900 dark:text-white pr-10"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-500 mt-2">Must be at least 6 characters long.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-black disabled:opacity-70 transition-all mt-6 shadow-lg shadow-emerald-500/30"
            >
              {loading ? "Creating account..." : "Complete registration"}
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-neutral-400 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4">
                Sign in here
              </Link>
            </p>
          </form>
        </div>

        {/* RIGHT PANEL - Feature Showcase */}
        <div className="w-full lg:w-1/2 bg-[#0f2923] dark:bg-[#050505] p-8 md:p-12 xl:p-16 text-white flex flex-col justify-between relative overflow-hidden dark:border-l dark:border-neutral-800 transition-colors">
          
          {/* Background Decorative Glow (Dark mode only) */}
          <div className="hidden dark:block absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          {/* Logo (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 relative z-10">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
              <Wallet className="h-6 w-6 text-emerald-300" />
            </div>
            <span className="text-xl font-bold tracking-tight">Monie-Track</span>
          </div>

          <div className="my-12 lg:my-0 relative z-10">
            <h3 className="text-3xl md:text-4xl font-serif font-medium leading-tight mb-8">
              Join thousands mastering their wealth.
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/10 dark:bg-neutral-900 p-3 rounded-xl shrink-0 border border-white/5 dark:border-neutral-800">
                  <BarChart3 className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Precision Analytics</h4>
                  <p className="text-emerald-50/70 dark:text-neutral-400 text-sm leading-relaxed">Visualize your spending patterns with pinpoint accuracy using our dynamic dashboard charts.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/10 dark:bg-neutral-900 p-3 rounded-xl shrink-0 border border-white/5 dark:border-neutral-800">
                  <ShieldCheck className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">ACID-Compliant Security</h4>
                  <p className="text-emerald-50/70 dark:text-neutral-400 text-sm leading-relaxed">Your financial data is protected by strict database transactions, ensuring zero data loss.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/10 dark:bg-neutral-900 p-3 rounded-xl shrink-0 border border-white/5 dark:border-neutral-800">
                  <Globe className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Multi-Currency Global</h4>
                  <p className="text-emerald-50/70 dark:text-neutral-400 text-sm leading-relaxed">Whether it is Naira, USD, or GBP, every single amount is accounted for.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial/Trust Badge */}
          <div className="relative z-10 bg-white/5 dark:bg-neutral-900/50 border border-white/10 dark:border-neutral-800 p-4 rounded-2xl backdrop-blur-sm mt-8">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 border-2 border-[#0f2923] dark:border-[#050505] flex items-center justify-center text-xs font-bold">A</div>
                <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-[#0f2923] dark:border-[#050505] flex items-center justify-center text-xs font-bold">K</div>
                <div className="w-8 h-8 rounded-full bg-rose-500 border-2 border-[#0f2923] dark:border-[#050505] flex items-center justify-center text-xs font-bold">J</div>
              </div>
              <p className="text-sm font-medium text-emerald-50/80 dark:text-neutral-300">Trusted by over 10,000+ users worldwide.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
