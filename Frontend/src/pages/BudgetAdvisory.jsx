// ===============================================================
//  BudgetAdvisory.jsx
//  Displays intelligent financial insights by analyzing the user's
//  current month expenses against their budget rules.
// ===============================================================

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  PieChart,
  Frown
} from "lucide-react";
import api from "../services/api";

// ==============================================================
// HELPER FUNCTIONS
// ==============================================================

const formatAmount = (amount) => {
  return `₦${Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ==============================================================
// MAIN COMPONENT
// ==============================================================

const BudgetAdvisory = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const fetchAdvisory = async () => {
      try {
        setLoading(true);
        const response = await api.get("/budget/advisory");
        if (isCurrent) {
          setData(response.data);
          setError("");
        }
      } catch (err) {
        if (isCurrent) {
          setError(err.response?.data?.message || "Failed to load advisory data.");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchAdvisory();
    return () => {
      isCurrent = false;
    };
  }, []);

  // ==============================================================
  // RENDER UI
  // ==============================================================

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
        Analyzing your financial data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center text-sm text-rose-600 dark:text-rose-400">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { classificationTotals, advice, overspentCategories } = data;

  return (
    <div className="mx-auto min-h-full max-w-5xl bg-slate-50 p-4 text-slate-900 dark:bg-black dark:text-neutral-100 sm:p-6 lg:p-8">
      
      {/* HEADER SECTION */}
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
          Intelligence Layer
        </p>
        <h1 className="mt-1 text-2xl font-bold">Budget Advisory</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
          Actionable insights based on your current month's spending behavior.
        </p>
      </header>

      {/* CLASSIFICATION OVERVIEW CARDS */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#0a0a0a]">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
            <CheckCircle size={16} className="text-emerald-500" /> Essential
          </div>
          <p className="mt-2 text-2xl font-bold">{formatAmount(classificationTotals?.essential)}</p>
        </div>
        
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#0a0a0a]">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
            <AlertTriangle size={16} className="text-rose-500" /> Non-Essential
          </div>
          <p className="mt-2 text-2xl font-bold">{formatAmount(classificationTotals?.["non-essential/cut-back"])}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#0a0a0a]">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
            <PieChart size={16} className="text-blue-500" /> Miscellaneous
          </div>
          <p className="mt-2 text-2xl font-bold">{formatAmount(classificationTotals?.miscellaneous)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: ADVICE FEED */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-500" />
            System Feedback
          </h2>
          
          {advice.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-neutral-800 dark:bg-[#0a0a0a]">
              No advice generated yet. Start logging categorized transactions to see insights.
            </div>
          ) : (
            advice.map((item, index) => {
              // Determine styling based on the status injected by AdvisoryService
              let bgClass = "bg-white dark:bg-[#0a0a0a] border-slate-200 dark:border-neutral-800";
              let icon = <Info size={18} className="text-blue-500" />;
              
              if (item.status === 'over_budget' || item.status === 'warning') {
                bgClass = "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900";
                icon = <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400" />;
              } else if (item.status === 'under_budget') {
                bgClass = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900";
                icon = <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />;
              }

              return (
                <div key={index} className={`flex gap-3 rounded-lg border p-4 ${bgClass}`}>
                  <div className="shrink-0 mt-0.5">{icon}</div>
                  <div>
                    <p className="text-sm font-medium">{item.message}</p>
                    {item.category && (
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium dark:bg-white/10">
                        {item.category.name} {item.subCategory ? `› ${item.subCategory}` : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: OVERAGES */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-rose-600 dark:text-rose-400">
            Action Required
          </h2>
          
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#0a0a0a]">
            {overspentCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                <CheckCircle size={32} className="mb-2 text-emerald-500/50" />
                <p className="text-sm">You are within all budget limits.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {overspentCategories.map((overage, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-neutral-800">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium">
                        {overage.category?.name || "Unknown"}
                        {overage.subCategory && <span className="ml-1 text-slate-500">({overage.subCategory})</span>}
                      </span>
                      <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        +{formatAmount(overage.amountOver)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Cap: {formatAmount(overage.spendingCap)}</span>
                      <span>Spent: {formatAmount(overage.spent)}</span>
                    </div>
                    {/* Visual Progress Bar - Maxed out */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                      <div className="h-full w-full bg-rose-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BudgetAdvisory;
