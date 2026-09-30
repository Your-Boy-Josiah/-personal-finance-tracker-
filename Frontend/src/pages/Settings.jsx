import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const currencies = ["NGN", "USD", "EUR", "GBP"];

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [baseCurrency, setBaseCurrency] = useState(user?.baseCurrency || "NGN");
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome ?? 0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const result = await updateProfile({
      baseCurrency,
      monthlyIncome: Number(monthlyIncome),
    });

    if (result.success) {
      setBaseCurrency(result.data.baseCurrency);
      setMonthlyIncome(result.data.monthlyIncome);
      setMessage("Preferences saved.");
    } else {
      setError(result.error);
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Manage your financial preferences and appearance.</p>
      </div>

      <section className="border-y border-slate-200 py-5 dark:border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold dark:text-white">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Choose the theme used across the app.</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={isDark}
            className="inline-flex min-w-32 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? "Light theme" : "Dark theme"}
          </button>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="border-b border-slate-200 py-5 dark:border-neutral-800">
          <h2 className="text-sm font-semibold dark:text-white">Financial preferences</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">Defaults for a new budget. Existing budgets and transactions are unchanged.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">
              Base currency
              <select
                value={baseCurrency}
                onChange={(event) => setBaseCurrency(event.target.value)}
                className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              >
                {currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">
              Monthly income
              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlyIncome}
                onChange={(event) => setMonthlyIncome(event.target.value)}
                className="mt-1.5 block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-5">
          <button type="submit" disabled={saving} className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500">
            {saving ? "Saving..." : "Save preferences"}
          </button>
          {message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}
          {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
      </form>
    </div>
  );
}