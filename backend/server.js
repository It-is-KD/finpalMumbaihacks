const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import ke routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bankAccountRoutes = require('./routes/bankAccounts');
const transactionRoutes = require('./routes/transactions');
const goalRoutes = require('./routes/goals');
const budgetRoutes = require('./routes/budgets');
const insightRoutes = require('./routes/insights');
const chatRoutes = require('./routes/chat');
const blockchainRoutes = require('./routes/blockchain');
const agentRoutes = require('./routes/agent');

// Api ke Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/agent', agentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FinPal API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FinPal Backend running on http://0.0.0.0:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
});

module.exports = app;