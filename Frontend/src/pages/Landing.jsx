import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, ShieldCheck, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const chartBars = [34, 52, 42, 68, 55, 82, 64, 94, 72, 100, 78, 88];

export default function Landing() {
  const { user } = useAuth();
  const primaryHref = user ? "/app" : "/register";

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f5ef] text-[#14241e]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Link to="/" className="flex items-center gap-3" aria-label="Monie-Track home">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#12382d] text-[#d5f1b8]">
            <Wallet size={21} />
          </span>
          <span className="text-lg font-bold">Monie-Track</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-semibold">
          <Link to={user ? "/app" : "/login"} className="px-3 py-2 hover:text-emerald-800">
            {user ? "Dashboard" : "Sign in"}
          </Link>
          <Link to={primaryHref} className="rounded-md bg-[#12382d] px-4 py-2.5 text-white transition hover:bg-[#205b45]">
            {user ? "Open app" : "Get started"}
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-12 md:px-10 md:pb-24 md:pt-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative z-10">
            <p className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#527465]">
              <span className="h-px w-8 bg-[#527465]" /> Your money, in focus
            </p>
            <h1 className="max-w-xl font-serif text-5xl font-medium leading-[1.06] sm:text-6xl">
              Make every part of your money <span className="text-[#548266]">add up.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[#5e6d65]">
              One clear view of what comes in, what goes out, and the goals you are building toward.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to={primaryHref} className="inline-flex items-center gap-3 rounded-md bg-[#12382d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#205b45]">
                {user ? "Go to dashboard" : "Start tracking"}<ArrowRight size={17} />
              </Link>
              {!user && <Link to="/login" className="px-2 py-3 text-sm font-semibold text-[#355c49] hover:underline">I already have an account</Link>}
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#d8ded4] pt-5 text-xs font-medium text-[#627168]">
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#548266]" /> Private by design</span>
              <span className="flex items-center gap-2"><BarChart3 size={16} className="text-[#548266]" /> Clear spending trends</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-2xl lg:ml-auto">
            <div className="relative border border-[#d8ded4] bg-white p-4 shadow-[0_24px_70px_-38px_rgba(20,50,35,0.42)] sm:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#e8ebe5] pb-5">
                <div>
                  <p className="text-xs font-medium text-[#77857b]">MONTHLY OVERVIEW</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-[#172a21]">Your finances, at a glance</p>
                </div>
                <span className="rounded-full bg-[#e7f2e4] px-3 py-1.5 text-xs font-bold text-[#39704e]">On track</span>
              </div>
              <div className="grid grid-cols-2 gap-3 py-5 sm:gap-5">
                <div className="border-l-2 border-[#77a982] pl-3">
                  <p className="text-xs text-[#77857b]">Income</p>
                  <p className="mt-1 text-xl font-semibold text-[#172a21]">₦420,000</p>
                </div>
                <div className="border-l-2 border-[#d8a277] pl-3">
                  <p className="text-xs text-[#77857b]">Spent</p>
                  <p className="mt-1 text-xl font-semibold text-[#172a21]">₦186,500</p>
                </div>
              </div>
              <div className="border-t border-[#e8ebe5] pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#263d31]">Spending trend</p>
                  <p className="text-xs text-[#77857b]">Last 12 months</p>
                </div>
                <div className="flex h-36 items-end gap-2 border-b border-[#e8ebe5] px-1 sm:gap-3" aria-label="Illustrative monthly spending chart">
                  {chartBars.map((height, index) => (
                    <div key={index} className="flex h-full flex-1 items-end">
                      <div className={`w-full rounded-t-sm ${index === 9 ? "bg-[#12382d]" : "bg-[#b7d2b3]"}`} style={{ height: `${height}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-medium text-[#89958c]">
                  <span>JAN</span><span>MAR</span><span>MAY</span><span>JUL</span><span>SEP</span><span>DEC</span>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between bg-[#f3f6ef] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-[#294334]">Monthly budget</p>
                  <p className="mt-1 text-[11px] text-[#77857b]">You have room to reach your goals</p>
                </div>
                <span className="text-sm font-bold text-[#39704e]">56%</span>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-4 hidden border border-[#d8ded4] bg-[#fffdf7] px-4 py-3 shadow-lg sm:block">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#77857b]">Savings goal</p>
              <p className="mt-1 text-sm font-semibold text-[#263d31]">Progress, made visible <span className="text-[#548266]">↗</span></p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}