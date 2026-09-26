// ===============================================================
//  Dashboard.jsx
//  Main user overview showing financial summaries and metrics.
// ===============================================================

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Here is an overview of your financial health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Balance</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">₦0.00</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Monthly Income</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-2">₦0.00</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Monthly Expenses</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-2">₦0.00</h3>
        </div>
      </div>
    </div>
  );
}
