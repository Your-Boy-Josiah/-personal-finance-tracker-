import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import api from "../services/api";

const getToday = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
};

const emptyForm = () => ({
  type: "expense",
  amount: "",
  category: "",
  description: "",
  transactionDate: getToday(),
});

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const formatAmount = (amount) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    const loadTransactions = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/transactions?page=${page}&limit=10`);
        if (!isCurrent) return;

        setTransactions(response.data.data || []);
        setPagination({
          currentPage: response.data.pagination?.currentPage || page,
          totalPages: response.data.pagination?.totalPages || 1,
          totalRecords: response.data.pagination?.totalRecords || 0,
        });
      } catch (requestError) {
        if (isCurrent) {
          setError(
            requestError.response?.data?.message ||
              "We couldn't load your transactions. Please try again.",
          );
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadTransactions();
    return () => {
      isCurrent = false;
    };
  }, [page, refreshKey]);

  useEffect(() => {
    let isCurrent = true;

    const loadCategories = async () => {
      try {
        const response = await api.get("/categories");
        if (isCurrent) setCategories(response.data.data || []);
      } catch (requestError) {
        if (isCurrent) {
          setCategoriesError(
            requestError.response?.data?.message || "Couldn't load categories.",
          );
        }
      }
    };

    loadCategories();
    return () => {
      isCurrent = false;
    };
  }, []);

  const handleCreateTransaction = async (event) => {
    event.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      await api.post("/transactions", {
        ...form,
        amount: Number(form.amount),
      });
      setForm(emptyForm());
      setIsFormOpen(false);
      setPage(1);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      setFormError(
        requestError.response?.data?.message || "Couldn't save this transaction.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const matchingCategories = categories.filter(
    (category) => category.type === form.type,
  );

  return (
    <div className="mx-auto min-h-full max-w-7xl bg-slate-50 p-4 text-slate-900 dark:bg-black dark:text-neutral-100 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
            Money activity
          </p>
          <h1 className="mt-1 text-2xl font-bold">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Review your income and expenses.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            {pagination.totalRecords} {pagination.totalRecords === 1 ? "record" : "records"}
          </p>
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setIsFormOpen(true);
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Plus size={16} />
            Add transaction
          </button>
        </div>
      </header>

      {isFormOpen && (
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#0a0a0a] sm:p-5" aria-labelledby="new-transaction-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="new-transaction-heading" className="text-base font-semibold">New transaction</h2>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              aria-label="Close new transaction form"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateTransaction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="transaction-type" className="mb-1.5 block text-sm font-medium">Type</label>
              <select
                id="transaction-type"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value, category: "" })}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label htmlFor="transaction-amount" className="mb-1.5 block text-sm font-medium">Amount</label>
              <input
                id="transaction-amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                placeholder="0.00"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div>
              <label htmlFor="transaction-category" className="mb-1.5 block text-sm font-medium">Category</label>
              <select
                id="transaction-category"
                required
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="" disabled>
                  {categoriesError ? "Categories unavailable" : matchingCategories.length ? "Select a category" : "No matching categories"}
                </option>
                {matchingCategories.map((category) => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
              {categoriesError && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{categoriesError}</p>}
            </div>
            <div>
              <label htmlFor="transaction-date" className="mb-1.5 block text-sm font-medium">Date</label>
              <input
                id="transaction-date"
                type="date"
                required
                value={form.transactionDate}
                onChange={(event) => setForm({ ...form, transactionDate: event.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="transaction-description" className="mb-1.5 block text-sm font-medium">Description</label>
              <input
                id="transaction-description"
                type="text"
                maxLength={255}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="What was this transaction for?"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            {formError && <p className="text-sm text-rose-600 dark:text-rose-400 sm:col-span-2 lg:col-span-3" role="alert">{formError}</p>}
            <div className="flex justify-end sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={isSaving || matchingCategories.length === 0}
                className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {isSaving ? "Saving..." : "Save transaction"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-[#0a0a0a]" aria-label="Transaction list">
        {error ? (
          <div className="p-8 text-center text-sm text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-neutral-400" role="status">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center">
            <h2 className="text-sm font-semibold">No transactions yet</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
              Your income and expenses will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-170 text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Date</th>
                    <th scope="col" className="px-5 py-3 font-medium">Description</th>
                    <th scope="col" className="px-5 py-3 font-medium">Category</th>
                    <th scope="col" className="px-5 py-3 font-medium">Type</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {transactions.map((transaction) => {
                    const isIncome = transaction.type === "income";
                    const description =
                      transaction.description || transaction.merchant || "Transaction";
                    const category = transaction.category?.name ||
                      (transaction.category ? "Categorized" : "Uncategorized");

                    return (
                      <tr key={transaction._id} className="transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                        <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-neutral-400">
                          {formatDate(transaction.transactionDate || transaction.createdAt)}
                        </td>
                        <td className="max-w-xs truncate px-5 py-4 font-medium" title={description}>
                          {description}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-neutral-400">
                          {category}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${isIncome
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                          }`}>
                            {transaction.type || "expense"}
                          </span>
                        </td>
                        <td className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${isIncome ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>
                          {isIncome ? "+" : "−"}{formatAmount(transaction.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={page <= 1 || loading}
                  aria-label="Previous page"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((currentPage) => Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={page >= pagination.totalPages || loading}
                  aria-label="Next page"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
};

export default Transactions;