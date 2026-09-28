// ===============================================================
//  TransactionContext.jsx
// ===============================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const TransactionContext = createContext(null);

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination & Filtering States (Ready for Tasks 9 & 10)
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });

  // Core Fetching Logic (Ready for Task 5)
  const fetchTransactions = useCallback(async (queryFilters = filters, queryPage = pagination.page) => {
    setLoading(true);
    setError(null);
    try {
      // Build query string dynamically based on active filters
      const queryParams = new URLSearchParams({
        page: queryPage,
        limit: pagination.limit,
        ...queryFilters
      }).toString();

      const res = await api.get(`/transactions?${queryParams}`);
      
      setTransactions(res.data.data.transactions || res.data.data || []);
      setPagination(prev => ({ ...prev, totalPages: res.data.data.totalPages || 1, page: queryPage }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  return (
    <TransactionContext.Provider value={{
      transactions,
      loading,
      error,
      filters,
      pagination,
      setFilters,
      setPagination,
      fetchTransactions
    }}>
      {children}
    </TransactionContext.Provider>
  );
};
