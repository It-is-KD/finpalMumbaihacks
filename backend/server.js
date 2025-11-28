const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const bankAccountRoutes = require('./routes/bankAccounts');
const goalRoutes = require('./routes/goals');
const budgetRoutes = require('./routes/budgets');
const aiRoutes = require('./routes/ai');
const blockchainRoutes = require('./routes/blockchain');
const categoryRoutes = require('./routes/categories');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/transactions', authMiddleware, transactionRoutes);
app.use('/api/bank-accounts', authMiddleware, bankAccountRoutes);
app.use('/api/goals', authMiddleware, goalRoutes);
app.use('/api/budgets', authMiddleware, budgetRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/blockchain', authMiddleware, blockchainRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'FinPal API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🚀 FinPal Backend Server                            ║
  ║                                                       ║
  ║   Server running at: http://${HOST}:${PORT}              ║
  ║                                                       ║
  ║   API Endpoints:                                      ║
  ║   • Auth:         /api/auth                           ║
  ║   • Transactions: /api/transactions                   ║
  ║   • Bank Accounts:/api/bank-accounts                  ║
  ║   • Goals:        /api/goals                          ║
  ║   • Budgets:      /api/budgets                        ║
  ║   • AI:           /api/ai                             ║
  ║   • Blockchain:   /api/blockchain                     ║
  ║   • Categories:   /api/categories                     ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
