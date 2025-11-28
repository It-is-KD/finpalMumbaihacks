import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const DataContext = createContext({});

export const DataProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState({
    transactions: false,
    accounts: false,
    goals: false,
    budgets: false,
    summary: false,
  });

  const fetchTransactions = useCallback(async (params = {}) => {
    setLoading(prev => ({ ...prev, transactions: true }));
    try {
      const data = await api.getTransactions(params);
      setTransactions(data.transactions);
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    setLoading(prev => ({ ...prev, accounts: true }));
    try {
      const data = await api.getBankAccounts();
      setBankAccounts(data);
      return data;
    } catch (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, accounts: false }));
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading(prev => ({ ...prev, goals: true }));
    try {
      const data = await api.getGoals();
      setGoals(data);
      return data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, goals: false }));
    }
  }, []);

  const fetchBudgets = useCallback(async () => {
    setLoading(prev => ({ ...prev, budgets: true }));
    try {
      const data = await api.getBudgets();
      setBudgets(data);
      return data;
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, budgets: false }));
    }
  }, []);

  const fetchSummary = useCallback(async (period = 'month') => {
    setLoading(prev => ({ ...prev, summary: true }));
    try {
      const data = await api.getTransactionSummary(period);
      setSummary(data);
      return data;
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      const data = await api.getInsights();
      setInsights(data);
      return data;
    } catch (error) {
      console.error('Error fetching insights:', error);
      throw error;
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchTransactions(),
      fetchBankAccounts(),
      fetchGoals(),
      fetchBudgets(),
      fetchSummary(),
      fetchInsights(),
    ]);
  }, [fetchTransactions, fetchBankAccounts, fetchGoals, fetchBudgets, fetchSummary, fetchInsights]);

  const addTransaction = async (transaction) => {
    const result = await api.addTransaction(transaction);
    await fetchTransactions();
    await fetchSummary();
    return result;
  };

  const addBankAccount = async (account) => {
    const result = await api.addBankAccount(account);
    await fetchBankAccounts();
    return result;
  };

  const addGoal = async (goal) => {
    const result = await api.createGoal(goal);
    await fetchGoals();
    return result;
  };

  const addBudget = async (budget) => {
    const result = await api.createBudget(budget);
    await fetchBudgets();
    return result;
  };

  const updateGoalProgress = async (goalId, amount) => {
    const result = await api.updateGoalProgress(goalId, amount);
    await fetchGoals();
    return result;
  };

  return (
    <DataContext.Provider value={{
      transactions,
      bankAccounts,
      goals,
      budgets,
      summary,
      insights,
      loading,
      fetchTransactions,
      fetchBankAccounts,
      fetchGoals,
      fetchBudgets,
      fetchSummary,
      fetchInsights,
      refreshAll,
      addTransaction,
      addBankAccount,
      addGoal,
      addBudget,
      updateGoalProgress,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
