<<<<<<< HEAD
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Backend is exposed via localtunnel so Expo Go works off-LAN
// Current tunnel: https://finpal-backend.loca.lt
// If you restart localtunnel and the URL changes, update this value.
const API_BASE_URL = 'https://rattly-acanthocarpous-debby.ngrok-free.dev/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
  }

  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('authToken');
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning page
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const raw = await response.text();

      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (parseError) {
        console.error('API raw response (non-JSON):', raw?.slice(0, 200));
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    await this.setToken(data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await this.setToken(data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async logout() {
    await this.clearToken();
    await AsyncStorage.removeItem('user');
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: data,
    });
  }

  async upgradePlan() {
    return this.request('/auth/upgrade', { method: 'POST' });
  }

  // Transactions
  async getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transactions?${query}`);
  }

  async addTransaction(transaction) {
    return this.request('/transactions', {
      method: 'POST',
      body: transaction,
    });
  }

  async addBulkTransactions(transactions) {
    return this.request('/transactions/bulk', {
      method: 'POST',
      body: { transactions },
    });
  }

  async getTransactionSummary(period = 'month') {
    return this.request(`/transactions/summary?period=${period}`);
  }

  async categorizeTransaction(id, category) {
    return this.request(`/transactions/${id}/categorize`, {
      method: 'PUT',
      body: { category },
    });
  }

  // Bank Accounts
  async getBankAccounts() {
    return this.request('/bank-accounts');
  }

  async addBankAccount(account) {
    return this.request('/bank-accounts', {
      method: 'POST',
      body: account,
    });
  }

  async updateAccountBalance(id, balance) {
    return this.request(`/bank-accounts/${id}/balance`, {
      method: 'PUT',
      body: { balance },
    });
  }

  async deleteBankAccount(id) {
    return this.request(`/bank-accounts/${id}`, { method: 'DELETE' });
  }

  async getTotalBalance() {
    return this.request('/bank-accounts/total-balance');
  }

  // Goals
  async getGoals() {
    return this.request('/goals');
  }

  async createGoal(goal) {
    return this.request('/goals', {
      method: 'POST',
      body: goal,
    });
  }

  async updateGoalProgress(id, amount) {
    return this.request(`/goals/${id}/progress`, {
      method: 'PUT',
      body: { amount },
    });
  }

  async getGoalSuggestions() {
    return this.request('/goals/suggestions');
  }

  async deleteGoal(id) {
    return this.request(`/goals/${id}`, { method: 'DELETE' });
  }

  // Budgets
  async getBudgets(monthYear) {
    const query = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/budgets${query}`);
  }

  async createBudget(budget) {
    return this.request('/budgets', {
      method: 'POST',
      body: budget,
    });
  }

  async generateSmartBudgets() {
    return this.request('/budgets/generate', { method: 'POST' });
  }

  async deleteBudget(id) {
    return this.request(`/budgets/${id}`, { method: 'DELETE' });
  }

  // AI Features
  async chat(message) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: { message },
    });
  }

  async getFullAnalysis() {
    return this.request('/ai/analysis');
  }

  async getNudges() {
    return this.request('/ai/nudges');
  }

  async getInvestmentRecommendations() {
    return this.request('/ai/investments');
  }

  async getMonthlyRoadmap() {
    return this.request('/ai/roadmap');
  }

  async getBehavioralPatterns() {
    return this.request('/ai/patterns');
  }

  async getInsights() {
    return this.request('/ai/insights');
  }

  async markInsightRead(id) {
    return this.request(`/ai/insights/${id}/read`, { method: 'PUT' });
  }

  async getChatHistory() {
    return this.request('/ai/chat/history');
  }

  // Blockchain
  async verifyBlockchain() {
    return this.request('/blockchain/verify');
  }

  async getTransactionReceipt(transactionId) {
    return this.request(`/blockchain/receipt/${transactionId}`);
  }

  async getBlockchainStats() {
    return this.request('/blockchain/stats');
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }
}

export default new ApiService();
=======
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Backend is exposed via localtunnel so Expo Go works off-LAN
// Current tunnel: https://finpal-backend.loca.lt
// If you restart localtunnel and the URL changes, update this value.
const API_BASE_URL = 'https://rattly-acanthocarpous-debby.ngrok-free.dev/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.token = null;
  }

  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
  }

  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('authToken');
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning page
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const raw = await response.text();

      let data;
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (parseError) {
        console.error('API raw response (non-JSON):', raw?.slice(0, 200));
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
    await this.setToken(data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await this.setToken(data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async logout() {
    await this.clearToken();
    await AsyncStorage.removeItem('user');
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: data,
    });
  }

  async upgradePlan() {
    return this.request('/auth/upgrade', { method: 'POST' });
  }

  // Transactions
  async getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/transactions?${query}`);
  }

  async addTransaction(transaction) {
    return this.request('/transactions', {
      method: 'POST',
      body: transaction,
    });
  }

  async addBulkTransactions(transactions) {
    return this.request('/transactions/bulk', {
      method: 'POST',
      body: { transactions },
    });
  }

  async getTransactionSummary(period = 'month') {
    return this.request(`/transactions/summary?period=${period}`);
  }

  async categorizeTransaction(id, category) {
    return this.request(`/transactions/${id}/categorize`, {
      method: 'PUT',
      body: { category },
    });
  }

  // Bank Accounts
  async getBankAccounts() {
    return this.request('/bank-accounts');
  }

  async addBankAccount(account) {
    return this.request('/bank-accounts', {
      method: 'POST',
      body: account,
    });
  }

  async updateAccountBalance(id, balance) {
    return this.request(`/bank-accounts/${id}/balance`, {
      method: 'PUT',
      body: { balance },
    });
  }

  async deleteBankAccount(id) {
    return this.request(`/bank-accounts/${id}`, { method: 'DELETE' });
  }

  async getTotalBalance() {
    return this.request('/bank-accounts/total-balance');
  }

  // Goals
  async getGoals() {
    return this.request('/goals');
  }

  async createGoal(goal) {
    return this.request('/goals', {
      method: 'POST',
      body: goal,
    });
  }

  async updateGoalProgress(id, amount) {
    return this.request(`/goals/${id}/progress`, {
      method: 'PUT',
      body: { amount },
    });
  }

  async getGoalSuggestions() {
    return this.request('/goals/suggestions');
  }

  async deleteGoal(id) {
    return this.request(`/goals/${id}`, { method: 'DELETE' });
  }

  // Budgets
  async getBudgets(monthYear) {
    const query = monthYear ? `?month_year=${monthYear}` : '';
    return this.request(`/budgets${query}`);
  }

  async createBudget(budget) {
    return this.request('/budgets', {
      method: 'POST',
      body: budget,
    });
  }

  async generateSmartBudgets() {
    return this.request('/budgets/generate', { method: 'POST' });
  }

  async deleteBudget(id) {
    return this.request(`/budgets/${id}`, { method: 'DELETE' });
  }

  // AI Features
  async chat(message) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: { message },
    });
  }

  async getFullAnalysis() {
    return this.request('/ai/analysis');
  }

  async getNudges() {
    return this.request('/ai/nudges');
  }

  async getInvestmentRecommendations() {
    return this.request('/ai/investments');
  }

  async getMonthlyRoadmap() {
    return this.request('/ai/roadmap');
  }

  async getBehavioralPatterns() {
    return this.request('/ai/patterns');
  }

  async getInsights() {
    return this.request('/ai/insights');
  }

  async markInsightRead(id) {
    return this.request(`/ai/insights/${id}/read`, { method: 'PUT' });
  }

  async getChatHistory() {
    return this.request('/ai/chat/history');
  }

  // Blockchain
  async verifyBlockchain() {
    return this.request('/blockchain/verify');
  }

  async getTransactionReceipt(transactionId) {
    return this.request(`/blockchain/receipt/${transactionId}`);
  }

  async getBlockchainStats() {
    return this.request('/blockchain/stats');
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }
}

export default new ApiService();
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
