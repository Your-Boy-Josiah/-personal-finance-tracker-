// ===============================================================
//  Categories.jsx
//  Provides the UI for managing financial categories.
//  Fully wired interactive drill-down for fetching transactions.
// ===============================================================

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Tag, ArrowDownRight, ArrowUpRight, AlertTriangle, Pencil, Store } from "lucide-react";
import api from "../services/api";
import { PageSkeleton } from "../components/LoadingState";
import { formatDateOnly } from "../utils/dates";

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e'
];

const emptyForm = () => ({
  name: "",
  type: "expense",
  color: "#10b981", 
  subCategories: [],
});

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyForm());
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [subInput, setSubInput] = useState(""); 

  // View State (Drill-down feature)
  const [viewingCategory, setViewingCategory] = useState(null);
  const [activeSubFilter, setActiveSubFilter] = useState(null);
  const [categoryTransactions, setCategoryTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get("/categories");
      const rawData = response.data.data || [];
      
      const sanitizedData = rawData.map(cat => ({
        ...cat,
        subCategories: Array.isArray(cat.subCategories) 
          ? cat.subCategories.map(s => typeof s === 'string' ? s : (s.name || String(s))).filter(Boolean)
          : []
      }));
      
      setCategories(sanitizedData);
      
      if (viewingCategory) {
        const updatedView = sanitizedData.find(c => c._id === viewingCategory._id);
        if (updatedView) setViewingCategory(updatedView);
      }
      
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch Real Transactions when opening the View Modal
  const fetchTransactionsForCategory = async (categoryId) => {
    setLoadingTransactions(true);
    try {
      const res = await api.get(`/transactions?category=${categoryId}&limit=50`);
      setCategoryTransactions(res.data.data || []);
    } catch (err) {
      console.error("Failed to load category transactions:", err);
      setCategoryTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // ==============================================================
  // MODAL HANDLERS
  // ==============================================================

  const openCreateModal = () => {
    setForm(emptyForm());
    setIsEditing(false);
    setEditingId(null);
    setFormError("");
    setSubInput("");
    setIsFormOpen(true);
  };

  const openEditModal = (e, cat) => {
    e.stopPropagation(); 
    setForm({
      name: cat.name || "",
      type: cat.type || "expense",
      color: cat.color || "#10b981",
      subCategories: Array.isArray(cat.subCategories) ? [...cat.subCategories] : []
    });
    setIsEditing(true);
    setEditingId(cat._id);
    setFormError("");
    setSubInput("");
    setIsFormOpen(true);
  };

  const openViewModal = (cat) => {
    setViewingCategory(cat);
    setActiveSubFilter(null);
    fetchTransactionsForCategory(cat._id);
  };

  // ==============================================================
  // FORM HANDLERS
  // ==============================================================

  const executeAddSubCategory = () => {
    const trimmed = subInput.trim();
    if (trimmed && !form.subCategories.includes(trimmed)) {
      setForm((prev) => ({ ...prev, subCategories: [...prev.subCategories, trimmed] }));
    }
    setSubInput(""); 
  };

  const handleAddSubCategoryKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); 
      executeAddSubCategory();
    }
  };

  const removeSubCategory = (subToRemove) => {
    setForm((prev) => ({
      ...prev,
      subCategories: prev.subCategories.filter((sub) => sub !== subToRemove),
    }));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError("");

    try {
      let cleanSubs = [...form.subCategories];
      if (subInput.trim()) cleanSubs.push(subInput.trim());
      cleanSubs = [...new Set(cleanSubs.filter(s => typeof s === 'string' && s.trim() !== ''))];

      const payload = { ...form, subCategories: cleanSubs };

      if (isEditing) {
        await api.put(`/categories/${editingId}`, payload);
      } else {
        await api.post("/categories", payload);
      }
      
      setIsFormOpen(false);
      setForm(emptyForm());
      setIsEditing(false);
      setEditingId(null);
      setSubInput("");
      await fetchCategories(); 
    } catch (err) {
      setFormError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} category.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    
    try {
      await api.delete(`/categories/${id}`);
      if (viewingCategory && viewingCategory._id === id) setViewingCategory(null);
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete category.");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("WARNING: Delete all your custom categories? Transactions will be reassigned. This cannot be undone.")) return;
    
    try {
      setIsDeletingAll(true);
      const deletePromises = ownedCategories.map(cat => api.delete(`/categories/${cat._id}`));
      await Promise.all(deletePromises);
      await fetchCategories();
    } catch (err) {
      alert("Some categories could not be deleted.");
      await fetchCategories();
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setForm((prev) => ({ 
      ...prev, 
      type: newType, 
      color: newType === 'income' ? '#10b981' : '#f43f5e' 
    }));
  };

  const incomeCategories = categories.filter(c => c.type === "income");
  const expenseCategories = categories.filter(c => c.type === "expense");
  const ownedCategories = categories.filter(category => category.user);

  // Dynamic filter for transactions inside the View Modal
  const displayedTransactions = activeSubFilter
    ? categoryTransactions.filter(t => 
        (t.description || "").toLowerCase().includes(activeSubFilter.toLowerCase()) ||
        (t.subCategory || "").toLowerCase() === activeSubFilter.toLowerCase()
      )
    : categoryTransactions;

  // ==============================================================
  // RENDER UI
  // ==============================================================

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="mx-auto min-h-full max-w-7xl p-4 sm:p-6 lg:p-8">
      
      <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-neutral-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Category Management
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-neutral-400">
            Organize your transactions, build sub-tags, and drill down into store spending.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={isDeletingAll || ownedCategories.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-transparent px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            {isDeletingAll ? "Deleting..." : "Delete All"}
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Plus size={16} />
            New Category
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-8 flex items-center gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        
        {/* EXPENSES COLUMN */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-neutral-800">
            <ArrowDownRight size={20} className="text-rose-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Expenses</h2>
            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-neutral-800 dark:text-neutral-400">
              {expenseCategories.length} items
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {expenseCategories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-neutral-700 dark:text-neutral-400">
                No expense categories created yet.
              </div>
            ) : (
              expenseCategories.map(cat => (
                <div 
                  key={cat._id} 
                  onClick={() => openViewModal(cat)}
                  className="group flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:bg-[#0a0a0a] dark:hover:border-emerald-800/60 dark:hover:bg-neutral-900/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-neutral-900">
                        <div className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                      </div>
                      <span className="font-semibold text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">{cat.name}</span>
                    </div>
                    
                    {cat.user && <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={(e) => openEditModal(e, cat)} 
                        className="rounded-md p-1.5 text-slate-400 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-200 dark:ring-neutral-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 dark:hover:ring-emerald-500/20"
                        title="Edit category"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteCategory(e, cat._id)} 
                        className="rounded-md p-1.5 text-slate-400 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200 dark:ring-neutral-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 dark:hover:ring-rose-500/20"
                        title="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>}
                  </div>
                  
                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-neutral-800/60">
                    {cat.subCategories && cat.subCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cat.subCategories.map((sub, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-neutral-900 dark:text-neutral-300">
                            <Tag size={12} className="text-slate-400" />
                            {sub}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 dark:text-neutral-600">{cat.user ? "No sub-categories created. Click Edit to add some." : "No sub-categories created."}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* INCOME COLUMN */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-neutral-800">
            <ArrowUpRight size={20} className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Income</h2>
            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-neutral-800 dark:text-neutral-400">
              {incomeCategories.length} items
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {incomeCategories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-neutral-700 dark:text-neutral-400">
                No income categories created yet.
              </div>
            ) : (
              incomeCategories.map(cat => (
                <div 
                  key={cat._id} 
                  onClick={() => openViewModal(cat)}
                  className="group flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md dark:border-neutral-800 dark:bg-[#0a0a0a] dark:hover:border-emerald-800/60 dark:hover:bg-neutral-900/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-neutral-900">
                        <div className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                      </div>
                      <span className="font-semibold text-slate-900 transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-400">{cat.name}</span>
                    </div>
                    
                    {cat.user && <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={(e) => openEditModal(e, cat)} 
                        className="rounded-md p-1.5 text-slate-400 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-200 dark:ring-neutral-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 dark:hover:ring-emerald-500/20"
                        title="Edit category"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => handleDeleteCategory(e, cat._id)} 
                        className="rounded-md p-1.5 text-slate-400 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-rose-50 hover:text-rose-600 hover:ring-rose-200 dark:ring-neutral-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 dark:hover:ring-rose-500/20"
                        title="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>}
                  </div>
                  
                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-neutral-800/60">
                    {cat.subCategories && cat.subCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cat.subCategories.map((sub, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-neutral-900 dark:text-neutral-300">
                            <Tag size={12} className="text-slate-400" />
                            {sub}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 dark:text-neutral-600">{cat.user ? "No sub-categories created. Click Edit to add some." : "No sub-categories created."}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ============================================================== */}
      {/* 1. DRILL-DOWN VIEW MODAL                                       */}
      {/* ============================================================== */}
      {viewingCategory && !isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <section className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 dark:bg-[#0a0a0a] dark:ring-white/10">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900/50 sm:px-8 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full shadow-sm" style={{ backgroundColor: viewingCategory.color }}></div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{viewingCategory.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingCategory(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <div className="mb-8">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                  <Tag size={16} /> Filter by Sub-Category
                </h3>
                {viewingCategory.subCategories && viewingCategory.subCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setActiveSubFilter(null)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeSubFilter === null ? 'bg-slate-800 text-white dark:bg-white dark:text-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}
                    >
                      All
                    </button>
                    {viewingCategory.subCategories.map((sub, i) => (
                      <button 
                        key={i} 
                        onClick={() => setActiveSubFilter(sub)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activeSubFilter === sub ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'}`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-neutral-500">No sub-categories to filter by.</p>
                )}
              </div>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                  <Store size={16} /> Recent Spending & Stores
                </h3>
                
                {loadingTransactions ? (
                  <div className="space-y-3 py-2" role="status" aria-label="Loading category transactions">
                    <span className="sr-only">Loading category transactions</span>
                    {[1, 2, 3].map((row) => <div key={row} className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-neutral-800" />)}
                  </div>
                ) : displayedTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900/30">
                    <div className="mb-3 rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                      <Store size={24} />
                    </div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">No matching transactions</h4>
                    <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-neutral-400">
                      We didn't find any recent logs for <span className="font-semibold">"{activeSubFilter || viewingCategory.name}"</span>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedTransactions.map(tx => (
                      <div key={tx._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-4 dark:border-neutral-800">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{tx.description || 'Unnamed Transaction'}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
                            {/* Replaced date-fns with native JavaScript date formatting */}
                            <span>{formatDateOnly(tx.transactionDate, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {tx.type === 'income' ? '+' : '-'}₦{Number(tx.amount || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {viewingCategory.user && <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900/50 sm:px-8">
              <button 
                onClick={(e) => { setViewingCategory(null); openEditModal(e, viewingCategory); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
              >
                <Pencil size={16} /> Edit this Category
              </button>
            </div>}
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. MODAL: CREATE / EDIT CATEGORY                               */}
      {/* ============================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 dark:bg-[#0a0a0a] dark:ring-white/10">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900/50 sm:px-8 sm:py-5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isEditing ? "Edit Category" : "New Category"}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-8">
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Food & Dining"
                    className="w-full rounded-xl border-0 bg-slate-50 py-3 px-4 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 dark:bg-neutral-900 dark:text-white dark:ring-neutral-800 dark:focus:bg-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Type</label>
                  <select
                    value={form.type}
                    onChange={handleTypeChange}
                    className="w-full rounded-xl border-0 bg-slate-50 py-3 px-4 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 dark:bg-neutral-900 dark:text-white dark:ring-neutral-800 dark:focus:bg-black"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">Category Color</label>
                <div className="flex flex-wrap gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                      className={`h-8 w-8 rounded-full shadow-sm ring-offset-2 transition-all dark:ring-offset-[#0a0a0a] ${
                        form.color === c ? 'scale-110 ring-2 ring-slate-400 dark:ring-slate-500' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <div className="relative h-8 w-8 overflow-hidden rounded-full shadow-sm ring-2 ring-transparent ring-offset-2 transition-all hover:scale-110 focus-within:ring-slate-400 dark:ring-offset-[#0a0a0a]">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                      className="absolute -inset-2 h-12 w-12 cursor-pointer border-0 p-0"
                      title="Custom Color Wheel"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                  <Tag size={14} /> Sub-Categories
                </label>
                
                <div className="flex w-full flex-col rounded-xl border-0 bg-slate-50 p-3 ring-1 ring-inset ring-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald-500 dark:bg-neutral-900 dark:ring-neutral-800 dark:focus-within:bg-black">
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={subInput}
                      onChange={(e) => setSubInput(e.target.value)}
                      onKeyDown={handleAddSubCategoryKeyDown}
                      placeholder="e.g. Groceries..."
                      className="flex-1 border-0 bg-transparent p-1 text-sm font-medium focus:outline-none focus:ring-0 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={executeAddSubCategory}
                      disabled={!subInput.trim()}
                      className="shrink-0 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-300 disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      + Add
                    </button>
                  </div>

                  {form.subCategories.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-neutral-800">
                      {form.subCategories.map((sub, index) => (
                        <span key={index} className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-700">
                          {sub}
                          <button type="button" onClick={() => removeSubCategory(sub)} className="text-slate-400 hover:text-rose-500">
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                </div>
              </div>

              {formError && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{formError}</p>}
              
              <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-neutral-800 sm:pt-6">
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-70">
                  {isSaving ? "Saving..." : (isEditing ? "Save Changes" : "Create Category")}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default Categories;
