<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const finpalAgent = require('../agent');

// Chat with AI
router.post('/chat', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message } = req.body;

    // Get user context
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 100',
      [userId]
    );
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);
    const [bankAccounts] = await pool.query('SELECT * FROM bank_accounts WHERE user_id = ?', [userId]);

    const context = {
      userProfile: users[0],
      transactions,
      goals,
      budgets,
      bankAccounts
    };

    // Process message
    const response = await finpalAgent.chat(userId, message, context);

    // Save to chat history
    await pool.query(
      'INSERT INTO chat_history (id, user_id, role, message) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, 'user', message]
    );
    await pool.query(
      'INSERT INTO chat_history (id, user_id, role, message, context) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, 'assistant', response.message, JSON.stringify(response.data)]
    );

    res.json({
      response: response.message,
      type: response.type,
      data: response.data,
      quickReplies: finpalAgent.modules.chatbotAgent.getQuickReplies(response)
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get full analysis
router.get('/analysis', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);

    const analysis = await finpalAgent.runFullAnalysis(
      userId,
      users[0],
      transactions,
      goals,
      budgets
    );

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to run analysis' });
  }
});

// Get nudges
router.get('/nudges', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC',
      [userId]
    );
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);

    const nudges = await finpalAgent.getNudges(transactions, goals, budgets);

    res.json(nudges);
  } catch (error) {
    console.error('Nudges error:', error);
    res.status(500).json({ error: 'Failed to get nudges' });
  }
});

// Get investment recommendations
router.get('/investments', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? AND type = "debit" AND transaction_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)',
      [userId]
    );

    const monthlyExpenses = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3;
    
    const recommendations = await finpalAgent.getInvestmentRecommendations(
      users[0],
      goals,
      monthlyExpenses
    );

    res.json(recommendations);
  } catch (error) {
    console.error('Investment recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get monthly roadmap
router.get('/roadmap', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);

    const roadmap = await finpalAgent.generateRoadmap(
      users[0],
      transactions,
      goals,
      budgets
    );

    res.json(roadmap);
  } catch (error) {
    console.error('Roadmap error:', error);
    res.status(500).json({ error: 'Failed to generate roadmap' });
  }
});

// Get behavioral patterns
router.get('/patterns', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    
    const userProfile = users[0] || {};
    const patterns = await finpalAgent.learnUserPatterns(userId, transactions, userProfile);
    const recommendations = await finpalAgent.modules.behaviorPatternLearner.getPersonalizedRecommendations(patterns, userProfile);

    res.json({ patterns, recommendations });
  } catch (error) {
    console.error('Patterns error:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

// Get insights
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [insights] = await pool.query(
      'SELECT * FROM ai_insights WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY priority DESC, created_at DESC LIMIT 10',
      [userId]
    );

    res.json(insights);
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Mark insight as read
router.put('/insights/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query(
      'UPDATE ai_insights SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Insight marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to update insight' });
  }
});

// Get chat history
router.get('/chat/history', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;

    const [history] = await pool.query(
      'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, parseInt(limit)]
    );

    res.json(history.reverse());
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const finpalAgent = require('../agent');

// Chat with AI
router.post('/chat', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message } = req.body;

    // Get user context
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 100',
      [userId]
    );
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);
    const [bankAccounts] = await pool.query('SELECT * FROM bank_accounts WHERE user_id = ?', [userId]);

    const context = {
      userProfile: users[0],
      transactions,
      goals,
      budgets,
      bankAccounts
    };

    // Process message
    const response = await finpalAgent.chat(userId, message, context);

    // Save to chat history
    await pool.query(
      'INSERT INTO chat_history (id, user_id, role, message) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, 'user', message]
    );
    await pool.query(
      'INSERT INTO chat_history (id, user_id, role, message, context) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, 'assistant', response.message, JSON.stringify(response.data)]
    );

    res.json({
      response: response.message,
      type: response.type,
      data: response.data,
      quickReplies: finpalAgent.modules.chatbotAgent.getQuickReplies(response)
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get full analysis
router.get('/analysis', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);

    const analysis = await finpalAgent.runFullAnalysis(
      userId,
      users[0],
      transactions,
      goals,
      budgets
    );

    res.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to run analysis' });
  }
});

// Get nudges
router.get('/nudges', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC',
      [userId]
    );
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);

    const nudges = await finpalAgent.getNudges(transactions, goals, budgets);

    res.json(nudges);
  } catch (error) {
    console.error('Nudges error:', error);
    res.status(500).json({ error: 'Failed to get nudges' });
  }
});

// Get investment recommendations
router.get('/investments', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? AND type = "debit" AND transaction_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)',
      [userId]
    );

    const monthlyExpenses = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / 3;
    
    const recommendations = await finpalAgent.getInvestmentRecommendations(
      users[0],
      goals,
      monthlyExpenses
    );

    res.json(recommendations);
  } catch (error) {
    console.error('Investment recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get monthly roadmap
router.get('/roadmap', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    const [goals] = await pool.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const [budgets] = await pool.query('SELECT * FROM budgets WHERE user_id = ?', [userId]);

    const roadmap = await finpalAgent.generateRoadmap(
      users[0],
      transactions,
      goals,
      budgets
    );

    res.json(roadmap);
  } catch (error) {
    console.error('Roadmap error:', error);
    res.status(500).json({ error: 'Failed to generate roadmap' });
  }
});

// Get behavioral patterns
router.get('/patterns', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const [transactions] = await pool.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    
    const userProfile = users[0] || {};
    const patterns = await finpalAgent.learnUserPatterns(userId, transactions, userProfile);
    const recommendations = await finpalAgent.modules.behaviorPatternLearner.getPersonalizedRecommendations(patterns, userProfile);

    res.json({ patterns, recommendations });
  } catch (error) {
    console.error('Patterns error:', error);
    res.status(500).json({ error: 'Failed to analyze patterns' });
  }
});

// Get insights
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [insights] = await pool.query(
      'SELECT * FROM ai_insights WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY priority DESC, created_at DESC LIMIT 10',
      [userId]
    );

    res.json(insights);
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Mark insight as read
router.put('/insights/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query(
      'UPDATE ai_insights SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Insight marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to update insight' });
  }
});

// Get chat history
router.get('/chat/history', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;

    const [history] = await pool.query(
      'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, parseInt(limit)]
    );

    res.json(history.reverse());
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

module.exports = router;
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
