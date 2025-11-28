const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const FinancialChatAgent = require('../agent/chatAgent');

// Get chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const [messages] = await pool.query(
      'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at ASC LIMIT ?',
      [req.user.userId, parseInt(limit)]
    );
    
    res.json({ messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// Send message
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    // Save user message
    const userMsgId = uuidv4();
    await pool.query(
      'INSERT INTO chat_history (id, user_id, role, message) VALUES (?, ?, ?, ?)',
      [userMsgId, userId, 'user', message]
    );

    // Get user context
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    // Get recent transactions for context
    const [transactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 20',
      [userId]
    );

    // Get goals
    const [goals] = await pool.query(
      'SELECT * FROM goals WHERE user_id = ? AND status = ?',
      [userId, 'active']
    );

    // Get budget alerts
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [budgets] = await pool.query(
      'SELECT * FROM budgets WHERE user_id = ? AND month = ?',
      [userId, currentMonth]
    );

    // Initialize chat agent
    const chatAgent = new FinancialChatAgent();
    
    // Generate response
    const response = await chatAgent.chat(message, {
      user,
      transactions,
      goals,
      budgets
    });

    // Save assistant message
    const assistantMsgId = uuidv4();
    await pool.query(
      'INSERT INTO chat_history (id, user_id, role, message) VALUES (?, ?, ?, ?)',
      [assistantMsgId, userId, 'assistant', response]
    );

    res.json({
      response,
      messageId: assistantMsgId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Clear chat history
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM chat_history WHERE user_id = ?', [req.user.userId]);
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

module.exports = router;
