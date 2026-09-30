// ===============================================================
//  Dashboard.jsx
//  High-density financial overview with strict data mapping.
// ===============================================================

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Plus, ArrowRight, Calendar, TrendingUp, AlertCircle } from "lucide-react";

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#f43f5e'];

// PERF FIX: Memoized Bar Chart prevents re-renders when other dashboard state changes
const MemoizedBarChart = React.memo(({ data, formatYAxis }) => (
  <ResponsiveContainer width="100%" height="85%">
    <BarChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#737373' }} />
      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#737373' }} tickFormatter={formatYAxis} width={50} />
      <Tooltip cursor={{ fill: 'rgba(115, 115, 115, 0.1)' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', backgroundColor: '#171717', color: '#fff' }} />
      <Bar dataKey="income" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
      <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
    </BarChart>
  </ResponsiveContainer>
));

// PERF FIX: Memoized Pie Chart
const MemoizedPieChart = React.memo(({ data, isEmpty }) => (
  <ResponsiveContainer width="100%" height="85%">
    <PieChart>
      <Pie data={data} innerRadius={65} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={isEmpty ? '#262626' : (entry.color || COLORS[index % COLORS.length])} />
        ))}
      </Pie>
      {!isEmpty && <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', backgroundColor: '#171717', color: '#fff' }} />}
    </PieChart>
  </ResponsiveContainer>
));

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // PERF/BUG FIX: Pass actual browser timezone to backend
        const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await api.get(`/dashboard/summary?timezone=${userTz}`);
        setSummary(res.data.data || res.data);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8 text-sm text-slate-500 dark:text-neutral-400">Loading your data...</div>;
  if (error) return <div className="p-8 text-sm text-rose-500">{error}</div>;

  const income = summary?.totalIncome || 0;
  const expenses = summary?.totalExpenses || 0;
  const netProfit = income - expenses; 
  const totalBalance = summary?.totalBalance || netProfit;
  const recentTransactions = summary?.recentTransactions || [];

  const currentMonthName = new Date().toLocaleString('default', { month: 'short' });
  const barData = summary?.monthlyData?.length > 0 
    ? summary.monthlyData 
    : [{ month: currentMonthName, income, expenses }];

  const isCategoryEmpty = !summary?.categorySpending?.length;
  const categoryData = isCategoryEmpty ? [{ name: 'No Data', value: 1 }] : summary.categorySpending;

  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value;
  };

  // BUG FIX: Real Budget Logic
  const realBudgetLimit = summary?.totalBudgetLimit || 0;
  const hasBudgetLimit = realBudgetLimit > 0;
  const budgetPercentage = hasBudgetLimit ? Math.round(Math.min((expenses / realBudgetLimit) * 100, 100)) : 0;
  const isOverBudget = budgetPercentage >= 100;

  return (
    <div className="p-4 md:p-6 mx-auto max-w-[1600px]">
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold dark:text-white">Financial overview</h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Track income, spending and account growth.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* MAIN CONTENT AREA */}
        <div className="xl:col-span-8 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-emerald-500/30 transition-all duration-300">
              <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">Total revenue</p>
              <h3 className="text-xl font-bold mt-1 text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">₦{income.toLocaleString()}</h3>
            </div>
            <div className="group bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-rose-500/30 transition-all duration-300">
              <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">Total expenses</p>
              <h3 className="text-xl font-bold mt-1 text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">₦{expenses.toLocaleString()}</h3>
            </div>
            <div className="group bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:-translate-y-1 hover:shadow-md hover:border-indigo-500/30 transition-all duration-300">
              <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">Net profit</p>
              <div className="flex items-center gap-2 mt-1">
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-300 transition-colors">₦{netProfit.toLocaleString()}</h3>
                {netProfit > 0 && <TrendingUp size={16} className="text-emerald-500" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm h-[300px] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <h3 className="text-sm font-bold mb-4 dark:text-white">Revenue & expenses</h3>
              <MemoizedBarChart data={barData} formatYAxis={formatYAxis} />
            </div>
            
            <div className="bg-white dark:bg-[#0a0a0a] p-4 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm h-[300px] relative hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <h3 className="text-sm font-bold mb-4 dark:text-white">Expenses by Category</h3>
              <MemoizedPieChart data={categoryData} isEmpty={isCategoryEmpty} />
              {isCategoryEmpty && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-8">
                  <span className="text-xs text-neutral-500">No category data.</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="text-sm font-bold dark:text-white">Recent transactions</h3>
              <Link to="/app/transactions" className="text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-neutral-800/50">
              {recentTransactions.map((tx) => (
                <div key={tx._id} className="p-3 px-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold" style={{ color: tx.category?.color || '#8b5cf6' }}>
                      {tx.category?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-white">{tx.description || 'Transaction'}</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-neutral-500">No recent transactions recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="xl:col-span-4 space-y-5">
          
          <div className="bg-[#1e1b4b] dark:bg-black dark:border dark:border-neutral-800 text-white p-5 rounded-xl shadow-lg relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <p className="text-xs font-medium text-indigo-200 dark:text-neutral-400">Available balance</p>
            <h3 className="text-3xl font-bold mt-1">₦{totalBalance.toLocaleString()}</h3>
            
            <div className="flex gap-2 mt-6">
              <button className="flex-1 bg-white dark:bg-neutral-800 text-[#1e1b4b] dark:text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1 hover:bg-indigo-50 dark:hover:bg-neutral-700 transition-colors">
                <Plus size={14} /> Add money
              </button>
              <button className="flex-1 bg-indigo-800 dark:bg-white dark:text-black text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1 hover:bg-indigo-700 dark:hover:bg-neutral-200 border border-indigo-700 dark:border-white transition-colors">
                <ArrowRight size={14} /> Transfer
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold dark:text-white">Monthly Budget</h3>
              <Link to="/app/budget" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                Manage Limits
              </Link>
            </div>
            
            {!hasBudgetLimit ? (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 mt-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
                  You haven't set a budget yet. Set a spending limit to track your goals and receive alerts!
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4 leading-relaxed">
                  You have spent <strong>₦{expenses.toLocaleString()}</strong> of your ₦{realBudgetLimit.toLocaleString()} limit.
                </p>
                <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : budgetPercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${budgetPercentage}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>

          <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold dark:text-white">Spending breakdown</h3>
            </div>
            
            <div className="space-y-4">
              {categoryData.slice(0, 5).map((cat, i) => (
                <div key={i} className="flex justify-between items-center text-xs group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full transition-transform duration-300 group-hover:scale-150" style={{ backgroundColor: isCategoryEmpty ? '#262626' : (cat.color || COLORS[i % COLORS.length]) }}></div>
                    <span className="font-medium text-slate-600 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{cat.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {isCategoryEmpty ? '-' : `₦${cat.value.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
