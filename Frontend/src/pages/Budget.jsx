// ===============================================================
//  Budget.jsx
//  Provides the UI for users to manage their master budget.
//  Features a clean, enterprise-grade fintech aesthetic.
// ===============================================================

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ==============================================================
// MAIN COMPONENT
// ==============================================================

const Budget = () => {
  const { user } = useAuth();
  // --- State Management ---
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Budget Form State
  const [budgetForm, setBudgetForm] = useState({
    monthlyIncome: user?.monthlyIncome ? String(user.monthlyIncome) : "",
    incomeFrequency: "monthly",
    currency: user?.baseCurrency || "NGN",
    categoryLimits: [],
  });

  // ==============================================================
  // DATA FETCHING (USE EFFECTS)
  // ==============================================================

  useEffect(() => {
    let isCurrent = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, budgetRes] = await Promise.all([
          api.get("/categories"),
          api.get("/budget"),
        ]);

        if (!isCurrent) return;

        setCategories(categoriesRes.data.data || []);

        const fetchedBudget = budgetRes.data;
        if (fetchedBudget && fetchedBudget._id) {
          setBudgetForm({
            monthlyIncome: fetchedBudget.monthlyIncome || "",
            incomeFrequency: fetchedBudget.incomeFrequency || "monthly",
            currency: fetchedBudget.currency || "NGN",
            categoryLimits: (fetchedBudget.categoryLimits || []).map(limit => ({
              category: typeof limit.category === "object" ? limit.category._id : limit.category,
              subCategory: limit.subCategory || "",
              spendingCap: limit.spendingCap || "",
            })),
          });
        }
      } catch (error) {
        if (isCurrent) {
          setMessage({
            text: error.response?.data?.message || "Failed to load budget data. Make sure your server is running.",
            type: "error",
          });
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isCurrent = false;
    };
  }, []);

  // ==============================================================
  // FORM HANDLERS
  // ==============================================================

  const handleAddLimit = () => {
    setBudgetForm({
      ...budgetForm,
      categoryLimits: [
        ...budgetForm.categoryLimits,
        { category: "", subCategory: "", spendingCap: "" },
      ],
    });
  };

  const handleRemoveLimit = (index) => {
    const updatedLimits = [...budgetForm.categoryLimits];
    updatedLimits.splice(index, 1);
    setBudgetForm({ ...budgetForm, categoryLimits: updatedLimits });
  };

  const handleUpdateLimit = (index, field, value) => {
    const updatedLimits = [...budgetForm.categoryLimits];
    
    if (field === "category") {
      updatedLimits[index] = { ...updatedLimits[index], category: value, subCategory: "" };
    } else {
      updatedLimits[index] = { ...updatedLimits[index], [field]: value };
    }
    
    setBudgetForm({ ...budgetForm, categoryLimits: updatedLimits });
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const payload = {
        monthlyIncome: Number(budgetForm.monthlyIncome),
        incomeFrequency: budgetForm.incomeFrequency,
        currency: budgetForm.currency,
        categoryLimits: budgetForm.categoryLimits
          .filter(limit => limit.category && limit.spendingCap !== "")
          .map(limit => ({
            category: limit.category,
            subCategory: limit.subCategory || null,
            spendingCap: Number(limit.spendingCap),
          })),
      };

      await api.put("/budget", payload);
      setMessage({ text: "Budget successfully updated.", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Failed to save budget.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const expenseCategories = categories.filter(c => c.type === "expense");

  // ==============================================================
  // RENDER UI
  // ==============================================================

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center p-8 text-sm text-slate-500">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full max-w-5xl p-4 sm:p-6 lg:p-8">
      
      {/* HEADER SECTION */}
      <header className="mb-8 border-b border-slate-200 pb-5 dark:border-neutral-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create a Budget
        </h1>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-neutral-400">
          Set a goal and stick to it.
        </p>
      </header>

      {/* NOTIFICATIONS */}
      {message.text && (
        <div className={`mb-8 flex items-center gap-3 rounded-md border p-4 text-sm font-medium ${
          message.type === "success" 
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400" 
            : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSaveBudget} className="space-y-8">
        
        {/* SECTION 1: INCOME PROFILE */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-[#0a0a0a]">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Income Profile
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                Income Amount
              </label>
              <div className="relative">
                {/* Provided ample padding for the currency code to prevent overlapping */}
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-slate-400 dark:text-neutral-500">
                  {budgetForm.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={budgetForm.monthlyIncome}
                  onChange={(e) => setBudgetForm({ ...budgetForm, monthlyIncome: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white py-2 pl-14 pr-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                Frequency
              </label>
              <select
                value={budgetForm.incomeFrequency}
                onChange={(e) => setBudgetForm({ ...budgetForm, incomeFrequency: e.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                Currency
              </label>
              <input
                type="text"
                required
                maxLength="3"
                value={budgetForm.currency}
                onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value.toUpperCase() })}
                className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm font-medium uppercase text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                placeholder="NGN"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: SPENDING TARGETS */}
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-[#0a0a0a]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Spending Targets
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddLimit}
              className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
            >
              <Plus size={14} /> Add Target
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-neutral-800">
            {budgetForm.categoryLimits.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-neutral-400">
                No spending caps configured. Click "Add Target" to set a limit.
              </div>
            ) : (
              budgetForm.categoryLimits.map((limit, index) => {
                const activeCategoryObj = expenseCategories.find(c => c._id === limit.category);
                const hasSubCategories = activeCategoryObj && activeCategoryObj.subCategories && activeCategoryObj.subCategories.length > 0;

                return (
                  <div key={index} className="grid grid-cols-1 items-end gap-4 p-5 sm:grid-cols-12 sm:gap-4">
                    
                    {/* Category Column */}
                    <div className="sm:col-span-4">
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                        Category
                      </label>
                      <select
                        required
                        value={limit.category}
                        onChange={(e) => handleUpdateLimit(index, "category", e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                      >
                        <option value="" disabled>Select category...</option>
                        {expenseCategories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sub-Category Column */}
                    <div className="sm:col-span-4">
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                        Sub-Category
                      </label>
                      <select
                        disabled={!hasSubCategories}
                        value={limit.subCategory}
                        onChange={(e) => handleUpdateLimit(index, "subCategory", e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white py-2 px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50 disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:disabled:bg-neutral-950"
                      >
                        <option value="">Any (Applies to all)</option>
                        {hasSubCategories && activeCategoryObj.subCategories.map((sub, i) => (
                          <option key={i} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>

                    {/* Maximum Cap Column */}
                    <div className="sm:col-span-3">
                      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                        Maximum Cap
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-slate-400 dark:text-neutral-500">
                          {budgetForm.currency}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={limit.spendingCap}
                          onChange={(e) => handleUpdateLimit(index, "spendingCap", e.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-14 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Delete Action Column (Fixed visibility issue) */}
                    <div className="flex justify-end sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveLimit(index)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                        title="Remove Target"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Saving..." : "Save Budget"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Budget;
