import axios from 'axios';

// Update this to your computer's local IP address when testing on a real device
// For example: 'http://192.168.1.100:3000'
const BASE_URL = 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken = null;

const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

const setBaseUrl = (url) => {
  apiClient.defaults.baseURL = url;
};

// Auth API
const auth = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
};

// Users API
const users = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },
  updateProfile: async (data) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },
  getDashboard: async () => {
    const response = await apiClient.get('/users/dashboard');
    return response.data;
  },
  upgrade: async (walletAddress) => {
    const response = await apiClient.post('/users/upgrade', { walletAddress });
    return response.data;
  },
};

// Bank Accounts API
const bankAccounts = {
  getAll: async () => {
    const response = await apiClient.get('/bank-accounts');
    return response.data;
  },
  add: async (data) => {
    const response = await apiClient.post('/bank-accounts', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/bank-accounts/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/bank-accounts/${id}`);
    return response.data;
  },
  setPrimary: async (id) => {
    const response = await apiClient.put(`/bank-accounts/${id}/primary`);
    return response.data;
  },
};

// Transactions API
const transactions = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/transactions', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },
  getStats: async (period = 'month') => {
    const response = await apiClient.get('/transactions/stats', { params: { period } });
    return response.data;
  },
  add: async (data) => {
    const response = await apiClient.post('/transactions', data);
    return response.data;
  },
  bulkImport: async (transactions) => {
    const response = await apiClient.post('/transactions/bulk', { transactions });
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/transactions/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/transactions/${id}`);
    return response.data;
  },
  recategorize: async () => {
    const response = await apiClient.post('/transactions/recategorize');
    return response.data;
  },
};

// Goals API
const goals = {
  getAll: async () => {
    const response = await apiClient.get('/goals');
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/goals/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/goals', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/goals/${id}`, data);
    return response.data;
  },
  addProgress: async (id, amount) => {
    const response = await apiClient.post(`/goals/${id}/contribute`, { amount });
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/goals/${id}`);
    return response.data;
  },
};

// Budgets API
const budgets = {
  getAll: async () => {
    const response = await apiClient.get('/budgets');
    return response.data;
  },
  create: async (data) => {
    const response = await apiClient.post('/budgets', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await apiClient.put(`/budgets/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/budgets/${id}`);
    return response.data;
  },
  getAlerts: async () => {
    const response = await apiClient.get('/budgets/alerts');
    return response.data;
  },
};

// Insights API
const insights = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/insights', { params });
    return response.data;
  },
  getAnalytics: async (period = 'month') => {
    const response = await apiClient.get('/insights/analytics', { params: { period } });
    return response.data;
  },
  markRead: async (id) => {
    const response = await apiClient.put(`/insights/${id}/read`);
    return response.data;
  },
  markAction: async (id) => {
    const response = await apiClient.put(`/insights/${id}/action`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await apiClient.put('/insights/read-all');
    return response.data;
  },
  getInvestments: async () => {
    const response = await apiClient.get('/insights/investments');
    return response.data;
  },
  getPatterns: async () => {
    const response = await apiClient.get('/insights/patterns');
    return response.data;
  },
};

// Chat API
const chat = {
  getHistory: async (limit = 50) => {
    const response = await apiClient.get('/chat/history', { params: { limit } });
    return response.data;
  },
  sendMessage: async (message) => {
    const response = await apiClient.post('/chat/message', { message });
    return response.data;
  },
  clearHistory: async () => {
    const response = await apiClient.delete('/chat/history');
    return response.data;
  },
};

// Agent API
const agent = {
  analyze: async () => {
    const response = await apiClient.post('/agent/analyze');
    return response.data;
  },
  getSpendingInsights: async () => {
    const response = await apiClient.get('/agent/spending-insights');
    return response.data;
  },
  getBudgetSuggestions: async () => {
    const response = await apiClient.get('/agent/budget-suggestions');
    return response.data;
  },
  getSavingsRoadmap: async (goalId) => {
    const response = await apiClient.get(`/agent/savings-roadmap/${goalId}`);
    return response.data;
  },
  getInvestmentAdvice: async () => {
    const response = await apiClient.get('/agent/investment-recommendations');
    return response.data;
  },
  getMonthlyPlan: async () => {
    const response = await apiClient.get('/agent/monthly-plan');
    return response.data;
  },
  getIncomePrediction: async () => {
    const response = await apiClient.get('/agent/income-prediction');
    return response.data;
  },
  getNudges: async () => {
    const response = await apiClient.get('/agent/nudges');
    return response.data;
  },
};

// Blockchain API
const blockchain = {
  getStatus: async () => {
    const response = await apiClient.get('/blockchain/status');
    return response.data;
  },
  connectWallet: async () => {
    const response = await apiClient.post('/blockchain/connect-wallet');
    return response.data;
  },
  disconnectWallet: async () => {
    const response = await apiClient.post('/blockchain/disconnect-wallet');
    return response.data;
  },
  setEnabled: async (enabled) => {
    const response = await apiClient.put('/blockchain/settings', { enabled });
    return response.data;
  },
  registerWallet: async (walletAddress) => {
    const response = await apiClient.post('/blockchain/register-wallet', { walletAddress });
    return response.data;
  },
  getTransactions: async () => {
    const response = await apiClient.get('/blockchain/transactions');
    return response.data;
  },
  verify: async (txHash) => {
    const response = await apiClient.get(`/blockchain/verify/${txHash}`);
    return response.data;
  },
  getBalance: async () => {
    const response = await apiClient.get('/blockchain/balance');
    return response.data;
  },
};

export default {
  setAuthToken,
  setBaseUrl,
  auth,
  users,
  bankAccounts,
  transactions,
  goals,
  budgets,
  insights,
  chat,
  agent,
  blockchain,
};
