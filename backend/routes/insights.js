const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get all insights
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, unreadOnly } = req.query;
    
    let query = 'SELECT * FROM ai_insights WHERE user_id = ?';
    const params = [req.user.userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (unreadOnly === 'true') {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [insights] = await pool.query(query, params);
    res.json({ insights });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

// Mark insight as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE ai_insights SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Insight marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark insight as read' });
  }
});

// Mark insight action taken
router.put('/:id/action', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE ai_insights SET action_taken = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Action recorded' });
  } catch (error) {
    console.error('Mark action error:', error);
    res.status(500).json({ error: 'Failed to record action' });
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE ai_insights SET is_read = TRUE WHERE user_id = ?',
      [req.user.userId]
    );
    res.json({ message: 'All insights marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Get investment recommendations
router.get('/investments', authMiddleware, async (req, res) => {
  try {
    const [recommendations] = await pool.query(
      `SELECT * FROM investment_recommendations 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [req.user.userId]
    );
    res.json({ recommendations });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ error: 'Failed to get investment recommendations' });
  }
});

// Get behavior patterns
router.get('/patterns', authMiddleware, async (req, res) => {
  try {
    const [patterns] = await pool.query(
      `SELECT * FROM user_behavior_patterns 
       WHERE user_id = ? 
       ORDER BY detected_at DESC 
       LIMIT 20`,
      [req.user.userId]
    );
    res.json({ patterns });
  } catch (error) {
    console.error('Get patterns error:', error);
    res.status(500).json({ error: 'Failed to get behavior patterns' });
  }
});

module.exports = router;
